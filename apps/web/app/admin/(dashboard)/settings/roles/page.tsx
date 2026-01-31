'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Plus, Pencil, Trash2, X, Check } from 'lucide-react';

// Permission structure organized by resource (UNCHANGED)
const PERMISSION_STRUCTURE = [
  {
    resource: 'users',
    label: 'User Management',
    icon: '👥',
    actions: ['view', 'create', 'edit', 'delete', 'bulk']
  },
  {
    resource: 'programs',
    label: 'Programs',
    icon: '📚',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'courses',
    label: 'Courses',
    icon: '📖',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'lessons',
    label: 'Lessons',
    icon: '📝',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'quizzes',
    label: 'Quizzes',
    icon: '❓',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'media',
    label: 'Media',
    icon: '🖼️',
    actions: ['view', 'upload', 'delete']
  },
  // Settings section header
  {
    resource: 'settings-header',
    label: '⚙️ Settings',
    icon: '',
    isHeader: true
  },
  {
    resource: 'settings.user-types',
    label: 'User Types',
    icon: '  👥',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'settings.roles',
    label: 'Roles & Permissions',
    icon: '  🔐',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'settings.tags',
    label: 'Tags',
    icon: '  🏷️',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'badges',
    label: 'Badges',
    icon: '  🏆',
    actions: ['view', 'create', 'edit', 'delete']
  },
  {
    resource: 'reports',
    label: 'Reports',
    icon: '📊',
    actions: ['view', 'export']
  }
];

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Fetch roles (LOGIC PRESERVED)
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Fetch all available permissions (LOGIC PRESERVED)
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      return res.json();
    }
  });

  // Create role mutation (LOGIC PRESERVED)
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowForm(false);
      setEditingRole(null);
    }
  });

  // Update role mutation (LOGIC PRESERVED)
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/admin/roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setShowForm(false);
      setEditingRole(null);
      setSelectedRole(null);
    }
  });

  // Delete role mutation (LOGIC PRESERVED)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/roles/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete role');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSelectedRole(null);
    }
  });

  const handleEdit = (role: any) => {
    setEditingRole(role);
    setShowForm(true);
  };

  const handleDelete = (role: any) => {
    if (confirm(`Are you sure you want to delete "${role.name}"?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const hasPermission = (role: any, resource: string, action: string) => {
    if (!role || !role.permissions) return false;
    const permissionName = `${resource}.${action}`;
    return role.permissions.some((p: any) => p.name === permissionName);
  };

  if (rolesLoading) {
    return <div className="text-center py-8"><div className="animate-pulse text-[var(--text-primary)]">Loading...</div></div>;
  }

  return (
    <div className="p-6 bg-[var(--surface)]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Roles & Permissions</h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Manage role permissions and access control
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setShowForm(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Role Form Modal - UPDATED WITH BRAND COLORS */}
      {showForm && (
        <RoleFormModal
          role={editingRole}
          permissions={permissionsData}
          onClose={() => {
            setShowForm(false);
            setEditingRole(null);
          }}
          onSubmit={(data) => {
            if (editingRole) {
              updateMutation.mutate({ id: editingRole.id, data });
            } else {
              createMutation.mutate(data);
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          error={createMutation.error?.message || updateMutation.error?.message}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Roles List - UPDATED WITH BRAND COLORS */}
        <div className="lg:col-span-1">
          <div className="bg-[var(--background)] rounded-lg shadow border border-[var(--border)]">
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-[var(--text-primary)]">Available Roles</h3>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {roles?.map((role: any) => (
                <div
                  key={role.id}
                  className={`p-4 cursor-pointer hover:bg-[var(--surface-hover)] transition-colors ${
                    selectedRole?.id === role.id ? 'bg-[var(--primary-surface)] border-l-4 border-[var(--primary)]' : ''
                  }`}
                  onClick={() => setSelectedRole(role)}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className={`w-5 h-5 ${
                      role.name === 'ADMIN' ? 'text-[var(--highlight-dark)]' :
                      role.name === 'INSTRUCTOR' ? 'text-[var(--primary)]' :
                      role.isSystem ? 'text-[var(--success-dark)]' : 'text-[var(--warning-dark)]'
                    }`} />
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">{role.name}</div>
                      {role.isSystem && (
                        <span className="text-xs bg-[var(--surface)] text-[var(--text-secondary)] px-2 py-0.5 rounded mt-1 inline-block">
                          System
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{role.userCount}</span>
                    </div>
                    <div className="text-xs">
                      {role.permissions?.length || 0} perms
                    </div>
                  </div>

                  {!role.isSystem && selectedRole?.id === role.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(role);
                        }}
                        className="flex items-center gap-1 text-xs text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors duration-[--transition-base]"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(role);
                        }}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1 text-xs text-[var(--danger)] hover:text-[var(--danger-dark)] disabled:opacity-50 transition-colors duration-[--transition-base]"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Role Details - Table Format - UPDATED WITH BRAND COLORS */}
        <div className="lg:col-span-3">
          {selectedRole ? (
            <div className="bg-[var(--background)] rounded-lg shadow border border-[var(--border)]">
              <div className="p-6 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`w-6 h-6 ${
                      selectedRole.name === 'ADMIN' ? 'text-[var(--highlight-dark)]' :
                      selectedRole.name === 'INSTRUCTOR' ? 'text-[var(--primary)]' :
                      selectedRole.isSystem ? 'text-[var(--success-dark)]' : 'text-[var(--warning-dark)]'
                    }`} />
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">{selectedRole.name}</h3>
                      <p className="text-sm text-[var(--text-secondary)]">{selectedRole.description}</p>
                    </div>
                  </div>
                  {!selectedRole.isSystem && (
                    <button
                      onClick={() => handleEdit(selectedRole)}
                      className="btn btn-primary flex items-center gap-2 text-sm"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Permissions
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                <PermissionsTable role={selectedRole} hasPermission={hasPermission} editable={false} />
              </div>
            </div>
          ) : (
            <div className="bg-[var(--background)] rounded-lg shadow border border-[var(--border)] p-12 text-center text-[var(--text-muted)]">
              <Shield className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)]" />
              <p>Select a role to view its permissions</p>
            </div>
          )}
        </div>
      </div>

      {deleteMutation.isError && (
        <div className="mt-4 bg-[var(--danger-light)] text-[var(--danger-dark)] p-4 rounded border border-[var(--danger-light)]">
          {deleteMutation.error.message}
        </div>
      )}
    </div>
  );
}

// Permissions Table Component (Used in both View and Edit) - UPDATED WITH BRAND COLORS
function PermissionsTable({ 
  role, 
  hasPermission, 
  editable = false,
  selectedPermissions = [],
  onTogglePermission = () => {}
}: any) {
  
  // Get unique actions across all non-header resources (LOGIC PRESERVED)
  const allActions = Array.from(
    new Set(PERMISSION_STRUCTURE.filter(ps => !ps.isHeader).flatMap(ps => ps.actions || []))
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--surface)]">
            <th className="border border-[var(--border)] px-4 py-3 text-left font-semibold text-[var(--text-primary)]">
              Resource
            </th>
            {allActions.map(action => (
              <th key={action} className="border border-[var(--border)] px-4 py-3 text-center font-semibold text-[var(--text-primary)] capitalize">
                {action}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PERMISSION_STRUCTURE.map((permStruct) => {
            // Section header row
            if (permStruct.isHeader) {
              return (
                <tr key={permStruct.resource} className="bg-[var(--surface)]">
                  <td colSpan={allActions.length + 1} className="border border-[var(--border)] px-4 py-2 font-semibold text-[var(--text-primary)]">
                    {permStruct.label}
                  </td>
                </tr>
              );
            }

            // Regular resource row
            return (
              <tr key={permStruct.resource} className="hover:bg-[var(--surface-hover)]">
                <td className="border border-[var(--border)] px-4 py-3">
                  <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                    <span>{permStruct.icon}</span>
                    <span>{permStruct.label}</span>
                  </div>
                </td>
                {allActions.map(action => {
                  const hasAction = permStruct.actions?.includes(action) ?? false;
                  const isGranted = hasAction && hasPermission(role, permStruct.resource, action);
                  const permId = `${permStruct.resource}.${action}`;
                  
                  return (
                    <td key={action} className="border border-[var(--border)] px-4 py-3 text-center">
                      {hasAction ? (
                        editable ? (
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(permId)}
                            onChange={() => onTogglePermission(permId)}
                            className="w-5 h-5 text-[var(--success)] rounded cursor-pointer focus:ring-[var(--primary-light)]"
                          />
                        ) : (
                          <div className="flex justify-center">
                            {isGranted ? (
                              <div className="w-5 h-5 bg-[var(--success)] rounded flex items-center justify-center">
                                <Check className="w-4 h-4 text-[var(--text-inverse)]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 bg-[var(--surface)] border border-[var(--border)] rounded"></div>
                            )}
                          </div>
                        )
                      ) : (
                        <span className="text-[var(--text-muted)]">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Role Form Modal Component - UPDATED WITH BRAND COLORS
function RoleFormModal({ role, permissions, onClose, onSubmit, isLoading, error }: any) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    slug: role?.slug || '',
    description: role?.description || ''
  });

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    role?.permissions?.map((p: any) => p.name) || []
  );

  const handleNameChange = (value: string) => {
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, name: value, slug });
  };

  const togglePermission = (permName: string) => {
    setSelectedPermissions(prev =>
      prev.includes(permName)
        ? prev.filter(p => p !== permName)
        : [...prev, permName]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert permission names to IDs (LOGIC PRESERVED)
    const permissionIds = permissions?.all
      ?.filter((p: any) => selectedPermissions.includes(p.name))
      .map((p: any) => p.id) || [];

    onSubmit({
      ...formData,
      permissionIds
    });
  };

  // Create mock role for table display (LOGIC PRESERVED)
  const mockRole = {
    permissions: permissions?.all?.filter((p: any) => selectedPermissions.includes(p.name)) || []
  };

  const hasPermission = (role: any, resource: string, action: string) => {
    const permissionName = `${resource}.${action}`;
    return selectedPermissions.includes(permissionName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--background)] rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-[var(--border)]">
        <div className="p-6 border-b border-[var(--border)] flex justify-between items-center">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">
            {role ? 'Edit Role' : 'Create Role'}
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors duration-[--transition-base]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Info - UPDATED WITH BRAND COLORS */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                  Role Name <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  placeholder="e.g., SUPERVISOR"
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
                  placeholder="supervisor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  placeholder="Optional description..."
                />
              </div>
            </div>

            {/* Permissions Table - UPDATED WITH BRAND COLORS */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-[var(--text-primary)]">
                  Permissions <span className="text-[var(--danger)]">*</span>
                </label>
                <span className="text-xs text-[var(--text-muted)]">
                  {selectedPermissions.length} selected
                </span>
              </div>
              
              <PermissionsTable
                role={mockRole}
                hasPermission={hasPermission}
                editable={true}
                selectedPermissions={selectedPermissions}
                onTogglePermission={togglePermission}
              />
            </div>

            {error && (
              <div className="bg-[var(--danger-light)] text-[var(--danger-dark)] p-3 rounded border border-[var(--danger-light)] text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-[var(--border)] bg-[var(--surface)] flex gap-3">
            <button
              type="submit"
              disabled={isLoading || selectedPermissions.length === 0}
              className="flex-1 btn btn-primary disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[var(--surface)] text-[var(--text-primary)] py-2 rounded-md hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}