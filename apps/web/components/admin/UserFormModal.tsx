'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

type UserFormData = {
  email: string;
  name: string;
  role: string;
  roleId: string;
  userTypeId: string;
  section: string;
  department: string;
  supervisor: string;
  manager: string;
  designation: string;
};

type UserFormModalProps = {
  userId?: string;
  onClose: () => void;
  onSuccess: () => void;
};

type ProgramPreview = {
  add: string[];
  remove: string[];
  dual: string[];
  loading: boolean;
};

export function UserFormModal({ userId, onClose, onSuccess }: UserFormModalProps) {
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    role: 'LEARNER',
    roleId: '',
    userTypeId: '',
    section: '',
    department: '',
    supervisor: '',
    manager: '',
    designation: ''
  });

  const [programPreview, setProgramPreview] = useState<ProgramPreview | null>(null);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const isEditMode = !!userId;

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

  // Fetch existing user data
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
        role: existingUser.role || 'LEARNER',
        roleId: existingUser.roleId || '',
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
    onSuccess: (data) => {
      // ✅ Capture temporary password if creating new user
      if (!isEditMode && data.temporaryPassword) {
        setTemporaryPassword(data.temporaryPassword);
      } else {
        onSuccess();
        onClose();
      }
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

  // Handle role change - sync both fields
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRoleId = e.target.value;
    const selectedRole = roles?.find((r: any) => r.id === selectedRoleId);
    
    setFormData({
      ...formData,
      roleId: selectedRoleId,
      role: selectedRole?.slug.toUpperCase() || 'LEARNER'
    });
  };

  // Handle user type change with program preview
  const handleUserTypeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUserTypeId = e.target.value;
    setFormData(prev => ({ ...prev, userTypeId: newUserTypeId }));

    // Reset preview
    setProgramPreview(null);

    // Only preview if editing AND userType changed
    if (!isEditMode || !existingUser || newUserTypeId === existingUser.userTypeId) {
      return;
    }

    // Show loading state
    setProgramPreview({ add: [], remove: [], dual: [], loading: true });

    try {
      // Get current user's programs (from the existingUser data we already have)
      const currentPrograms = existingUser.programAssignments || [];
      const currentManualPrograms = new Set(
        currentPrograms
          .filter((pa: any) => pa.isActive && pa.source === 'manual')
          .map((pa: any) => pa.program.id)
      );
      const currentUserTypePrograms = new Set(
        currentPrograms
          .filter((pa: any) => pa.isActive && pa.source === 'usertype')
          .map((pa: any) => pa.program.id)
      );

      // Fetch old user type programs (if existed)
      let oldUserTypePrograms: any[] = [];
      if (existingUser.userTypeId) {
        const oldRes = await fetch(`/api/admin/user-types/${existingUser.userTypeId}/programs`);
        if (oldRes.ok) {
          oldUserTypePrograms = await oldRes.json();
        }
      }

      // Fetch new user type programs
      let newUserTypePrograms: any[] = [];
      if (newUserTypeId) {
        const newRes = await fetch(`/api/admin/user-types/${newUserTypeId}/programs`);
        if (newRes.ok) {
          newUserTypePrograms = await newRes.json();
        }
      }

      // Build lookup sets
      const newUserTypeProgramIds = new Set(newUserTypePrograms.map((p: any) => p.id));
      const oldUserTypeProgramIds = new Set(oldUserTypePrograms.map((p: any) => p.id));

      // Compute changes
      const add = newUserTypePrograms
        .filter((p: any) => 
          !currentManualPrograms.has(p.id) && 
          !currentUserTypePrograms.has(p.id)
        )
        .map((p: any) => p.title || p.name);

      const remove = oldUserTypePrograms
        .filter((p: any) => 
          currentUserTypePrograms.has(p.id) &&
          !newUserTypeProgramIds.has(p.id)
        )
        .map((p: any) => p.title || p.name);

      const dual = newUserTypePrograms
        .filter((p: any) => 
          currentManualPrograms.has(p.id) &&
          !currentUserTypePrograms.has(p.id)
        )
        .map((p: any) => p.title || p.name);

      setProgramPreview({ add, remove, dual, loading: false });
    } catch (error) {
      console.error('Failed to preview program changes:', error);
      setProgramPreview(null);
    }
  };

  // Handle password reset
  const handleResetPassword = async () => {
    if (!confirm('Generate a new random password for this user?')) {
      return;
    }
    
    setIsResetting(true);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewPassword(data.temporaryPassword);
        setShowResetPassword(true);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // ✅ Show password after user creation
  if (temporaryPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h2 className="text-2xl font-bold text-green-600 mb-4">
            ✅ User Created Successfully!
          </h2>
          
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
            <p className="font-semibold text-yellow-800 mb-2">
              ⚠️ Save this password - it won't be shown again!
            </p>
            
            <div className="bg-white p-3 rounded border border-yellow-300">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Temporary Password:
                </label>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  {showPassword ? '👁️ Hide' : '👁️ Show'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={temporaryPassword}
                  readOnly
                  className="flex-1 font-mono text-sm bg-gray-50 border border-gray-300 rounded px-3 py-2"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(temporaryPassword);
                    alert('Password copied to clipboard!');
                  }}
                  className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-4">
            The user should change this password on their first login.
          </p>
          
          <button
            onClick={() => {
              setTemporaryPassword(null);
              onSuccess();
              onClose();
            }}
            className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

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
              disabled={isEditMode}
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

          {/* Role & User Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleRoleChange}
                required
                className="w-full px-3 py-2 border rounded-md"
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

            <div>
              <label className="block text-sm font-medium mb-1">User Type</label>
              <select
                name="userTypeId"
                value={formData.userTypeId}
                onChange={handleUserTypeChange}
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
                Changes user type programs automatically
              </p>
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

          {/* Password Reset Section - Only in Edit Mode */}
          {isEditMode && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Password Management</h3>
              
              {!showResetPassword ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    User passwords are encrypted and cannot be viewed. You can generate a new random password.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:opacity-50"
                  >
                    {isResetting ? 'Generating...' : '🔄 Generate New Password'}
                  </button>
                </div>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                  <p className="font-semibold text-yellow-800 mb-2">
                    ⚠️ New Password Generated - Save it now!
                  </p>
                  
                  <div className="bg-white p-3 rounded border border-yellow-300">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        New Password:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {showPassword ? '👁️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword || ''}
                        readOnly
                        className="flex-1 font-mono text-sm bg-gray-50 border border-gray-300 rounded px-3 py-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword || '');
                          alert('Password copied to clipboard!');
                        }}
                        className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
                      >
                        📋 Copy
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(false)}
                    className="mt-3 text-sm text-gray-600 hover:text-gray-800"
                  >
                    ✓ Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Program Preview Info Box */}
          {programPreview?.loading ? (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex gap-2">
                <div className="animate-pulse w-5 h-5 bg-blue-400 rounded-full"></div>
                <div className="text-sm text-blue-800">Calculating program changes...</div>
              </div>
            </div>
          ) : programPreview ? (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800 flex-1">
                  <strong>Program Changes Preview:</strong>
                  <ul className="mt-1 space-y-1">
                    {programPreview.add.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-green-600 mr-1">✅</span>
                        <span><strong>Add:</strong> {programPreview.add.join(', ')}</span>
                      </li>
                    )}
                    {programPreview.remove.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-red-600 mr-1">❌</span>
                        <span><strong>Remove:</strong> {programPreview.remove.join(', ')}</span>
                      </li>
                    )}
                    {programPreview.dual.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-purple-600 mr-1">↔️</span>
                        <span><strong>Dual:</strong> {programPreview.dual.join(', ')}</span>
                      </li>
                    )}
                    {programPreview.add.length === 0 && 
                     programPreview.remove.length === 0 && 
                     programPreview.dual.length === 0 && (
                      <li>No program changes</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : formData.userTypeId && !isEditMode ? (
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <strong>User Type Programs:</strong> This user will get programs assigned to their user type.
                </div>
              </div>
            </div>
          ) : null}

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