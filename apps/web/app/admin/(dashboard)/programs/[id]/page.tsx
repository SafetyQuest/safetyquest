'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import AddItemsPanel from '@/components/admin/AddItemPanel';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const programId = params.id as string;
  const queryClient = useQueryClient();
  
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [addingCourseId, setAddingCourseId] = useState<string | null>(null);
  const [removingCourseId, setRemovingCourseId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState<boolean>(false);
  
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
  const { data: allCourses, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });
  
  // Filter available courses based on program data
  const availableCourses = allCourses?.filter((course: any) => {
    const programCourseIds = program?.courses.map((c: any) => c.course.id) || [];
    return !programCourseIds.includes(course.id);
  });
  
  // Add course to program mutation
  const addCourseMutation = useMutation({
    mutationFn: async ({ courseId, order }: { courseId: string; order: number }) => {
      setAddingCourseId(courseId);
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['program', programId] });
      setAddingCourseId(null);
    },
    onError: () => {
      setAddingCourseId(null);
    }
  });
  
  // Remove course from program mutation
  const removeCourse = useMutation({
    mutationFn: async (courseId: string) => {
      setRemovingCourseId(courseId);
      const res = await fetch(`/api/admin/programs/${programId}/courses/${courseId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove course');
      }
      
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['program', programId] });
      setRemovingCourseId(null);
    },
    onError: () => {
      setRemovingCourseId(null);
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
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['program', programId] });
    },
    onError: () => {
      setIsReordering(false);
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
  
  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedCourseId) {
      const sourceIndex = program.courses.findIndex(
        (c: any) => c.course.id === draggedCourseId
      );
      
      if (sourceIndex !== targetIndex) {
        setIsReordering(true);
        await reorderCourse.mutateAsync({
          courseId: draggedCourseId,
          newOrder: targetIndex
        });
        setIsReordering(false);
      }
      
      setDraggedCourseId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="bg-[var(--background)] rounded-lg shadow-md p-8 border border-[var(--border)]">
          <div className="animate-pulse text-[var(--text-primary)]">Loading program details...</div>
        </div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="p-8 text-center">
        <div className="bg-[var(--background)] rounded-lg shadow-md p-8 border border-[var(--border)]">
          <p className="text-[var(--text-primary)]">Program not found.</p>
          <div className="mt-4">
            <Link
              href="/admin/programs"
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]"
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
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{program.title}</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            {program.isActive ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--success)]"></span>
                <span className="text-[var(--success-dark)] font-medium">Active</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]"></span>
                <span className="text-[var(--text-muted)] font-medium">Inactive</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/programs/${programId}/edit`}
            className="btn btn-primary px-4 py-2"
          >
            Edit Program
          </Link>
          <Link
            href="/admin/programs"
            className="btn px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            Back to Programs
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Program Courses - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 mb-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Courses in this Program</h2>
            
            {program.courses.length === 0 ? (
              <p className="text-[var(--text-secondary)]">
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
                      draggable={!isReordering}
                      onDragStart={() => handleDragStart(pc.course.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center justify-between p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:bg-[var(--primary-surface)] transition-colors duration-[--transition-base]
                        ${isReordering ? 'opacity-50 cursor-wait' : 'cursor-move'}`}
                    >
                      <div className="flex items-center">
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-bold
                          ${index % 2 === 0 
                            ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]' 
                            : 'bg-[var(--success-light)] text-[var(--success-dark)]'
                          }`}>
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium text-[var(--text-primary)]">{pc.course.title}</h3>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/courses/${pc.course.id}`}
                          className="flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]"
                          title="View Course Details"
                        >
                          <span>View</span>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleRemoveCourse(pc.course.id, pc.course.title)}
                          disabled={removingCourseId === pc.course.id}
                          className="flex items-center gap-1 text-[var(--danger)] hover:text-[var(--danger-dark)] text-sm cursor-pointer p-1 transition-colors duration-[--transition-base]"
                          title="Remove Course from Program"
                        >
                          {removingCourseId === pc.course.id ? 'Removing...' : 'Remove'}
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Program Details - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Program Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Description</h3>
                <p className="mt-1 text-[var(--text-primary)]">
                  {program.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Default User Type</h3>
                <p className="mt-1 text-[var(--text-primary)]">
                  {program.userTypes.map(ut => ut.userType.name).join(', ')}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Slug</h3>
                <p className="mt-1 text-[var(--text-primary)] break-all">{program.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">ID</h3>
                <p className="mt-1 text-[var(--text-primary)] break-all">{program.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Courses Panel - Container updated with brand colors */}
        <div className="bg-[var(--background)] rounded-lg shadow-md border border-[var(--border)] p-6">
          <AddItemsPanel
            title="Add Courses"
            items={availableCourses}
            onAdd={handleAddCourse}
            isAddingId={addingCourseId}
            createLink="/admin/courses/new"
          />
        </div>
      </div>
    </div>
  );
}