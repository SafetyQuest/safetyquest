'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Trash2, GripVertical } from 'lucide-react';

type CourseFormProps = {
  courseId?: string; // If provided, it's edit mode
  initialData?: any;
};

export default function CourseForm({ courseId, initialData }: CourseFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = !!courseId;
  
  // Get clone parameter from URL
  const cloneFromId = searchParams?.get('clone');
  const isCloneMode = !!cloneFromId && !isEditMode;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    difficulty: 'Beginner',
    quizId: '',
    tagIds: [] as string[],
    programIds: [] as string[]
  });

  const [selectedLessons, setSelectedLessons] = useState<Array<{ id: string; title: string; order: number }>>([]);
  const [draggedLessonIndex, setDraggedLessonIndex] = useState<number | null>(null);
  const [lessonSearch, setLessonSearch] = useState('');

  // Fetch tags (LOGIC PRESERVED)
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    }
  });

  // Fetch programs (LOGIC PRESERVED)
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/programs?isActive=true');
      if (!res.ok) throw new Error('Failed to fetch programs');
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

  // Filter available lessons (not already selected) (LOGIC PRESERVED)
  const availableLessons = allLessons?.filter((lesson: any) => 
    !selectedLessons.some(sl => sl.id === lesson.id)
  ) || [];

  // Filter lessons by search term (LOGIC PRESERVED)
  const filteredLessons = availableLessons.filter((lesson: any) =>
    lesson.title.toLowerCase().includes(lessonSearch.toLowerCase())
  );

  // If editing and initialData not provided, fetch course (LOGIC PRESERVED)
  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: isEditMode && !initialData
  });

  // Fetch course to clone (LOGIC PRESERVED)
  const { data: cloneData, isLoading: isCloneLoading } = useQuery({
    queryKey: ['course', cloneFromId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${cloneFromId}`);
      if (!res.ok) throw new Error('Failed to fetch course to clone');
      return res.json();
    },
    enabled: isCloneMode
  });

  // Fetch quizzes (LOGIC PRESERVED)
  const { data: quizzes } = useQuery({
    queryKey: ['quizzes', 'course', 'unassigned', courseId, courseData?.quizId],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'course',
        unassignedOnly: 'true'
      });
      
      // If editing and has a quiz, include it
      if (isEditMode && courseData?.quizId) {
        params.append('includeQuizId', courseData.quizId);
      }
      
      const res = await fetch(`/api/admin/quizzes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      return res.json();
    },
    enabled: !isEditMode || !!courseData
  });

  // Set initial data (LOGIC PRESERVED)
  useEffect(() => {
    if (isEditMode) {
      const data = initialData || courseData;
      if (data) {
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          difficulty: data.difficulty || 'Beginner',
          quizId: data.quizId || '',
          tagIds: data.tags?.map((tag: any) => tag.tagId) || [],
          programIds: data.programs?.map((prog: any) => prog.programId) || []
        });

        // Set selected lessons with order
        if (data.lessons && Array.isArray(data.lessons)) {
          const lessons = data.lessons
            .sort((a: any, b: any) => a.order - b.order)
            .map((cl: any) => ({
              id: cl.lesson.id,
              title: cl.lesson.title,
              order: cl.order
            }));
          setSelectedLessons(lessons);
        }
      }
    } else if (isCloneMode && cloneData) {
      // Set data from clone source
      setFormData({
        title: `${cloneData.title} (Copy)`,
        slug: `${cloneData.slug}-copy`,
        description: cloneData.description || '',
        difficulty: cloneData.difficulty || 'Beginner',
        quizId: '', // Don't clone quiz
        tagIds: cloneData.tags?.map((tag: any) => tag.tagId) || [],
        programIds: [] // Don't clone program associations
      });

      // Copy lessons
      if (cloneData.lessons && Array.isArray(cloneData.lessons)) {
        const lessons = cloneData.lessons
          .sort((a: any, b: any) => a.order - b.order)
          .map((cl: any, index: number) => ({
            id: cl.lesson.id,
            title: cl.lesson.title,
            order: index
          }));
        setSelectedLessons(lessons);
      }
    }
  }, [isEditMode, isCloneMode, initialData, courseData, cloneData]);

  // Save course mutation (LOGIC PRESERVED)
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = isEditMode ? `/api/admin/courses/${courseId}` : '/api/admin/courses';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save course');
      }

      return res.json();
    },
    onSuccess: async (savedCourse) => {
      const targetCourseId = isEditMode ? courseId : savedCourse.id;

      // Sync lessons with backend (LOGIC PRESERVED)
      if (isEditMode) {
        // For edit mode: sync differences
        const currentLessons = courseData?.lessons || [];
        const currentLessonIds = currentLessons.map((l: any) => l.lesson.id);
        const newLessonIds = selectedLessons.map(l => l.id);

        // Remove lessons that are no longer selected
        for (const currentLesson of currentLessons) {
          if (!newLessonIds.includes(currentLesson.lesson.id)) {
            await fetch(`/api/admin/courses/${targetCourseId}/lessons/${currentLesson.lesson.id}`, {
              method: 'DELETE'
            });
          }
        }

        // Add new lessons and update order for all
        for (const lesson of selectedLessons) {
          if (!currentLessonIds.includes(lesson.id)) {
            // Add new lesson
            await fetch(`/api/admin/courses/${targetCourseId}/lessons`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                lessonId: lesson.id, 
                order: lesson.order 
              })
            });
          } else {
            // Update order for existing lesson
            await fetch(`/api/admin/courses/${targetCourseId}/lessons/${lesson.id}/reorder`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: lesson.order })
            });
          }
        }
      } else {
        // For new courses: add all lessons
        for (const lesson of selectedLessons) {
          await fetch(`/api/admin/courses/${targetCourseId}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              lessonId: lesson.id, 
              order: lesson.order 
            })
          });
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['course', courseId] });
      }
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      router.push('/admin/courses');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    if (name === 'title') {
        const autoSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setFormData({
        ...formData,
        title: value,
        slug: autoSlug
        });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleTagChange = (tagId: string) => {
    setFormData(prev => {
      const tagIds = [...prev.tagIds];
      if (tagIds.includes(tagId)) {
        return { ...prev, tagIds: tagIds.filter(id => id !== tagId) };
      } else {
        return { ...prev, tagIds: [...tagIds, tagId] };
      }
    });
  };

  const handleProgramChange = (programId: string) => {
    setFormData(prev => {
      const programIds = [...prev.programIds];
      if (programIds.includes(programId)) {
        return { ...prev, programIds: programIds.filter(id => id !== programId) };
      } else {
        return { ...prev, programIds: [...programIds, programId] };
      }
    });
  };

  const handleAddLesson = (lessonId: string) => {
    const lesson = allLessons?.find((l: any) => l.id === lessonId);
    if (lesson) {
      const newOrder = selectedLessons.length;
      setSelectedLessons([...selectedLessons, { 
        id: lesson.id, 
        title: lesson.title,
        order: newOrder 
      }]);
    }
  };

  const handleRemoveLesson = (lessonId: string) => {
    const updatedLessons = selectedLessons
      .filter(l => l.id !== lessonId)
      .map((l, index) => ({ ...l, order: index }));
    setSelectedLessons(updatedLessons);
  };

  // Drag and drop handlers (LOGIC PRESERVED)
  const handleDragStart = (index: number) => {
    setDraggedLessonIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedLessonIndex === null || draggedLessonIndex === targetIndex) {
      setDraggedLessonIndex(null);
      return;
    }

    const updatedLessons = [...selectedLessons];
    const [movedLesson] = updatedLessons.splice(draggedLessonIndex, 1);
    updatedLessons.splice(targetIndex, 0, movedLesson);
    
    // Update orders
    const reorderedLessons = updatedLessons.map((lesson, index) => ({
      ...lesson,
      order: index
    }));
    
    setSelectedLessons(reorderedLessons);
    setDraggedLessonIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formDataToSubmit = {
        ...formData,
        quizId: formData.quizId || undefined
    };
    saveMutation.mutate(formDataToSubmit);
  };

  if (isCourseLoading || isCloneLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse text-[var(--text-primary)]">Loading course data...</div></div>;
  }

  return (
    <div className="p-8 bg-[var(--surface)]">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
        {isEditMode ? 'Edit Course' : isCloneMode ? 'Clone Course' : 'Create New Course'}
      </h1>

      {isCloneMode && cloneData && (
        <div className="mb-6 p-4 bg-[var(--primary-surface)] border border-[var(--primary-light)] rounded-md">
          <p className="text-sm text-[var(--primary-dark)]">
            <strong>Cloning from:</strong> {cloneData.title}
          </p>
          <p className="text-xs text-[var(--primary-dark)] mt-1">
            This will copy tags and {cloneData.lessons?.length || 0} lesson(s) to the new course.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course Details - UPDATED WITH BRAND COLORS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Course Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="title">
                    Course Title <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="slug">
                    Slug <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Used in URLs. Auto-generated from title but can be customized.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="difficulty">
                    Difficulty
                  </label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] bg-[var(--background)] text-[var(--text-primary)]"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="quizId">
                    Course Quiz (Optional)
                  </label>
                  <select
                    id="quizId"
                    name="quizId"
                    value={formData.quizId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] bg-[var(--background)] text-[var(--text-primary)]"
                  >
                    <option value="">-- No Quiz --</option>
                    {quizzes?.map((quiz: any) => (
                      <option key={quiz.id} value={quiz.id}>{quiz.title}</option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Course quiz is a comprehensive assessment for all lessons in this course.
                  </p>
                </div>
              </div>
            </div>

            {/* Lessons Section - UPDATED WITH BRAND COLORS */}
            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Course Lessons ({selectedLessons.length})</h2>
              
              {selectedLessons.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">
                  No lessons added yet. Add lessons from the panel on the right.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    Drag and drop to reorder lessons
                  </p>
                  {selectedLessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="flex items-center justify-between p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:bg-[var(--primary-surface)] cursor-move transition-colors duration-[--transition-base]"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-[var(--text-muted)]" />
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index % 2 === 0 
                            ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]' 
                            : 'bg-[var(--success-light)] text-[var(--success-dark)]'
                          }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">{lesson.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLesson(lesson.id)}
                        className="flex items-center gap-1 text-[var(--danger)] hover:text-[var(--danger-dark)] text-sm p-2 hover:bg-[var(--danger-light)] rounded transition-colors duration-[--transition-base]"
                        title="Remove Lesson"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Tags, Programs, and Available Lessons - UPDATED WITH BRAND COLORS */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
              <MultiSelectDropdown
                label="Tags"
                options={tags || []}
                selectedIds={formData.tagIds}
                onChange={handleTagChange}
                labelField="name"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Tags help categorize and filter courses.
              </p>
            </div>

            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
              <MultiSelectDropdown
                label="Programs"
                options={programs || []}
                selectedIds={formData.programIds}
                onChange={handleProgramChange}
                labelField="title"
              />
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Select which programs should include this course.
              </p>
            </div>

            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 sticky top-8 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Available Lessons</h2>
              
              {!allLessons ? (
                <p className="text-[var(--text-secondary)] text-sm">Loading lessons...</p>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search lessons..."
                      value={lessonSearch}
                      onChange={(e) => setLessonSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                    />
                  </div>

                  {/* Lessons List */}
                  {filteredLessons.length === 0 ? (
                    <p className="text-[var(--text-secondary)] text-sm">
                      {lessonSearch ? 'No lessons match your search.' : 'All lessons have been added to this course.'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                      {filteredLessons.map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-medium text-sm text-[var(--text-primary)] truncate">{lesson.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{lesson.difficulty}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddLesson(lesson.id)}
                            className="px-3 py-1 text-xs btn btn-primary flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {saveMutation.isError && (
          <div className="p-3 bg-[var(--danger-light)] text-[var(--danger-dark)] rounded border border-[var(--danger-light)]">
            {saveMutation.error.message}
          </div>
        )}

        <div className="flex justify-end gap-3 bg-[var(--background)] p-4 rounded-lg shadow-md border border-[var(--border)]">
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
            className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-md transition-colors duration-[--transition-base]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 btn btn-primary disabled:opacity-50"
          >
            {saveMutation.isPending
              ? isEditMode ? 'Saving...' : 'Creating...'
              : isEditMode ? 'Save Course' : isCloneMode ? 'Clone Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}