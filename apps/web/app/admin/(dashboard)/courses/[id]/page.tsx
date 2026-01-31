'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Eye, Trash2 } from "lucide-react";
import AddItemsPanel from '@/components/admin/AddItemPanel';

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const queryClient = useQueryClient();
  
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null);
  const [addingLessonId, setAddingLessonId] = useState<string | null>(null);
  const [removingLessonId, setRemovingLessonId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState<boolean>(false);
  
  // Fetch course details (LOGIC PRESERVED)
  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    }
  });
  
  // Fetch all lessons (LOGIC PRESERVED)
  const { data: allLessons } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const res = await fetch('/api/admin/lessons');
      if (!res.ok) throw new Error('Failed to fetch lessons');
      return res.json();
    }
  });
  
  // Filter available lessons based on course data (LOGIC PRESERVED)
  const availableLessons = allLessons?.filter((lesson: any) => {
    const courseLessonIds = course?.lessons.map((l: any) => l.lesson.id) || [];
    return !courseLessonIds.includes(lesson.id);
  });
  
  // Add lesson to course mutation (LOGIC PRESERVED)
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
  
  // Remove lesson from course mutation (LOGIC PRESERVED)
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
  
  // Reorder lesson mutation (LOGIC PRESERVED)
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
    // Get the highest order (LOGIC PRESERVED)
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
  
  // Drag and drop handlers for reordering (LOGIC PRESERVED)
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
      <div className="p-8 text-center bg-[var(--surface)]">
        <div className="bg-[var(--background)] rounded-lg shadow-md p-8 border border-[var(--border)]">
          <div className="animate-pulse text-[var(--text-primary)]">Loading course details...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center bg-[var(--surface)]">
        <div className="bg-[var(--background)] rounded-lg shadow-md p-8 border border-[var(--border)]">
          <p className="text-[var(--text-primary)]">Course not found.</p>
          <div className="mt-4">
            <Link
              href="/admin/courses"
              className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]"
            >
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-[var(--surface)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">{course.title}</h1>
          <p className="mt-1">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
              course.difficulty === 'Beginner' ? 'bg-[var(--success-light)] text-[var(--success-dark)]' :
              course.difficulty === 'Intermediate' ? 'bg-[var(--warning-light)] text-[var(--warning-dark)]' :
              'bg-[var(--danger-light)] text-[var(--danger-dark)]'
            }`}>
              {course.difficulty}
            </span>
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/admin/courses/${courseId}/edit`}
            className="btn btn-primary px-4 py-2"
          >
            Edit Course
          </Link>
          <Link
            href="/admin/courses"
            className="btn px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
          >
            Back to Courses
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Course Lessons - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 mb-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Lessons in this Course</h2>
            
            {course.lessons.length === 0 ? (
              <p className="text-[var(--text-secondary)]">
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
                          <h3 className="font-medium text-[var(--text-primary)]">{cl.lesson.title}</h3>
                          <p className="text-xs text-[var(--text-secondary)]">
                            {cl.lesson.difficulty} • 
                            {cl.lesson.quizId ? 'Has Quiz' : 'No Quiz'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/lessons/${cl.lesson.id}`}
                          className="flex items-center gap-1 text-[var(--primary)] hover:text-[var(--primary-dark)] p-1 transition-colors duration-[--transition-base]"
                          title="View Lesson"
                        >
                          <span>View</span>
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleRemoveLesson(cl.lesson.id, cl.lesson.title)}
                          disabled={removingLessonId === cl.lesson.id}
                          className="flex items-center gap-1 text-[var(--danger)] hover:text-[var(--danger-dark)] text-sm cursor-pointer p-1 transition-colors duration-[--transition-base]"
                          title="Remove Lesson from Course"
                        >
                          {removingLessonId === cl.lesson.id ? 'Removing...' : 'Remove'}
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>

          {/* Course Details - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 mb-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Course Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Description</h3>
                <p className="mt-1 text-[var(--text-primary)]">
                  {course.description || 'No description provided.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Course Quiz</h3>
                <p className="mt-1">
                  {course.quiz ? (
                    <Link href={`/admin/quizzes/${course.quiz.id}`} className="text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]">
                      {course.quiz.title}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-secondary)]">No quiz assigned</span>
                  )}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Slug</h3>
                <p className="mt-1 text-[var(--text-primary)] break-all">{course.slug}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">ID</h3>
                <p className="mt-1 text-[var(--text-primary)] break-all">{course.id}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {course.tags.length === 0 ? (
                    <p className="text-[var(--text-secondary)] text-sm">No tags assigned.</p>
                  ) : (
                    course.tags.map((t: any) => (
                      <span
                        key={t.tagId}
                        className="px-2 py-1 bg-[var(--primary-surface)] text-[var(--primary-dark)] rounded-full text-xs font-semibold"
                      >
                        {t.tag.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Programs Using This Course - UPDATED WITH BRAND COLORS */}
          <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Used in Programs</h2>
            
            {course.programs.length === 0 ? (
              <p className="text-[var(--text-secondary)]">This course isn't used in any programs yet.</p>
            ) : (
              <div className="space-y-2">
                {course.programs.map((pc: any) => (
                  <div key={pc.program.id} className="p-2 bg-[var(--surface)] rounded border border-[var(--border)]">
                    <div className="flex justify-between items-center">
                      <Link href={`/admin/programs/${pc.program.id}`} className="font-medium text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]">
                        {pc.program.title}
                      </Link>
                      <span className="text-xs text-[var(--text-secondary)]">Order: {pc.order + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Available Lessons Panel - Container updated with brand colors */}
        <div className="bg-[var(--background)] rounded-lg shadow-md border border-[var(--border)] p-6">
          <AddItemsPanel
            title="Add Lessons"
            items={availableLessons}
            onAdd={handleAddLesson}
            isAddingId={addingLessonId}
            createLink="/admin/lessons/new"
          />
        </div>
      </div>
    </div>
  );
}