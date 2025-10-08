'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

type UserFormData = {
  email: string;
  name: string;
  role: string;
  userTypeId: string;
  section: string;
  department: string;
  supervisor: string;
  manager: string;
  designation: string;
};

type UserFormModalProps = {
  userId?: string; // If provided, it's edit mode
  onClose: () => void;
  onSuccess: () => void;
};

export function UserFormModal({ userId, onClose, onSuccess }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'LEARNER',
    userTypeId: '',
    section: '',
    department: '',
    supervisor: '',
    manager: '',
    designation: ''
  });

  const isEditMode = !!userId;

  // Fetch user types for dropdown
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Fetch existing user data if editing
  const { data: existingUser } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    },
    enabled: isEditMode
  });

  // Populate form when editing
  useEffect(() => {
    if (existingUser) {
      setFormData({
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        userTypeId: existingUser.userTypeId || '',
        section: existingUser.section || '',
        department: existingUser.department || '',
        supervisor: existingUser.supervisor || '',
        manager: existingUser.manager || '',
        designation: existingUser.designation || ''
      });
    }
  }, [existingUser]);

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const url = isEditMode ? `/api/admin/users/${userId}` : '/api/admin/users';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Operation failed');
      }

      return res.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {isEditMode ? 'Edit User' : 'Add New User'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isEditMode} // Can't change email when editing
              required
              className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Role & User Type - Side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="LEARNER">Learner</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">User Type</label>
              <select
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
            </div>
          </div>

          {/* Department & Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Supervisor & Manager */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Supervisor</label>
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Manager</label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium mb-1">Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Error Display */}
          {mutation.isError && (
            <div className="bg-red-50 text-red-600 p-3 rounded">
              {mutation.error.message}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}