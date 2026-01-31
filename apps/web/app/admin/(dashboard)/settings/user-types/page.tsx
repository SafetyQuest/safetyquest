'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

export default function UserTypesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showProgramsModal, setShowProgramsModal] = useState<any>(null);
  const [showCoursesModal, setShowCoursesModal] = useState<any>(null); // ✅ NEW
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: ''
  });

  const queryClient = useQueryClient();

  // Fetch user types (LOGIC PRESERVED)
  const { data: userTypes, isLoading } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Fetch programs for assignment (LOGIC PRESERVED)
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

  // ✅ NEW: Fetch courses for assignment (LOGIC PRESERVED)
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });

  // Fetch user type programs (LOGIC PRESERVED)
  const { data: userTypePrograms } = useQuery({
    queryKey: ['userTypePrograms', showProgramsModal?.id],
    queryFn: async () => {
      if (!showProgramsModal?.id) return null;
      const res = await fetch(`/api/admin/user-types/${showProgramsModal.id}/programs`);
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    },
    enabled: !!showProgramsModal?.id
  });

  // ✅ NEW: Fetch user type courses (LOGIC PRESERVED)
  const { data: userTypeCourses } = useQuery({
    queryKey: ['userTypeCourses', showCoursesModal?.id],
    queryFn: async () => {
      if (!showCoursesModal?.id) return null;
      const res = await fetch(`/api/admin/user-types/${showCoursesModal.id}/courses`);
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    enabled: !!showCoursesModal?.id
  });

  // Create mutation (LOGIC PRESERVED)
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/admin/user-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create user type');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
      resetForm();
    }
  });

  // Update mutation (LOGIC PRESERVED)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const res = await fetch(`/api/admin/user-types/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update user type');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
      resetForm();
    }
  });

  // Delete mutation (LOGIC PRESERVED)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/user-types/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete user type');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
    }
  });

  // Assign program mutation (LOGIC PRESERVED)
  const assignProgramMutation = useMutation({
    mutationFn: async ({ userTypeId, programId }: { userTypeId: string; programId: string }) => {
      const res = await fetch(`/api/admin/user-types/${userTypeId}/programs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programId })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to assign program');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypePrograms'] });
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
    }
  });

  // Unassign program mutation (LOGIC PRESERVED)
  const unassignProgramMutation = useMutation({
    mutationFn: async ({ userTypeId, programId }: { userTypeId: string; programId: string }) => {
      const res = await fetch(`/api/admin/user-types/${userTypeId}/programs/${programId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unassign program');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypePrograms'] });
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
    }
  });

  // ✅ NEW: Assign course mutation (LOGIC PRESERVED)
  const assignCourseMutation = useMutation({
    mutationFn: async ({ userTypeId, courseId }: { userTypeId: string; courseId: string }) => {
      const res = await fetch(`/api/admin/user-types/${userTypeId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId })
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to assign course');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypeCourses'] });
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
    }
  });

  // ✅ NEW: Unassign course mutation (LOGIC PRESERVED)
  const unassignCourseMutation = useMutation({
    mutationFn: async ({ userTypeId, courseId }: { userTypeId: string; courseId: string }) => {
      const res = await fetch(`/api/admin/user-types/${userTypeId}/courses/${courseId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to unassign course');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTypeCourses'] });
      queryClient.invalidateQueries({ queryKey: ['userTypes'] });
    }
  });

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (userType: any) => {
    setFormData({
      name: userType.name,
      slug: userType.slug,
      description: userType.description || ''
    });
    setEditingId(userType.id);
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

  const handleDelete = (userType: any) => {
    const hasUsers = userType._count?.users > 0;
    const hasPrograms = userType._count?.programs > 0;
    const hasCourses = userType._count?.courses > 0; // ✅ NEW

    let message = `Are you sure you want to delete "${userType.name}"?`;
    
    if (hasUsers) {
      alert(`Cannot delete user type. ${userType._count.users} user(s) are assigned to this type. Please reassign them first.`);
      return;
    }

    // ✅ UPDATED: Include courses in warning
    if (hasPrograms || hasCourses) {
      const items = [];
      if (hasPrograms) items.push(`${userType._count.programs} program(s)`);
      if (hasCourses) items.push(`${userType._count.courses} course(s)`);
      
      message = `This user type has ${items.join(' and ')} assigned.\n\nDeleting will remove the automatic assignments, but the programs and courses themselves will remain.\n\nAre you sure?`;
    }

    if (confirm(message)) {
      deleteMutation.mutate(userType.id);
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
    return <div className="text-center py-8"><div className="animate-pulse text-[var(--text-primary)]">Loading...</div></div>;
  }

  return (
    <div className="p-6 bg-[var(--surface)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">User Types</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage user type classifications for automatic program and course assignments
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User Type
        </button>
      </div>

      {/* Form Modal - UPDATED WITH BRAND COLORS */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 max-w-md w-full border border-[var(--border)]">
            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
              {editingId ? 'Edit User Type' : 'Create User Type'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  placeholder="e.g., Permanent Employee"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Slug <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  placeholder="permanent-employee"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Auto-generated from name, used in URLs
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  placeholder="Optional description..."
                />
              </div>

              {(createMutation.isError || updateMutation.isError) && (
                <div className="bg-[var(--danger-light)] text-[var(--danger-dark)] p-3 rounded border border-[var(--danger-light)] text-sm">
                  {createMutation.error?.message || updateMutation.error?.message}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 btn btn-primary disabled:opacity-50"
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
                  className="flex-1 bg-[var(--surface)] text-[var(--text-primary)] py-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Programs Modal - UPDATED WITH BRAND COLORS */}
      {showProgramsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-[var(--border)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Assigned Programs - {showProgramsModal.name}
              </h3>
              <button onClick={() => setShowProgramsModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[--transition-base]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {programs?.map((program: any) => {
                  const isAssigned = userTypePrograms?.some((p: any) => p.id === program.id);
                  return (
                    <div key={program.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]">
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{program.name || program.title}</div>
                        {program.description && (
                          <div className="text-sm text-[var(--text-secondary)]">{program.description}</div>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          if (isAssigned) {
                            unassignProgramMutation.mutate({
                              userTypeId: showProgramsModal.id,
                              programId: program.id
                            });
                          } else {
                            assignProgramMutation.mutate({
                              userTypeId: showProgramsModal.id,
                              programId: program.id
                            });
                          }
                        }}
                        disabled={assignProgramMutation.isPending || unassignProgramMutation.isPending}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-[--transition-base] ${
                          isAssigned
                            ? 'bg-[var(--danger-light)] text-[var(--danger-dark)] hover:bg-[var(--danger)] hover:text-[var(--text-inverse)]'
                            : 'bg-[var(--success-light)] text-[var(--success-dark)] hover:bg-[var(--success)] hover:text-[var(--text-inverse)]'
                        }`}
                      >
                        {isAssigned ? 'Remove' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Courses Modal - UPDATED WITH BRAND COLORS */}
      {showCoursesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[var(--background)] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-[var(--border)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Assigned Courses - {showCoursesModal.name}
              </h3>
              <button onClick={() => setShowCoursesModal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[--transition-base]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-2">
                {courses?.map((course: any) => {
                  const isAssigned = userTypeCourses?.some((c: any) => c.id === course.id);
                  return (
                    <div key={course.id} className="flex items-center justify-between p-3 border border-[var(--border)] rounded hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]">
                      <div>
                        <div className="font-medium text-[var(--text-primary)]">{course.title}</div>
                        {course.description && (
                          <div className="text-sm text-[var(--text-secondary)]">{course.description}</div>
                        )}
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          Difficulty: {course.difficulty}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (isAssigned) {
                            unassignCourseMutation.mutate({
                              userTypeId: showCoursesModal.id,
                              courseId: course.id
                            });
                          } else {
                            assignCourseMutation.mutate({
                              userTypeId: showCoursesModal.id,
                              courseId: course.id
                            });
                          }
                        }}
                        disabled={assignCourseMutation.isPending || unassignCourseMutation.isPending}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-[--transition-base] ${
                          isAssigned
                            ? 'bg-[var(--danger-light)] text-[var(--danger-dark)] hover:bg-[var(--danger)] hover:text-[var(--text-inverse)]'
                            : 'bg-[var(--highlight-light)] text-[var(--highlight-dark)] hover:bg-[var(--highlight)] hover:text-[var(--text-inverse)]'
                        }`}
                      >
                        {isAssigned ? 'Remove' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Types Table - UPDATED WITH BRAND COLORS */}
      <div className="bg-[var(--background)] rounded-lg shadow border border-[var(--border)]">
        {userTypes && userTypes.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <p>No user types found.</p>
            <p className="text-sm mt-1">Click "Add User Type" to create one.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Programs
                </th>
                {/* ✅ NEW: Courses Column */}
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-primary)] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {userTypes?.map((userType: any) => (
                <tr key={userType.id} className="hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]">
                  <td className="px-6 py-4">
                    <span className="font-medium text-[var(--text-primary)]">{userType.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {userType.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-[var(--text-secondary)]">
                    {userType.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="bg-[var(--primary-surface)] text-[var(--primary-dark)] px-2 py-1 rounded-full text-xs font-medium">
                      {userType._count?.users || 0} users
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setShowProgramsModal(userType)}
                      className="bg-[var(--success-light)] text-[var(--success-dark)] px-2 py-1 rounded-full text-xs font-medium hover:bg-[var(--success)] hover:text-[var(--text-inverse)] transition-colors duration-[--transition-base]"
                    >
                      {userType._count?.programs || 0} programs
                    </button>
                  </td>
                  {/* ✅ NEW: Courses Button - UPDATED WITH BRAND COLORS */}
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => setShowCoursesModal(userType)}
                      className="bg-[var(--highlight-light)] text-[var(--highlight-dark)] px-2 py-1 rounded-full text-xs font-medium hover:bg-[var(--highlight)] hover:text-[var(--text-inverse)] transition-colors duration-[--transition-base]"
                    >
                      {userType._count?.courses || 0} courses
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleEdit(userType)}
                        className="text-[var(--primary)] hover:text-[var(--primary-dark)] p-1 transition-colors duration-[--transition-base]"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(userType)}
                        disabled={deleteMutation.isPending}
                        className="text-[var(--danger)] hover:text-[var(--danger-dark)] p-1 disabled:opacity-50 transition-colors duration-[--transition-base]"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {deleteMutation.isError && (
        <div className="mt-4 bg-[var(--danger-light)] text-[var(--danger-dark)] p-4 rounded border border-[var(--danger-light)]">
          {deleteMutation.error.message}
        </div>
      )}
    </div>
  );
}