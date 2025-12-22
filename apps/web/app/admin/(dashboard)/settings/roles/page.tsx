'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Plus, Pencil, Trash2, X } from 'lucide-react';

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Fetch roles
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Fetch all available permissions
  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const res = await fetch('/api/admin/permissions');
      if (!res.ok) throw new Error('Failed to fetch permissions');
      return res.json();
    }
  });

  // Create role mutation
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

  // Update role mutation
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
    }
  });

  // Delete role mutation
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

  const hasPermission = (role: any, permissionName: string) => {
    if (!role || !role.permissions) return false;
    return role.permissions.some((p: any) => p.name === permissionName);
  };

  const PermissionBadge = ({ granted }: { granted: boolean }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      granted 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-500'
    }`}>
      {granted ? '✓ Granted' : '✗ Denied'}
    </span>
  );

  if (rolesLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold">Roles & Permissions</h2>
          <p className="text-sm text-gray-600 mt-1">
            View and manage role permissions
          </p>
        </div>
        <button
          onClick={() => {
            setEditingRole(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Create Role
        </button>
      </div>

      {/* Role Form Modal */}
      {showForm && (
        <RoleForm
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-medium">Available Roles</h3>
            </div>
            <div className="divide-y">
              {roles?.map((role: any) => (
                <div
                  key={role.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${
                    selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <button
                    onClick={() => setSelectedRole(role)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Shield className={`w-5 h-5 ${
                          role.name === 'ADMIN' ? 'text-purple-600' :
                          role.name === 'INSTRUCTOR' ? 'text-blue-600' :
                          role.isSystem ? 'text-green-600' : 'text-orange-600'
                        }`} />
                        <div>
                          <div className="font-medium">{role.name}</div>
                          <div className="text-xs text-gray-500">{role.slug}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span className="text-sm">{role.userCount}</span>
                      </div>
                    </div>
                    {role.isSystem && (
                      <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        System Role
                      </span>
                    )}
                  </button>
                  
                  {!role.isSystem && selectedRole?.id === role.id && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <button
                        onClick={() => handleEdit(role)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(role)}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
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

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                  <Shield className={`w-6 h-6 ${
                    selectedRole.name === 'ADMIN' ? 'text-purple-600' :
                    selectedRole.name === 'INSTRUCTOR' ? 'text-blue-600' :
                    selectedRole.isSystem ? 'text-green-600' : 'text-orange-600'
                  }`} />
                  <h3 className="text-xl font-bold">{selectedRole.name}</h3>
                </div>
                <p className="text-gray-600">{selectedRole.description}</p>
                
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{selectedRole.userCount} users</span>
                  </div>
                  {selectedRole.isSystem && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                      Cannot be deleted
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {selectedRole.permissions?.length || 0} permissions
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-medium mb-4">Permissions</h4>
                
                <div className="space-y-6">
                  {/* User Management */}
                  <PermissionSection
                    title="User Management"
                    icon="👥"
                    role={selectedRole}
                    resource="users"
                    actions={['view', 'create', 'edit', 'delete', 'bulk']}
                    hasPermission={hasPermission}
                    PermissionBadge={PermissionBadge}
                  />

                  {/* Content Sections */}
                  {[
                    { key: 'programs', label: 'Programs', icon: '📚' },
                    { key: 'courses', label: 'Courses', icon: '📖' },
                    { key: 'lessons', label: 'Lessons', icon: '📝' },
                    { key: 'quizzes', label: 'Quizzes', icon: '❓' }
                  ].map((section) => (
                    <PermissionSection
                      key={section.key}
                      title={section.label}
                      icon={section.icon}
                      role={selectedRole}
                      resource={section.key}
                      actions={['view', 'create', 'edit', 'delete']}
                      hasPermission={hasPermission}
                      PermissionBadge={PermissionBadge}
                    />
                  ))}

                  {/* Media */}
                  <PermissionSection
                    title="Media Library"
                    icon="🖼️"
                    role={selectedRole}
                    resource="media"
                    actions={['view', 'upload', 'delete']}
                    hasPermission={hasPermission}
                    PermissionBadge={PermissionBadge}
                  />

                  {/* Badges */}
                  <PermissionSection
                    title="Badges"
                    icon="🏆"
                    role={selectedRole}
                    resource="badges"
                    actions={['view', 'create', 'edit', 'delete']}
                    hasPermission={hasPermission}
                    PermissionBadge={PermissionBadge}
                  />

                  {/* Reports */}
                  <PermissionSection
                    title="Reports"
                    icon="📊"
                    role={selectedRole}
                    resource="reports"
                    actions={['view', 'export']}
                    hasPermission={hasPermission}
                    PermissionBadge={PermissionBadge}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <Shield className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Select a role to view its permissions</p>
            </div>
          )}
        </div>
      </div>

      {deleteMutation.isError && (
        <div className="mt-4 bg-red-50 text-red-600 p-4 rounded">
          {deleteMutation.error.message}
        </div>
      )}
    </div>
  );
}

// Helper component for permission sections
function PermissionSection({ title, icon, role, resource, actions, hasPermission, PermissionBadge }: any) {
  return (
    <div>
      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span> {title}
      </h5>
      <div className={`grid grid-cols-2 md:grid-cols-${Math.min(actions.length, 4)} gap-2 ml-6`}>
        {actions.map((action: string) => (
          <div key={action} className="flex items-center justify-between">
            <span className="text-sm capitalize">{action}</span>
            <PermissionBadge granted={hasPermission(role, `${resource}.${action}`)} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Role Form Component
function RoleForm({ role, permissions, onClose, onSubmit, isLoading, error }: any) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    slug: role?.slug || '',
    description: role?.description || '',
    permissionIds: role?.permissions?.map((p: any) => p.id) || []
  });

  const handleNameChange = (value: string) => {
    const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, name: value, slug });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter((id: string) => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  };

  const toggleResource = (resource: string) => {
    const resourcePerms = permissions?.all?.filter((p: any) => p.resource === resource).map((p: any) => p.id) || [];
    const allSelected = resourcePerms.every((id: string) => formData.permissionIds.includes(id));
    
    setFormData(prev => ({
      ...prev,
      permissionIds: allSelected
        ? prev.permissionIds.filter((id: string) => !resourcePerms.includes(id))
        : [...new Set([...prev.permissionIds, ...resourcePerms])]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-bold">
            {role ? 'Edit Role' : 'Create Role'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Role Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., SUPERVISOR"
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
                  placeholder="supervisor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Describe this role..."
                />
              </div>
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium mb-3">
                Permissions <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 ml-2">
                  ({formData.permissionIds.length} selected)
                </span>
              </label>

              <div className="space-y-4 border rounded-md p-4 max-h-96 overflow-y-auto">
                {permissions?.grouped && Object.entries(permissions.grouped).map(([resource, perms]: any) => {
                  const resourcePerms = perms.map((p: any) => p.id);
                  const allSelected = resourcePerms.every((id: string) => formData.permissionIds.includes(id));
                  const someSelected = resourcePerms.some((id: string) => formData.permissionIds.includes(id));

                  return (
                    <div key={resource} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someSelected && !allSelected;
                          }}
                          onChange={() => toggleResource(resource)}
                          className="rounded"
                        />
                        <label className="font-medium capitalize">{resource}</label>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                        {perms.map((perm: any) => (
                          <label key={perm.id} className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={formData.permissionIds.includes(perm.id)}
                              onChange={() => togglePermission(perm.id)}
                              className="rounded"
                            />
                            <span className="capitalize">{perm.action}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={isLoading || formData.permissionIds.length === 0}
                className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
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
    </div>
  );
}