'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const queryClient = useQueryClient();
  
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  
  // Fetch program details
  const { data: program, isLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/programs/${programId}`);
      if (!res.ok) throw new Error('Failed to fetch program');
      return res.json();
    }
  });
  
  // Fetch available courses (for adding to program)
  const { data: availableCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      
      const courses = await res.json();
      
      // Filter out courses already in the program
      if (program) {
        const programCourseIds = program.courses.map((c: any) => c.course.id);
        return courses.filter((c: any) => !programCourseIds.includes(c.id));
      }
      
      return courses;
    },
    enabled: !!program
  });
  
  // Add course to program mutation
  const addCourseMutation = useMutation({
    mutationFn: async ({ courseId, order }: { courseId: string; order: number }) => {
      const res = await fetch(`/api/admin/programs/${programId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, order })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add course');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
  
  // Remove course from program mutation
  const removeCourse = useMutation({
    mutationFn: async (courseId: string) => {
      const res = await fetch(`/api/admin/programs/${programId}/courses/${courseId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove course');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    }
  });
  
  // Reorder course mutation
  const reorderCourse = useMutation({
    mutationFn: async ({ courseId, newOrder }: { courseId: string; newOrder: number }) => {
      const res = await fetch(`/api/admin/programs/${programId}/courses/${courseId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reorder course');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program', programId] });
    }
  });

  const handleAddCourse = (courseId: string) => {
    // Get the highest order
    const highestOrder = program.courses.length > 0 
      ? Math.max(...program.courses.map((c: any) => c.order))
      : -1;
    
    addCourseMutation.mutate({
      courseId,
      order: highestOrder + 1
    });
  };

  const handleRemoveCourse = (courseId: string, courseTitle: string) => {
    if (confirm(`Are you sure you want to remove "${courseTitle}" from this program?`)) {
      removeCourse.mutate(courseId);
    }
  };
  
  // Drag and drop handlers for reordering
  const handleDragStart = (courseId: string) => {
    setDraggedCourseId(courseId);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedCourseId) {
      const sourceIndex = program.courses.findIndex(
        (c: any) => c.course.id === draggedCourseId
      );
      
      if (sourceIndex !== targetIndex) {
        reorderCourse.mutate({
          courseId: draggedCourseId,
          newOrder: targetIndex
        });
      }
      
      setDraggedCourseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Loading program details...
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Program not found.
          <div className="mt-4">
            <Link
              href="/admin/programs"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Programs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{program.title}</h1>
          <p className="text-gray-600">
            {program.isActive ? (
              <span className="text-green-600">● Active</span>
            ) : (
              <span className="text-gray-400">● Inactive</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/programs/${programId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Program
          </Link>
          <Link
            href="/admin/programs"
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Programs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Program Courses */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Courses in this Program</h2>
            
            {program.courses.length === 0 ? (
              <p className="text-gray-600">
                This program doesn't have any courses yet. Add courses from the
                right panel.
              </p>
            ) : (
              <ul className="space-y-3">
                {program.courses
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((pc: any, index: number) => (
                    <li
                      key={pc.course.id}
                      draggable
                      onDragStart={() => handleDragStart(pc.course.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border hover:bg-blue-50 cursor-move"
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-3 text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium">{pc.course.title}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/courses/${pc.course.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleRemoveCourse(pc.course.id, pc.course.title)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Program Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Program Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                <p className="mt-1">
                  {program.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Default User Type</h3>
                <p className="mt-1">
                    {program.userTypes.map(ut => ut.userType.name).join(', ')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Slug</h3>
                <p className="mt-1">{program.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">ID</h3>
                <p className="mt-1">{program.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Courses */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Add Courses</h2>
          
          {availableCourses?.length === 0 ? (
            <p className="text-gray-600">
              No additional courses available. Create new courses first.
            </p>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Filter courses..."
                className="w-full px-3 py-2 border rounded-md mb-3"
              />
              
              {availableCourses?.map((course: any) => (
                <div
                  key={course.id}
                  className="p-3 bg-gray-50 rounded border hover:bg-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{course.title}</h3>
                    <button
                      onClick={() => handleAddCourse(course.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Add to Program
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                    {course.description || 'No description'}
                  </p>
                </div>
              ))}
              
              <div className="pt-3 border-t mt-4">
                <Link
                  href="/admin/courses/new"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Create New Course
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}