'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MultiSelectDropdown from '../MultiSelectDropdown';

type CourseFormProps = {
  courseId?: string; // If provided, it's edit mode
  initialData?: any;
};

export default function CourseForm({ courseId, initialData }: CourseFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    difficulty: 'Beginner',
    quizId: '',
    tagIds: [] as string[],
    programIds: [] as string[]
  });

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    }
  });

  // Fetch programs
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/programs?isActive=true');
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

  // If editing and initialData not provided, fetch course
  const { data: courseData, isLoading: isCourseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/courses/${courseId}`);
      if (!res.ok) throw new Error('Failed to fetch course');
      return res.json();
    },
    enabled: isEditMode && !initialData
  });

  // Fetch quizzes
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
    enabled: !isEditMode || !!courseData // Wait for courseData in edit mode
  });

  // Set initial data
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
      }
    }
  }, [isEditMode, initialData, courseData]);

  // Save course mutation
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
    onSuccess: () => {
    // Invalidate both the courses list AND the specific course
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    if (isEditMode) {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] });
    }
    // Invalidate ALL quiz caches (important!)
    queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    router.push('/admin/courses');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  
    // Auto-generate slug from title
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create a copy of form data with properly formatted quizId
    const formDataToSubmit = {
        ...formData,
        quizId: formData.quizId || undefined // Convert empty string to undefined
    };
    saveMutation.mutate(formDataToSubmit);
  };

  if (isCourseLoading) {
    return <div className="p-8 text-center">Loading course data...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">{isEditMode ? 'Edit Course' : 'Create New Course'}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="title">
              Course Title <span className="text-red-500">*</span>
            </label>
            <input id="title" name="title" type="text" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </label>
            <input id="slug" name="slug" type="text" required value={formData.slug} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
            <p className="text-xs text-gray-500 mt-1">Used in URLs. Auto-generated from title but can be customized.</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="description">
              Description
            </label>
            <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full px-3 py-2 border rounded-md" />
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="difficulty">
              Difficulty
            </label>
            <select id="difficulty" name="difficulty" value={formData.difficulty} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Quiz */}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="quizId">
              Course Quiz (Optional)
            </label>
            <select id="quizId" name="quizId" value={formData.quizId} onChange={handleChange} className="w-full px-3 py-2 border rounded-md">
              <option value="">-- No Quiz --</option>
              {quizzes?.map((quiz: any) => <option key={quiz.id} value={quiz.id}>{quiz.title}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Course quiz is a comprehensive assessment for all lessons in this course.</p>
          </div>

          {saveMutation.isError && <div className="p-3 bg-red-50 text-red-600 rounded">{saveMutation.error.message}</div>}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => router.push('/admin/courses')} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
              {saveMutation.isPending ? isEditMode ? 'Saving...' : 'Creating...' : isEditMode ? 'Save Course' : 'Create Course'}
            </button>
          </div>
        </form>

        {/* Right panel: Tags & Programs */}
        <div className="space-y-6">
          <MultiSelectDropdown label="Tags" options={tags || []} selectedIds={formData.tagIds} onChange={handleTagChange} labelField="name" />
          <p className="text-xs text-gray-500">Tags help categorize and filter courses.</p>

          <MultiSelectDropdown label="Programs" options={programs || []} selectedIds={formData.programIds} onChange={handleProgramChange} labelField="title" />
          <p className="text-xs text-gray-500">Select which programs should include this course.</p>
        </div>
      </div>
    </div>
  );
}