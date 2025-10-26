'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';

type ProgramFormProps = {
  programId?: string; // If provided, it's edit mode
  initialData?: any;
};

export default function ProgramForm({ programId, initialData }: ProgramFormProps) {
  const router = useRouter();
  const isEditMode = !!programId;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    isActive: true,
    userTypeId: ''
  });

  // Fetch user types
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // If editing and initialData not provided, fetch program
  const { data: programData, isLoading: isProgramLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/programs/${programId}`);
      if (!res.ok) throw new Error('Failed to fetch program');
      return res.json();
    },
    enabled: isEditMode && !initialData
  });

  // Set initial data
  useEffect(() => {
    if (isEditMode) {
      const data = initialData || programData;
      if (data) {
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          isActive: data.isActive === undefined ? true : data.isActive,
          userTypeId: data.userTypes?.[0]?.userTypeId || ''
        });
      }
    }
  }, [isEditMode, initialData, programData]);

  // Save program mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const url = isEditMode ? `/api/admin/programs/${programId}` : '/api/admin/programs';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save program');
      }

      return res.json();
    },
    onSuccess: () => {
      router.push('/admin/programs');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Auto-generate slug from title
    if (name === 'title' && !formData.slug) {
      setFormData({
        ...formData,
        title: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isProgramLoading) {
    return <div className="p-8 text-center">Loading program data...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Edit Program' : 'Create New Program'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="title">
            Program Title <span className="text-red-500">*</span>
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
          <label className="block text-sm font-medium mb-1" htmlFor="userTypeId">
            Default User Type
          </label>
          <select
            id="userTypeId"
            name="userTypeId"
            value={formData.userTypeId}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">-- None --</option>
            {userTypes?.map((type: any) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            If set, all users of this type will automatically be assigned to this program.
          </p>
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="mr-2"
            />
            <span className="text-sm font-medium">Active Program</span>
          </label>
          <p className="text-xs text-gray-500 ml-6">
            Inactive programs are not visible to learners but still exist in the database.
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
            onClick={() => router.push('/admin/programs')}
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
              : isEditMode ? 'Save Program' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
}