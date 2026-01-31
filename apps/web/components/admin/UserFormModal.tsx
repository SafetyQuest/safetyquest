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
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);

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
    if (!confirm('Generate a new random password for this user? An email will be sent to the user with the new password.')) {
      return;
    }
    
    setIsResetting(true);
    setEmailStatus(null);
    
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNewPassword(data.temporaryPassword);
        setShowResetPassword(true);
        
        // 🆕 Set email status
        setEmailStatus({
          sent: data.emailSent,
          error: data.emailError
        });
        
        // Show success message
        if (data.emailSent) {
          console.log('✅ Password reset email sent successfully');
        } else {
          console.warn('⚠️ Password generated but email failed:', data.emailError);
        }
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
        <div className="card max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success-light mb-4">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="text-heading-2 text-success-dark">User Created Successfully!</h2>
          </div>
          
          <div className="bg-alert-light border border-alert rounded-lg p-4 mb-6">
            <div className="flex items-start mb-3">
              <span className="text-alert-dark text-xl mr-2 mt-1">⚠️</span>
              <p className="font-semibold text-alert-dark">
                Save this password - it won't be shown again!
              </p>
            </div>
            
            <div className="bg-white border border-alert rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-text-secondary">
                  Temporary Password:
                </label>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                >
                  {showPassword ? '👁️ Hide' : '👁️ Show'}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={temporaryPassword}
                  readOnly
                  className="flex-1 font-mono text-base bg-surface border border-border rounded px-4 py-3"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(temporaryPassword);
                    alert('Password copied to clipboard!');
                  }}
                  className="btn btn-primary whitespace-nowrap"
                >
                  📋 Copy
                </button>
              </div>
            </div>
          </div>
          
          <p className="text-sm text-text-secondary text-center mb-6">
            The user should change this password on their first login.
          </p>
          
          <button
            onClick={() => {
              setTemporaryPassword(null);
              onSuccess();
              onClose();
            }}
            className="btn btn-success w-full"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-heading-3 mb-6 text-center">
          {isEditMode ? 'Edit User Profile' : 'Add New User'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email <span className="text-danger">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isEditMode}
              required
              className="w-full disabled:bg-surface disabled:text-text-muted"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Full Name <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full"
            />
          </div>

          {/* Role & User Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">
                Role <span className="text-danger">*</span>
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleRoleChange}
                required
                className="w-full"
              >
                <option value="">-- Select Role --</option>
                {roles?.map((role: any) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                    {role.isSystem && ' (System)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1.5">
                Roles are managed in Settings → Roles & Permissions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">User Type</label>
              <select
                name="userTypeId"
                value={formData.userTypeId}
                onChange={handleUserTypeChange}
                className="w-full"
              >
                <option value="">-- None --</option>
                {userTypes?.map((type: any) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-text-muted mt-1.5">
                Changes user type programs automatically
              </p>
            </div>
          </div>

          {/* Department & Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Section</label>
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Supervisor & Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Supervisor</label>
              <input
                type="text"
                name="supervisor"
                value={formData.supervisor}
                onChange={handleChange}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Manager</label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleChange}
                className="w-full"
              />
            </div>
          </div>

          {/* Designation */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Designation</label>
            <input
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          {/* Password Reset Section - Only in Edit Mode */}
          {isEditMode && (
            <div className="bg-surface rounded-lg p-5 border border-border">
              <h3 className="text-heading-4 text-text-primary mb-3 flex items-center gap-2">
                <span>🔑</span> Password Management
              </h3>
              
              {!showResetPassword ? (
                <div>
                  <p className="text-sm text-text-secondary mb-4">
                    User passwords are encrypted and cannot be viewed. Generate a new random password and it will be emailed to the user.
                  </p>
                  <button
                    type="button"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    className="btn btn-warning w-full md:w-auto"
                  >
                    {isResetting ? 'Generating...' : '🔄 Generate New Password & Email User'}
                  </button>
                </div>
              ) : (
                <div className="bg-alert-light border border-alert rounded-lg p-5">
                  <div className="flex items-start mb-4">
                    <span className="text-2xl mr-3 mt-1">✅</span>
                    <div>
                      <h4 className="font-semibold text-alert-dark text-lg">New Password Generated</h4>
                      <p className="text-sm text-alert-dark mt-1">
                        Share this securely with the user
                      </p>
                    </div>
                  </div>
                  
                  {/* Email Status Banner */}
                  {emailStatus && (
                    <div className={`mb-4 p-3 rounded-lg ${
                      emailStatus.sent 
                        ? 'bg-success-light border border-success' 
                        : 'bg-danger-light border border-danger'
                    }`}>
                      <div className="flex items-start gap-2">
                        {emailStatus.sent ? (
                          <>
                            <span className="text-success-dark text-xl mt-1">✅</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-success-dark">
                                Email sent successfully!
                              </p>
                              <p className="text-xs text-success-dark mt-1">
                                The user will receive their new password via email shortly.
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-danger-dark text-xl mt-1">⚠️</span>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-danger-dark">
                                Email delivery failed
                              </p>
                              <p className="text-xs text-danger-dark mt-1">
                                Password was generated but email delivery failed. Please share the password below with the user manually.
                              </p>
                              {emailStatus.error && (
                                <p className="text-xs text-danger mt-1 font-mono bg-white p-2 rounded mt-2 border border-danger-light">
                                  Error: {emailStatus.error}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-white border border-border rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-text-secondary">
                        New Password:
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-primary hover:text-primary-dark text-sm font-medium flex items-center gap-1"
                      >
                        {showPassword ? '👁️ Hide' : '👁️ Show'}
                      </button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword || ''}
                        readOnly
                        className="flex-1 font-mono text-base bg-surface border border-border rounded px-4 py-3 min-h-[42px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(newPassword || '');
                          alert('Password copied to clipboard!');
                        }}
                        className="btn btn-primary whitespace-nowrap w-full sm:w-auto"
                      >
                        📋 Copy Password
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-text-secondary mb-4 text-center px-2">
                    {emailStatus?.sent 
                      ? '✅ Password has been emailed to the user. You may also share it manually if needed.'
                      : '⚠️ Please share this password with the user manually since email delivery failed.'
                    }
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPassword(false);
                      setEmailStatus(null);
                    }}
                    className="btn btn-secondary w-full"
                  >
                    ✓ Done
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Program Preview Info Box */}
          {programPreview?.loading ? (
            <div className="bg-primary-surface border border-primary-light rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-sm text-primary-dark font-medium">Calculating program changes...</div>
              </div>
            </div>
          ) : programPreview ? (
            <div className="bg-primary-surface border border-primary-light rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">i</span>
                </div>
                <div className="text-sm text-text-primary flex-1">
                  <strong className="text-primary-dark">Program Changes Preview:</strong>
                  <ul className="mt-2 space-y-1.5">
                    {programPreview.add.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-success text-xl mr-1.5 mt-0.5">✅</span>
                        <span><strong className="text-success-dark">Add:</strong> {programPreview.add.join(', ')}</span>
                      </li>
                    )}
                    {programPreview.remove.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-danger text-xl mr-1.5 mt-0.5">❌</span>
                        <span><strong className="text-danger-dark">Remove:</strong> {programPreview.remove.join(', ')}</span>
                      </li>
                    )}
                    {programPreview.dual.length > 0 && (
                      <li className="flex items-start">
                        <span className="text-highlight text-xl mr-1.5 mt-0.5">↔️</span>
                        <span><strong className="text-highlight-dark">Dual Assignment:</strong> {programPreview.dual.join(', ')}</span>
                      </li>
                    )}
                    {programPreview.add.length === 0 && 
                     programPreview.remove.length === 0 && 
                     programPreview.dual.length === 0 && (
                      <li className="text-text-secondary">No program changes will be applied</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : formData.userTypeId && !isEditMode ? (
            <div className="bg-primary-surface border border-primary-light rounded-lg p-4">
              <div className="flex gap-3">
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">i</span>
                </div>
                <div className="text-sm text-text-primary">
                  <strong className="text-primary-dark">User Type Programs:</strong> This user will automatically receive all programs assigned to their selected user type.
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Display */}
          {mutation.isError && (
            <div className="bg-danger-light border border-danger rounded-lg p-4 text-danger-dark text-sm">
              <div className="flex items-start">
                <span className="text-xl mr-2 mt-0.5">⚠️</span>
                <span>{mutation.error.message}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-1">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary flex-1 py-3 text-base font-medium"
            >
              {mutation.isPending ? 'Saving Changes...' : (isEditMode ? 'Update User Profile' : 'Create New User')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary flex-1 py-3 text-base font-medium bg-surface hover:bg-surface-hover border border-border"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}