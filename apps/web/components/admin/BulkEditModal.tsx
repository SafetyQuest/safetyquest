'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

type BulkEditModalProps = {
  selectedUserIds: string[];
  onClose: () => void;
  onSuccess: () => void;
};

type BulkEditData = {
  role?: string;
  userTypeId?: string;
  section?: string;
  department?: string;
  supervisor?: string;
  manager?: string;
  designation?: string;
};

export function BulkEditModal({ selectedUserIds, onClose, onSuccess }: BulkEditModalProps) {
  const [updateFields, setUpdateFields] = useState({
    role: false,
    userTypeId: false,
    section: false,
    department: false,
    supervisor: false,
    manager: false,
    designation: false
  });

  const [formData, setFormData] = useState<BulkEditData>({
    role: '',
    userTypeId: '',
    section: '',
    department: '',
    supervisor: '',
    manager: '',
    designation: ''
  });

  // Fetch user types for dropdown
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Bulk edit mutation
  const mutation = useMutation({
    mutationFn: async (data: BulkEditData) => {
      const res = await fetch('/api/admin/users/bulk-edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          updates: data
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Bulk edit failed');
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

    // Build update object with only selected fields
    const updates: BulkEditData = {};
    Object.keys(updateFields).forEach((field) => {
      if (updateFields[field as keyof typeof updateFields]) {
        updates[field as keyof BulkEditData] = formData[field as keyof BulkEditData];
      }
    });

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    if (confirm(`Update ${selectedUserIds.length} user(s) with selected fields?`)) {
      mutation.mutate(updates);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const toggleField = (field: keyof typeof updateFields) => {
    setUpdateFields({
      ...updateFields,
      [field]: !updateFields[field]
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Bulk Edit Users</h2>

        <p className="text-sm text-gray-600 mb-4">
          Update {selectedUserIds.length} selected user(s). Check the fields you want to update.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.role}
              onChange={() => toggleField('role')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                disabled={!updateFields.role}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
              >
                <option value="">-- Select Role --</option>
                <option value="LEARNER">Learner</option>
                <option value="INSTRUCTOR">Instructor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>

          {/* User Type */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.userTypeId}
              onChange={() => toggleField('userTypeId')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">User Type</label>
              <select
                name="userTypeId"
                value={formData.userTypeId}
                onChange={handleChange}
                disabled={!updateFields.userTypeId}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
              >
                <option value="">-- Select User Type --</option>
                {userTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.department}
              onChange={() => toggleField('department')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={!updateFields.department}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                placeholder="e.g., Manufacturing"
              />
            </div>
          </div>

          {/* Section */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.section}
              onChange={() => toggleField('section')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                disabled={!updateFields.section}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                placeholder="e.g., Production"
              />
            </div>
          </div>

          {/* Designation */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.designation}
              onChange={() => toggleField('designation')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                disabled={!updateFields.designation}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                placeholder="e.g., Machine Operator"
              />
            </div>
          </div>

          {/* Supervisor */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.supervisor}
              onChange={() => toggleField('supervisor')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Supervisor</label>
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                disabled={!updateFields.supervisor}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                placeholder="Supervisor name"
              />
            </div>
          </div>

          {/* Manager */}
          <div className="flex items-start gap-3 p-3 border rounded-md">
            <input
              type="checkbox"
              checked={updateFields.manager}
              onChange={() => toggleField('manager')}
              className="mt-2 rounded"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Manager</label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                disabled={!updateFields.manager}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
                placeholder="Manager name"
              />
            </div>
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
              {mutation.isPending ? 'Updating...' : 'Update Users'}
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