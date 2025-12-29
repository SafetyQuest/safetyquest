'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X, Loader2 } from 'lucide-react';

export default function TagsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingTag, setViewingTag] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'courses' | 'lessons'>('courses');
  const [formData, setFormData] = useState({
    name: '',
    slug: ''
  });

  const queryClient = useQueryClient();

  // Fetch tags
  const { data: tags, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    }
  });

  // Fetch tag usage details
  const { data: tagUsage, isLoading: usageLoading } = useQuery({
    queryKey: ['tagUsage', viewingTag?.id],
    queryFn: async () => {
      if (!viewingTag?.id) return null;
      const res = await fetch(`/api/admin/tags/${viewingTag.id}/usage`);
      if (!res.ok) throw new Error('Failed to fetch tag usage');
      return res.json();
    },
    enabled: !!viewingTag?.id
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create tag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      resetForm();
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update tag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      resetForm();
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete tag');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (tag: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({
      name: tag.name,
      slug: tag.slug
    });
    setEditingId(tag.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (tag: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const totalUsage = (tag._count?.courses || 0) + (tag._count?.lessons || 0);
    
    let message = `Are you sure you want to delete tag "${tag.name}"?`;
    
    if (totalUsage > 0) {
      message = `This tag is used in ${tag._count?.courses || 0} course(s) and ${tag._count?.lessons || 0} lesson(s).\n\nDeleting will remove it from all associated content.\n\nAre you sure?`;
    }
    
    if (confirm(message)) {
      deleteMutation.mutate(tag.id);
    }
  };

  const handleNameChange = (value: string) => {
    const autoSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({
      ...formData,
      name: value,
      slug: autoSlug
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Tags</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organize and categorize lessons and courses with tags
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add Tag
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">
              {editingId ? 'Edit Tag' : 'Create Tag'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Safety Procedures"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="safety-procedures"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Auto-generated from name, used for filtering
                </p>
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                  {createMutation.error?.message || updateMutation.error?.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingId
                    ? 'Update'
                    : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {viewingTag && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">
                    {viewingTag.name}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Tag Usage Details</p>
                </div>
                <button 
                  onClick={() => {
                    setViewingTag(null);
                    setActiveTab('courses');
                  }} 
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mt-4 border-b">
                <button
                  onClick={() => setActiveTab('courses')}
                  className={`pb-2 px-1 font-medium text-sm transition-colors ${
                    activeTab === 'courses'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Courses ({tagUsage?.courses?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('lessons')}
                  className={`pb-2 px-1 font-medium text-sm transition-colors ${
                    activeTab === 'lessons'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Lessons ({tagUsage?.lessons?.length || 0})
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {usageLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading...</span>
                </div>
              ) : (
                <>
                  {/* Courses Tab */}
                  {activeTab === 'courses' && (
                    <div>
                      {tagUsage?.courses?.length > 0 ? (
                        <div className="space-y-3">
                          {tagUsage.courses.map((course: any) => (
                            <div key={course.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="font-medium text-gray-900">{course.title}</div>
                              {course.description && (
                                <div className="text-sm text-gray-600 mt-1">{course.description}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                Slug: {course.slug}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No courses using this tag</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lessons Tab */}
                  {activeTab === 'lessons' && (
                    <div>
                      {tagUsage?.lessons?.length > 0 ? (
                        <div className="space-y-3">
                          {tagUsage.lessons.map((lesson: any) => (
                            <div key={lesson.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="font-medium text-gray-900">{lesson.title}</div>
                              {lesson.description && (
                                <div className="text-sm text-gray-600 mt-1">{lesson.description}</div>
                              )}
                              <div className="text-xs text-gray-500 mt-2">
                                Slug: {lesson.slug}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <p>No lessons using this tag</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tags Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags && tags.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No tags found.</p>
            <p className="text-sm mt-1">Click "Add Tag" to create one.</p>
          </div>
        ) : (
          tags?.map((tag: any) => (
            <div
              key={tag.id}
              onClick={() => setViewingTag(tag)}
              className="bg-white border rounded-lg p-4 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">{tag.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {tag.slug}
                  </p>
                </div>
                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => handleEdit(tag, e)}
                    className="text-blue-600 hover:text-blue-800 p-1.5 hover:bg-blue-50 rounded transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(tag, e)}
                    disabled={deleteMutation.isPending}
                    className="text-red-600 hover:text-red-800 p-1.5 hover:bg-red-50 rounded disabled:opacity-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-2 pt-3 border-t">
                <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full font-medium">
                  📖 {tag._count?.courses || 0} courses
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-3 py-1.5 rounded-full font-medium">
                  📝 {tag._count?.lessons || 0} lessons
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {deleteMutation.isError && (
        <div className="mt-4 bg-red-50 text-red-600 p-4 rounded">
          {deleteMutation.error.message}
        </div>
      )}
    </div>
  );
}