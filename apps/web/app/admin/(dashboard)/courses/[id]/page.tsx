'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const queryClient = useQueryClient();
  
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [addingLessonId, setAddingLessonId] = useState<string | null>(null);
  const [removingLessonId, setRemovingLessonId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState<boolean>(false);
  
  // Fetch course details
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    }
  });
  
  // Fetch all lessons
  const { data: allLessons } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/lessons');
      if (!res.ok) throw new Error('Failed to fetch lessons');
      return res.json();
    }
  });
  
  // Filter available lessons based on course data
  const availableLessons = allLessons?.filter((lesson: any) => {
    const courseLessonIds = course?.lessons.map((l: any) => l.lesson.id) || [];
    return !courseLessonIds.includes(lesson.id);
  });
  
  // Add lesson to course mutation
  const addLessonMutation = useMutation({
    mutationFn: async ({ lessonId, order }: { lessonId: string; order: number }) => {
      setAddingLessonId(lessonId);
      const res = await fetch(`/api/admin/courses/${courseId}/lessons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, order })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to add lesson');
      }
      
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setAddingLessonId(null);
    },
    onError: () => {
      setAddingLessonId(null);
    }
  });
  
  // Remove lesson from course mutation
  const removeLesson = useMutation({
    mutationFn: async (lessonId: string) => {
      setRemovingLessonId(lessonId);
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to remove lesson');
      }
      
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      setRemovingLessonId(null);
    },
    onError: () => {
      setRemovingLessonId(null);
    }
  });
  
  // Reorder lesson mutation
  const reorderLesson = useMutation({
    mutationFn: async ({ lessonId, newOrder }: { lessonId: string; newOrder: number }) => {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: newOrder })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to reorder lesson');
      }
      
      return res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    },
    onError: () => {
      setIsReordering(false);
    }
  });

  const handleAddLesson = (lessonId: string) => {
    // Get the highest order
    const highestOrder = course.lessons.length > 0 
      ? Math.max(...course.lessons.map((l: any) => l.order))
      : -1;
    
    addLessonMutation.mutate({
      lessonId,
      order: highestOrder + 1
    });
  };

  const handleRemoveLesson = (lessonId: string, lessonTitle: string) => {
    if (confirm(`Are you sure you want to remove "${lessonTitle}" from this course?`)) {
      removeLesson.mutate(lessonId);
    }
  };
  
  // Drag and drop handlers for reordering
  const handleDragStart = (lessonId: string) => {
    setDraggedLessonId(lessonId);
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };
  
  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedLessonId) {
      const sourceIndex = course.lessons.findIndex(
        (l: any) => l.lesson.id === draggedLessonId
      );
      
      if (sourceIndex !== targetIndex) {
        setIsReordering(true);
        await reorderLesson.mutateAsync({
          lessonId: draggedLessonId,
          newOrder: targetIndex
        });
        setIsReordering(false);
      }
      
      setDraggedLessonId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Loading course details...
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          Course not found.
          <div className="mt-4">
            <Link
              href="/admin/courses"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Courses
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
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-600">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              course.difficulty === 'Beginner' ? 'bg-green-100 text-green-800' :
              course.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {course.difficulty}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Edit Course
          </Link>
          <Link
            href="/admin/courses"
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Course Lessons */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Lessons in this Course</h2>
            
            {course.lessons.length === 0 ? (
              <p className="text-gray-600">
                This course doesn't have any lessons yet. Add lessons from the
                right panel.
              </p>
            ) : (
              <ul className="space-y-3">
                {course.lessons
                  .sort((a: any, b: any) => a.order - b.order)
                  .map((cl: any, index: number) => (
                    <li
                      key={cl.lesson.id}
                      draggable={!isReordering}
                      onDragStart={() => handleDragStart(cl.lesson.id)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`flex items-center justify-between p-3 bg-gray-50 rounded border hover:bg-blue-50 
                        ${isReordering ? 'opacity-50 cursor-wait' : 'cursor-move'}`}
                    >
                      <div className="flex items-center">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full mr-3 text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium">{cl.lesson.title}</h3>
                          <p className="text-xs text-gray-600">
                            {cl.lesson.difficulty} • 
                            {cl.lesson.quizId ? ' Has Quiz' : ' No Quiz'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/lessons/${cl.lesson.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleRemoveLesson(cl.lesson.id, cl.lesson.title)}
                          disabled={removingLessonId === cl.lesson.id}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          {removingLessonId === cl.lesson.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Course Details */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Course Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Description</h3>
                <p className="mt-1">
                  {course.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Course Quiz</h3>
                <p className="mt-1">
                  {course.quiz ? (
                    <Link href={`/admin/quizzes/${course.quiz.id}`} className="text-blue-600 hover:text-blue-800">
                      {course.quiz.title}
                    </Link>
                  ) : (
                    'No quiz assigned'
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">Slug</h3>
                <p className="mt-1">{course.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-500">ID</h3>
                <p className="mt-1">{course.id}</p>
              </div>
            </div>
          </div>

          {/* Programs Using This Course */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Used in Programs</h2>
            
            {course.programs.length === 0 ? (
              <p className="text-gray-600">This course isn't used in any programs yet.</p>
            ) : (
              <div className="space-y-2">
                {course.programs.map((pc: any) => (
                  <div key={pc.program.id} className="p-2 bg-gray-50 rounded border">
                    <div className="flex justify-between items-center">
                      <Link href={`/admin/programs/${pc.program.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                        {pc.program.title}
                      </Link>
                      <span className="text-xs text-gray-600">Order: {pc.order + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Lessons */}
        <div className="bg-white rounded-lg shadow-md p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Add Lessons</h2>
          
          {availableLessons?.length === 0 ? (
            <p className="text-gray-600">
              No additional lessons available. Create new lessons first.
            </p>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Filter lessons..."
                className="w-full px-3 py-2 border rounded-md mb-3"
              />
              
              {availableLessons?.map((lesson: any) => (
                <div
                  key={lesson.id}
                  className="p-3 bg-gray-50 rounded border hover:bg-gray-100"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{lesson.title}</h3>
                    <button
                      onClick={() => handleAddLesson(lesson.id)}
                      disabled={addingLessonId === lesson.id}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {addingLessonId === lesson.id ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {lesson.difficulty} • {lesson.steps.length} steps
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                    {lesson.description || 'No description'}
                  </p>
                </div>
              ))}
              
              <div className="pt-3 border-t mt-4">
                <Link
                  href="/admin/lessons/new"
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + Create New Lesson
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}