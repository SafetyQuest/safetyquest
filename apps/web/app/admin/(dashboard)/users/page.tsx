'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { CSVImportModal } from '@/components/admin/CSVImportModal';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { BulkAssignModal } from '@/components/admin/BulkAssignModal';
import { BulkEditModal } from '@/components/admin/BulkEditModal';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  section: string | null;
  department: string | null;
  designation: string | null;
  supervisor: string | null;
  manager: string | null;
  userType: { id: string; name: string } | null;
  programAssignments: Array<{
    program: { id: string; title: string };
    source: string;
    isActive: boolean;
  }>;
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    section: '',
    department: '',
    userTypeId: '',
    role: ''
  });
  const [showImport, setShowImport] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState<{ field: string; direction: 'asc' | 'desc' } | null>(null);
  const [columnVisibility, setColumnVisibility] = useState({
    email: true,
    name: true,
    role: true,
    userType: true,
    department: true,
    section: true,
    designation: true,
    supervisor: true,
    manager: true,
    programs: true
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const queryClient = useQueryClient();

  // Sort function
  const handleSort = (field: string) => {
    setSorting(prev => {
      if (prev?.field === field) {
        // Toggle direction
        return prev.direction === 'asc' 
          ? { field, direction: 'desc' }
          : null; // Remove sorting on third click
      }
      return { field, direction: 'asc' };
    });
  };

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        search,
        ...filters
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  // Update user mutation
  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<User> }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // Bulk invite mutation
  const bulkInvite = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      if (!res.ok) throw new Error('Failed to send invitations');
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Successfully sent ${data.successful} invitation(s)!`);
      setSelectedUserIds([]);
    }
  });

  // Bulk delete mutation
  const bulkDelete = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      if (!res.ok) throw new Error('Failed to delete users');
      return res.json();
    },
    onSuccess: (data) => {
      alert(`Successfully deleted ${data.count} user(s)!`);
      setSelectedUserIds([]);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  // Bulk delete mutation
  const bulkDeleteUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      if (!res.ok) throw new Error('Failed to delete users');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUserIds([]);
    }
  });

  // Bulk invite mutation
  const bulkInviteUsers = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds })
      });
      if (!res.ok) throw new Error('Failed to send invitations');
      return res.json();
    },
    onSuccess: () => {
      alert('Invitations sent successfully!');
    }
  });

  // Memoized sorted users to prevent re-sorting on every render
  const sortedUsers = useMemo(() => {
    const users = data?.users || [];
    if (!sorting) return users;
    
    return [...users].sort((a, b) => {
      let aVal: any = a[sorting.field as keyof User];
      let bVal: any = b[sorting.field as keyof User];
      
      // Handle nested userType
      if (sorting.field === 'userType') {
        aVal = a.userType?.name || '';
        bVal = b.userType?.name || '';
      }
      
      // Handle null values
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
      // Convert to string for comparison
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      
      if (sorting.direction === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [data?.users, sorting]);

  const columnHelper = createColumnHelper<User>();

  const SortableHeader = ({ field, label }: { field: string; label: string }) => (
    <div 
      className="flex items-center gap-1 cursor-pointer select-none hover:text-gray-700"
      onClick={() => handleSort(field)}
    >
      <span>{label}</span>
      {sorting?.field === field && (
        <span className="text-xs">
          {sorting.direction === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </div>
  );

  const columns = [
    columnHelper.display({
      id: 'select',
      header: () => {
        const allUserIds = data?.users?.map((u: User) => u.id) || [];
        const allSelected = allUserIds.length > 0 && allUserIds.every((id: string) => selectedUserIds.includes(id));
        const someSelected = allUserIds.some((id: string) => selectedUserIds.includes(id));
        
        return (
          <input
            type="checkbox"
            checked={allSelected}
            ref={(input) => {
              if (input) {
                input.indeterminate = someSelected && !allSelected;
              }
            }}
            onChange={() => {
              if (allSelected) {
                // Deselect all
                setSelectedUserIds([]);
              } else {
                // Select all
                setSelectedUserIds(allUserIds);
              }
            }}
            className="rounded"
          />
        );
      },
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={selectedUserIds.includes(row.original.id)}
          onChange={() => {
            setSelectedUserIds(prev =>
              prev.includes(row.original.id)
                ? prev.filter(id => id !== row.original.id)
                : [...prev, row.original.id]
            );
          }}
          className="rounded"
        />
      )
    }),
    ...(columnVisibility.email ? [columnHelper.accessor('email', {
      header: () => <SortableHeader field="email" label="Email" />,
      cell: (info) => (
        <div className="font-medium">{info.getValue()}</div>
      )
    })] : []),
    ...(columnVisibility.name ? [columnHelper.accessor('name', {
      header: () => <SortableHeader field="name" label="Name" />,
      cell: (info) => info.getValue()
    })] : []),
    ...(columnVisibility.role ? [columnHelper.accessor('role', {
      header: () => <SortableHeader field="role" label="Role" />,
      cell: (info) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          info.getValue() === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
          info.getValue() === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {info.getValue()}
        </span>
      )
    })] : []),
    ...(columnVisibility.userType ? [columnHelper.accessor('userType.name', {
      header: () => <SortableHeader field="userType" label="User Type" />,
      cell: (info) => info.getValue() || '—'
    })] : []),
    ...(columnVisibility.department ? [columnHelper.accessor('department', {
      header: () => <SortableHeader field="department" label="Department" />,
      cell: (info) => info.getValue() || '—'
    })] : []),
    ...(columnVisibility.section ? [columnHelper.accessor('section', {
      header: () => <SortableHeader field="section" label="Section" />,
      cell: (info) => info.getValue() || '—'
    })] : []),
    ...(columnVisibility.designation ? [columnHelper.accessor('designation', {
      header: () => <SortableHeader field="designation" label="Designation" />,
      cell: (info) => info.getValue() || '—'
    })] : []),
    ...(columnVisibility.supervisor ? [columnHelper.accessor('supervisor', {
      header: () => <SortableHeader field="supervisor" label="Supervisor" />,
      cell: (info) => info.getValue() || '—'
    })] : []),
    ...(columnVisibility.manager ? [columnHelper.accessor('manager', {
      header: () => <SortableHeader field="manager" label="Manager" />,
      cell: (info) => info.getValue() || '—'
    })] : []),
    ...(columnVisibility.programs ? [columnHelper.display({
      id: 'programs',
      header: 'Programs',
      cell: (info) => {
        const assignments = info.row.original.programAssignments.filter(a => a.isActive);
        return (
          <div className="flex flex-wrap gap-1">
            {assignments.length === 0 ? (
              <span className="text-gray-400 text-sm">No programs</span>
            ) : (
              assignments.map((a) => (
                <span
                  key={a.program.id}
                  className={`px-2 py-1 rounded text-xs ${
                    a.source === 'usertype'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                  title={a.source === 'usertype' ? 'Inherited' : 'Manual'}
                >
                  {a.program.title}
                </span>
              ))
            )}
          </div>
        );
      }
    })] : []),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingUserId(info.row.original.id);
              setShowUserForm(true);
            }}
            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
            title="Edit User"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={async () => {
              if (confirm(`Send invitation email to ${info.row.original.email}?`)) {
                const res = await fetch(`/api/admin/users/${info.row.original.id}/send-invitation`, {
                  method: 'POST'
                });
                if (res.ok) {
                  alert('Invitation sent!');
                } else {
                  alert('Failed to send invitation');
                }
              }
            }}
            className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition-colors"
            title="Send Invitation"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          </button>
          <button
            onClick={() => {
              setAssigningUserId(info.row.original.id);
              setSelectedUserIds([info.row.original.id]);
              setShowBulkAssign(true);
            }}
            className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 transition-colors"
            title="Assign Program"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this user?')) {
                deleteUser.mutate(info.row.original.id);
              }
            }}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
            title="Delete User"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: sortedUsers,
    columns,
    getCoreRowModel: getCoreRowModel()
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="flex gap-2">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            onClick={() => setShowImport(true)}
          >
            📥 Import CSV
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            onClick={() => {
              setEditingUserId(undefined);
              setShowUserForm(true);
            }}
          >
            + Add User
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex gap-3">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            <span>Filters</span>
            {(filters.section || filters.department || filters.role || filters.userTypeId) && (
              <span className="bg-white text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">
                {[filters.section, filters.department, filters.role, filters.userTypeId].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>

        {/* Collapsible Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input
                  type="text"
                  placeholder="e.g., Production"
                  value={filters.section}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  placeholder="e.g., Manufacturing"
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="INSTRUCTOR">Instructor</option>
                  <option value="LEARNER">Learner</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                <input
                  type="text"
                  placeholder="e.g., Visitor"
                  value={filters.userTypeId}
                  onChange={(e) => setFilters({ ...filters, userTypeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            
            {/* Clear All Filters */}
            {(filters.section || filters.department || filters.role || filters.userTypeId) && (
              <div className="mt-3">
                <button
                  onClick={() => setFilters({ section: '', department: '', userTypeId: '', role: '' })}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {(filters.section || filters.department || filters.role || filters.userTypeId) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.section && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span><strong>Section:</strong> {filters.section}</span>
              <button
                onClick={() => setFilters({ ...filters, section: '' })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </div>
          )}
          {filters.department && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span><strong>Department:</strong> {filters.department}</span>
              <button
                onClick={() => setFilters({ ...filters, department: '' })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </div>
          )}
          {filters.role && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span><strong>Role:</strong> {filters.role}</span>
              <button
                onClick={() => setFilters({ ...filters, role: '' })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </div>
          )}
          {filters.userTypeId && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
              <span><strong>User Type:</strong> {filters.userTypeId}</span>
              <button
                onClick={() => setFilters({ ...filters, userTypeId: '' })}
                className="hover:text-blue-900"
              >
                ×
              </button>
            </div>
          )}
        </div>
      )}

      {selectedUserIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {selectedUserIds.length} user(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowBulkEdit(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm flex items-center gap-1"
                title="Bulk Edit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit
              </button>
              <button
                onClick={() => {
                  if (confirm(`Send invitation emails to ${selectedUserIds.length} user(s)?`)) {
                    bulkInvite.mutate(selectedUserIds);
                  }
                }}
                disabled={bulkInvite.isPending}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 text-sm flex items-center gap-1"
                title="Bulk Invite"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                {bulkInvite.isPending ? 'Sending...' : 'Invite'}
              </button>
              <button
                onClick={() => setShowBulkAssign(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm flex items-center gap-1"
                title="Assign Program"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                Assign
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedUserIds.length} user(s)? This action cannot be undone.`)) {
                    bulkDelete.mutate(selectedUserIds);
                  }
                }}
                disabled={bulkDelete.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 text-sm flex items-center gap-1"
                title="Bulk Delete"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {bulkDelete.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
            {/* Column Visibility Settings - appears below header when open */}
            {showColumnSettings && (
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Show/Hide Columns</h3>
                  <button
                    onClick={() => setShowColumnSettings(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.entries(columnVisibility).map(([key, value]) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setColumnVisibility({
                          ...columnVisibility,
                          [key]: e.target.checked
                        })}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">
                        {key === 'userType' ? 'User Type' : key}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-blue-200 flex gap-2">
                  <button
                    onClick={() => setColumnVisibility({
                      email: true,
                      name: true,
                      role: true,
                      userType: true,
                      department: true,
                      section: true,
                      designation: true,
                      supervisor: true,
                      manager: true,
                      programs: true
                    })}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Show All
                  </button>
                  <button
                    onClick={() => setColumnVisibility({
                      email: true,
                      name: true,
                      role: true,
                      userType: false,
                      department: false,
                      section: false,
                      designation: false,
                      supervisor: false,
                      manager: false,
                      programs: true
                    })}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Show Essential Only
                  </button>
                </div>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                      <th 
                        className="px-4 py-3 text-right sticky right-0 bg-gray-50"
                      >
                        <button
                          onClick={() => setShowColumnSettings(!showColumnSettings)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded hover:bg-gray-100"
                          title="Column Settings"
                        >
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-5 w-5" 
                            viewBox="0 0 20 20" 
                            fill="currentColor"
                          >
                            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </th>
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                      <td className="px-4 py-3"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {data?.pagination && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {data.pagination.page} of {data.pagination.totalPages} 
                  ({data.pagination.total} total users)
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pagination.totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CSV Import Modal */}
      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
        />
      )}
      
      {/* User Form Modal */}
      {showUserForm && (
        <UserFormModal
          userId={editingUserId}
          onClose={() => {
            setShowUserForm(false);
            setEditingUserId(undefined);
          }}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
        />
      )}

      {/* Bulk Assign Modal */}
      {showBulkAssign && (
        <BulkAssignModal
          selectedUserIds={selectedUserIds}
          onClose={() => {
            setShowBulkAssign(false);
            setAssigningUserId(undefined);
          }}
          onSuccess={() => {
            setSelectedUserIds([]);
            setAssigningUserId(undefined);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}

      {/* Bulk Edit Modal */}
      {showBulkEdit && (
        <BulkEditModal
          selectedUserIds={selectedUserIds}
          onClose={() => setShowBulkEdit(false)}
          onSuccess={() => {
            setSelectedUserIds([]);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
}