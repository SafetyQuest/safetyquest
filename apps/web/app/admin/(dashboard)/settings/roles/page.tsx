'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, AlertCircle } from 'lucide-react';

export default function RolesPage() {
  const [selectedRole, setSelectedRole] = useState<any>(null);

  // Fetch roles
  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const PermissionBadge = ({ granted }: { granted: boolean }) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
      granted 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-500'
    }`}>
      {granted ? '✓ Granted' : '✗ Denied'}
    </span>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Roles & Permissions</h2>
        <p className="text-sm text-gray-600 mt-1">
          View role permissions and user assignments
        </p>
      </div>

      {/* Migration Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900">System Roles</h3>
            <p className="text-sm text-blue-800 mt-1">
              Currently using built-in system roles (ADMIN, INSTRUCTOR, LEARNER). 
              Custom role creation requires database migration. 
              Use <strong>User Types</strong> for organizational classifications.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="font-medium">Available Roles</h3>
            </div>
            <div className="divide-y">
              {roles?.map((role: any) => (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                    selectedRole?.id === role.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className={`w-5 h-5 ${
                        role.name === 'ADMIN' ? 'text-purple-600' :
                        role.name === 'INSTRUCTOR' ? 'text-blue-600' :
                        'text-green-600'
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
                    'text-green-600'
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
                </div>
              </div>

              <div className="p-6">
                <h4 className="font-medium mb-4">Permissions</h4>
                
                <div className="space-y-6">
                  {/* User Management */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-lg">👥</span> User Management
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">View</span>
                        <PermissionBadge granted={selectedRole.permissions.users.view} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Create</span>
                        <PermissionBadge granted={selectedRole.permissions.users.create} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Edit</span>
                        <PermissionBadge granted={selectedRole.permissions.users.edit} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Delete</span>
                        <PermissionBadge granted={selectedRole.permissions.users.delete} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Bulk Actions</span>
                        <PermissionBadge granted={selectedRole.permissions.users.bulkActions} />
                      </div>
                    </div>
                  </div>

                  {/* Content Management */}
                  {['programs', 'courses', 'lessons', 'quizzes'].map((section) => (
                    <div key={section}>
                      <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <span className="text-lg">
                          {section === 'programs' ? '📚' : 
                           section === 'courses' ? '📖' :
                           section === 'lessons' ? '📝' : '❓'}
                        </span>
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-6">
                        {['view', 'create', 'edit', 'delete'].map((action) => (
                          <div key={action} className="flex items-center justify-between">
                            <span className="text-sm capitalize">{action}</span>
                            <PermissionBadge granted={selectedRole.permissions[section][action]} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Media */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-lg">🖼️</span> Media Library
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 ml-6">
                      {['view', 'upload', 'delete'].map((action) => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{action}</span>
                          <PermissionBadge granted={selectedRole.permissions.media[action]} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Settings */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-lg">⚙️</span> Settings
                    </h5>
                    <div className="space-y-2 ml-6">
                      {['userTypes', 'roles', 'tags'].map((setting) => (
                        <div key={setting}>
                          <div className="text-sm font-medium mb-1 capitalize">
                            {setting === 'userTypes' ? 'User Types' : setting}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-4">
                            {['view', 'create', 'edit', 'delete'].map((action) => (
                              <div key={action} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{action}</span>
                                <PermissionBadge granted={selectedRole.permissions.settings[setting][action]} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reports */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-lg">📊</span> Reports
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2 ml-6">
                      {['view', 'export'].map((action) => (
                        <div key={action} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{action}</span>
                          <PermissionBadge granted={selectedRole.permissions.reports[action]} />
                        </div>
                      ))}
                    </div>
                  </div>
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
    </div>
  );
}