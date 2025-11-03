'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

type CourseFormProps = {
  courseId?: string; // If provided, it's edit mode
  initialData?: any;
};

export default function CourseForm({ courseId, initialData }: CourseFormProps) {
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

  // Fetch quizzes
  const { data: quizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/quizzes?type=course');
      if (!res.ok) throw new Error('Failed to fetch quizzes');
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
      router.push('/admin/courses');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate slug from title
    if (name === 'title' && !formData.slug) {
      setFormData({
        ...formData,
        title: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      });
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
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Edit Course' : 'Create New Course'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={formData.title}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="slug">
            Slug <span className="text-red-500">*</span>
          </label>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={formData.slug}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">
            Used in URLs. Auto-generated from title but can be customized.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="difficulty">
            Difficulty
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={formData.difficulty}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="quizId">
            Course Quiz (Optional)
          </label>
          <select
            id="quizId"
            name="quizId"
            value={formData.quizId}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">-- No Quiz --</option>
            {quizzes?.map((quiz: any) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Course quiz is a comprehensive assessment for all lessons in this course.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Tags
          </label>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {tags?.length === 0 ? (
              <p className="text-gray-500 text-sm">No tags available. Create some tags first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {tags?.map((tag: any) => (
                  <label key={tag.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.tagIds.includes(tag.id)}
                      onChange={() => handleTagChange(tag.id)}
                      className="mr-2"
                    />
                    <span>{tag.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Tags help categorize and filter courses.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            Programs
          </label>
          <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
            {programs?.length === 0 ? (
              <p className="text-gray-500 text-sm">No programs available. Create some programs first.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2">
                {programs?.map((program: any) => (
                  <label key={program.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.programIds.includes(program.id)}
                      onChange={() => handleProgramChange(program.id)}
                      className="mr-2"
                    />
                    <span>{program.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select which programs should include this course.
          </p>
        </div>

        {saveMutation.isError && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
            {saveMutation.error.message}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin/courses')}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saveMutation.isPending
              ? isEditMode ? 'Saving...' : 'Creating...'
              : isEditMode ? 'Save Course' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
}