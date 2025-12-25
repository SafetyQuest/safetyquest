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
  roleId?: string;
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
    roleId: '',
    userTypeId: '',
    section: '',
    department: '',
    supervisor: '',
    manager: '',
    designation: ''
  });

  // NEW: Warning modal state
  const [showUserTypeWarning, setShowUserTypeWarning] = useState(false);

  // Fetch user types
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Fetch roles
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Fetch selected users (to calculate impact)
  const { data: selectedUsers } = useQuery({
    queryKey: ['selectedUsers', selectedUserIds],
    queryFn: async () => {
      const res = await fetch('/api/admin/users?' + new URLSearchParams({
        ids: selectedUserIds.join(',')
      }));
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return data.users;
    },
    enabled: selectedUserIds.length > 0
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
    onSuccess: (data) => {
      // Show success message with program sync stats if available
      if (data.programSync) {
        alert(data.message);
      }
      onSuccess();
      onClose();
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle role change - sync both fields
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = e.target.value;
    const selectedRole = roles?.find((r: any) => r.id === selectedRoleId);
    
    setFormData({
      ...formData,
      roleId: selectedRoleId,
      role: selectedRole?.slug.toUpperCase() || ''
    });
  };

  // Show warning when user type changes
  const showUserTypeWarningModal = () => {
    setShowUserTypeWarning(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build update object
    const updates: BulkEditData = {};
    Object.keys(updateFields).forEach((field) => {
      if (updateFields[field as keyof typeof updateFields]) {
        if (field === 'role') {
          updates.roleId = formData.roleId;
          updates.role = formData.role;
        } else {
          updates[field as keyof BulkEditData] = formData[field as keyof BulkEditData];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      alert('Please select at least one field to update');
      return;
    }

    // If changing user type, show warning
    if (updates.userTypeId !== undefined) {
      showUserTypeWarningModal();
      return;
    }

    // Otherwise proceed normally
    if (confirm(`Update ${selectedUserIds.length} user(s) with selected fields?`)) {
      mutation.mutate(updates);
    }
  };

  const handleUserTypeConfirm = () => {
    setShowUserTypeWarning(false);
    
    // Build final updates
    const updates: BulkEditData = {};
    Object.keys(updateFields).forEach((field) => {
      if (updateFields[field as keyof typeof updateFields]) {
        if (field === 'role') {
          updates.roleId = formData.roleId;
          updates.role = formData.role;
        } else {
          updates[field as keyof BulkEditData] = formData[field as keyof BulkEditData];
        }
      }
    });
    
    mutation.mutate(updates);
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
                name="roleId"
                value={formData.roleId}
                onChange={handleRoleChange}
                disabled={!updateFields.role}
                className="w-full px-3 py-2 border rounded-md disabled:bg-gray-100"
              >
                <option value="">-- Select Role --</option>
                {roles?.map((role: any) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.isSystem && ' (System)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Roles are managed in Settings → Roles & Permissions
              </p>
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
              <p className="text-xs text-amber-600 mt-1">
                ⚠️ Changing user type will sync programs for all selected users
              </p>
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

      {/* User Type Change Warning Modal */}
      {showUserTypeWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full shadow-xl">
            <div className="text-amber-600 mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
              Confirm Program Sync
            </h3>
            
            <p className="text-gray-600 mb-4 text-center">
              Changing user type for <strong>{selectedUserIds.length} user(s)</strong> will automatically sync their programs:
            </p>
            
            <ul className="space-y-2 mb-6 bg-gray-50 rounded-lg p-4">
              <li className="flex items-start gap-2">
                <span className="text-red-600 text-lg">❌</span>
                <span className="text-sm text-gray-700">Remove old user type programs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 text-lg">✅</span>
                <span className="text-sm text-gray-700">Add new user type programs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 text-lg">↔️</span>
                <span className="text-sm text-gray-700">Preserve manual assignments (may become dual)</span>
              </li>
            </ul>
            
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800 mb-6">
              <strong>Note:</strong> This operation syncs programs for all selected users. Manual assignments will remain intact and may become dual assignments.
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleUserTypeConfirm}
                disabled={mutation.isPending}
                className="flex-1 bg-amber-600 text-white py-2 rounded-md hover:bg-amber-700 disabled:opacity-50 font-medium"
              >
                {mutation.isPending ? 'Processing...' : 'Confirm & Sync Programs'}
              </button>
              <button
                onClick={() => setShowUserTypeWarning(false)}
                disabled={mutation.isPending}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}