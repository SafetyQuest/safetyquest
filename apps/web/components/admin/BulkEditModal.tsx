'use client';

import { useState, useEffect } from 'react';
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

  // ✅ Add requestClose function
  const requestClose = () => {
    // Prevent closing when nested warning modal is open - close warning instead
    if (showUserTypeWarning) {
      setShowUserTypeWarning(false);
      return;
    }
    
    const hasSelections = Object.values(updateFields).some(Boolean);
    const hasEdits = Object.values(formData).some(val => val !== '');
    
    if (!hasSelections && !hasEdits) {
      onClose();
      return;
    }
    
    if (confirm('You have made selections in the bulk edit form but haven\'t applied them yet. Are you sure you want to leave without saving?')) {
      onClose();
    }
  };

  // Fetch user types (LOGIC PRESERVED)
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Fetch roles (LOGIC PRESERVED)
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Fetch selected users (LOGIC PRESERVED)
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

  // Bulk edit mutation (LOGIC PRESERVED)
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

  // Handle role change - sync both fields (LOGIC PRESERVED)
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = e.target.value;
    const selectedRole = roles?.find((r: any) => r.id === selectedRoleId);
    
    setFormData({
      ...formData,
      roleId: selectedRoleId,
      role: selectedRole?.slug.toUpperCase() || ''
    });
  };

  // Show warning when user type changes (LOGIC PRESERVED)
  const showUserTypeWarningModal = () => {
    setShowUserTypeWarning(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build update object (LOGIC PRESERVED)
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

    // If changing user type, show warning (LOGIC PRESERVED)
    if (updates.userTypeId !== undefined) {
      showUserTypeWarningModal();
      return;
    }

    // Otherwise proceed normally (LOGIC PRESERVED)
    if (confirm(`Update ${selectedUserIds.length} user(s) with selected fields?`)) {
      mutation.mutate(updates);
    }
  };

  const handleUserTypeConfirm = () => {
    setShowUserTypeWarning(false);
    
    // Build final updates (LOGIC PRESERVED)
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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [requestClose, showUserTypeWarning]);


  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !showUserTypeWarning) {
          requestClose();
        }
      }}
    >
      <div className="bg-[var(--background)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Bulk Edit Users</h2>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Update {selectedUserIds.length} selected user(s). Check the fields you want to update.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.role}
              onChange={() => toggleField('role')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Role</label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleRoleChange}
                disabled={!updateFields.role}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
              >
                <option value="">-- Select Role --</option>
                {roles?.map((role: any) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.isSystem && ' (System)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Roles are managed in Settings → Roles & Permissions
              </p>
            </div>
          </div>

          {/* User Type - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.userTypeId}
              onChange={() => toggleField('userTypeId')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">User Type</label>
              <select
                name="userTypeId"
                value={formData.userTypeId}
                onChange={handleChange}
                disabled={!updateFields.userTypeId}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
              >
                <option value="">-- Select User Type --</option>
                {userTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-[var(--warning-dark)] mt-1 flex items-start gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Changing user type will sync programs for all selected users</span>
              </p>
            </div>
          </div>

          {/* Department - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.department}
              onChange={() => toggleField('department')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                disabled={!updateFields.department}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
                placeholder="e.g., Manufacturing"
              />
            </div>
          </div>

          {/* Section - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.section}
              onChange={() => toggleField('section')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                disabled={!updateFields.section}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
                placeholder="e.g., Production"
              />
            </div>
          </div>

          {/* Designation - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.designation}
              onChange={() => toggleField('designation')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Designation</label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                disabled={!updateFields.designation}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
                placeholder="e.g., Machine Operator"
              />
            </div>
          </div>

          {/* Supervisor - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.supervisor}
              onChange={() => toggleField('supervisor')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Supervisor</label>
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                disabled={!updateFields.supervisor}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
                placeholder="Supervisor name"
              />
            </div>
          </div>

          {/* Manager - UPDATED WITH BRAND COLORS */}
          <div className="flex items-start gap-3 p-3 border border-[var(--border)] rounded-md">
            <input
              type="checkbox"
              checked={updateFields.manager}
              onChange={() => toggleField('manager')}
              className="mt-2 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
            />
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Manager</label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                disabled={!updateFields.manager}
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] disabled:bg-[var(--surface)] disabled:text-[var(--text-muted)]"
                placeholder="Manager name"
              />
            </div>
          </div>

          {/* Error Display - UPDATED WITH BRAND COLORS */}
          {mutation.isError && (
            <div className="bg-[var(--danger-light)] text-[var(--danger-dark)] p-3 rounded border border-[var(--danger-light)]">
              {mutation.error.message}
            </div>
          )}

          {/* Action Buttons - UPDATED WITH BRAND COLORS */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 bg-[var(--primary)] text-[var(--text-inverse)] py-2 rounded-md hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors duration-[--transition-base]"
            >
              {mutation.isPending ? 'Updating...' : 'Update Users'}
            </button>
            <button
              type="button"
              onClick={requestClose}
              className="flex-1 bg-[var(--surface)] text-[var(--text-primary)] py-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* User Type Change Warning Modal - UPDATED WITH BRAND COLORS */}
      {showUserTypeWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-[var(--background)] rounded-lg p-6 max-w-lg w-full shadow-xl border border-[var(--border)]">
            <div className="text-[var(--warning-dark)] mb-4 flex justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 text-center">
              Confirm Program Sync
            </h3>
            
            <p className="text-[var(--text-secondary)] mb-4 text-center">
              Changing user type for <strong>{selectedUserIds.length} user(s)</strong> will automatically sync their programs:
            </p>
            
            <ul className="space-y-2 mb-6 bg-[var(--surface)] rounded-lg p-4">
              <li className="flex items-start gap-2">
                <span className="text-[var(--danger)] text-lg">❌</span>
                <span className="text-sm text-[var(--text-primary)]">Remove old user type programs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--success)] text-lg">✅</span>
                <span className="text-sm text-[var(--text-primary)]">Add new user type programs</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--highlight)] text-lg">↔️</span>
                <span className="text-sm text-[var(--text-primary)]">Preserve manual assignments (may become dual)</span>
              </li>
            </ul>
            
            <div className="bg-[var(--warning-light)] border border-[var(--warning)] rounded p-3 text-sm text-[var(--warning-dark)] mb-6">
              <strong>Note:</strong> This operation syncs programs for all selected users. Manual assignments will remain intact and may become dual assignments.
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={handleUserTypeConfirm}
                disabled={mutation.isPending}
                className="flex-1 bg-[var(--warning)] text-[var(--text-inverse)] py-2 rounded-md hover:bg-[var(--warning-dark)] disabled:opacity-50 font-medium transition-colors duration-[--transition-base]"
              >
                {mutation.isPending ? 'Processing...' : 'Confirm & Sync Programs'}
              </button>
              <button
                onClick={() => setShowUserTypeWarning(false)}
                disabled={mutation.isPending}
                className="flex-1 bg-[var(--surface)] text-[var(--text-primary)] py-2 rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors duration-[--transition-base]"
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