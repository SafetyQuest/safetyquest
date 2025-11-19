'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { CSVImportModal } from '@/components/admin/CSVImportModal';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { BulkAssignModal } from '@/components/admin/BulkAssignModal';
import { BulkEditModal } from '@/components/admin/BulkEditModal';

const getBadgeType = (assignments: Array<{ source: string }>) => {
  const hasManual = assignments.some(a => a.source === 'manual');
  const hasUserType = assignments.some(a => a.source === 'usertype');
  
  if (hasManual && hasUserType) return 'dual';
  if (hasManual) return 'manual';
  if (hasUserType) return 'usertype';
  return 'none';
};

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
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
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

  // Derive API-ready filters from active fields + values
  const activeFilters = useMemo(() => {
    const result: Record<string, string> = {};
    activeFilterFields.forEach(field => {
      if (filterValues[field]) {
        // Map UI field to API param name
        const apiField = field === 'userType' ? 'userTypeId' : 
                        field === 'programs' ? 'programId' : 
                        field;
        result[apiField] = filterValues[field];
      }
    });
    return result;
  }, [activeFilterFields, filterValues]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showFilters) setShowFilters(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showFilters]);

  // Sort function
  const handleSort = (field: string) => {
    setSorting(prev => {
      if (prev?.field === field) {
        return prev.direction === 'asc' 
          ? { field, direction: 'desc' }
          : null;
      }
      return { field, direction: 'asc' };
    });
  };

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, activeFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
        search,
        ...activeFilters
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

  // Memoized sorted users
  const sortedUsers = useMemo(() => {
    const users = data?.users || [];
    if (!sorting) return users;
    
    return [...users].sort((a, b) => {
      let aVal: any = a[sorting.field as keyof User];
      let bVal: any = b[sorting.field as keyof User];
      
      if (sorting.field === 'userType') {
        aVal = a.userType?.name || '';
        bVal = b.userType?.name || '';
      }
      
      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';
      
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
                setSelectedUserIds([]);
              } else {
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
        // Group active assignments by program ID
        const activeAssignments = info.row.original.programAssignments.filter(a => a.isActive);
        const programMap = new Map<string, Array<{ source: string; program: { title: string } }>>();
        
        activeAssignments.forEach(a => {
          if (!programMap.has(a.program.id)) {
            programMap.set(a.program.id, []);
          }
          programMap.get(a.program.id)!.push({
            source: a.source,
            program: a.program
          });
        });

        return (
          <div className="flex flex-wrap gap-1">
            {programMap.size === 0 ? (
              <span className="text-gray-400 text-sm">No programs</span>
            ) : (
              Array.from(programMap.entries()).map(([programId, assignments]) => {
                const badgeType = getBadgeType(assignments);
                const programTitle = assignments[0].program.title;
                
                switch (badgeType) {
                  case 'dual':
                    return (
                      <span
                        key={programId}
                        className="diagonal-badge dual-badge"
                        title="Assigned both manually and via User Type"
                      >
                        {programTitle}
                      </span>
                    );
                  
                  case 'manual':
                    return (
                      <span
                        key={programId}
                        className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-1 rounded text-xs font-medium"
                        title="Manually Assigned"
                      >
                        {programTitle}
                      </span>
                    );
                  
                  case 'usertype':
                    return (
                      <span
                        key={programId}
                        className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded text-xs font-medium"
                        title="Inherited from User Type"
                      >
                        {programTitle}
                      </span>
                    );
                  
                  default:
                    return (
                      <span
                        key={programId}
                        className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-1 rounded text-xs font-medium"
                        title="Unknown assignment type"
                      >
                        {programTitle}
                      </span>
                    );
                }
              })
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

      {/* Search and Dynamic Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-4 relative">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowFilters(!showFilters);
              }}
              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md flex items-center gap-2"
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
              {activeFilterFields.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
                  {activeFilterFields.length}
                </span>
              )}
            </button>

            {/* Dropdown Menu */}
            {showFilters && (
              <div 
                className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-10 border py-2"
                onClick={(e) => e.stopPropagation()}
              >
                {[
                  { key: 'section', label: 'Section' },
                  { key: 'department', label: 'Department' },
                  { key: 'designation', label: 'Designation' },
                  { key: 'supervisor', label: 'Supervisor' },
                  { key: 'manager', label: 'Manager' },
                  { key: 'role', label: 'Role' },
                  { key: 'userType', label: 'User Type' },
                  { key: 'programs', label: 'Program' }
                ].map(({ key, label }) => (
                  <label 
                    key={key} 
                    className="flex items-center px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={activeFilterFields.includes(key)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setActiveFilterFields(prev => [...prev, key]);
                        } else {
                          setActiveFilterFields(prev => prev.filter(f => f !== key));
                          setFilterValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[key];
                            return newValues;
                          });
                        }
                      }}
                      className="rounded mr-3"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Dynamically Render Active Filter Inputs */}
        {activeFilterFields.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeFilterFields.map((field) => {
                const labelMap: Record<string, string> = {
                  section: 'Section',
                  department: 'Department',
                  designation: 'Designation',
                  supervisor: 'Supervisor',
                  manager: 'Manager',
                  role: 'Role',
                  userType: 'User Type',
                  programs: 'Program'
                };
                const label = labelMap[field] || field;

                return (
                  <div key={field} className="relative">
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {label}
                      </label>
                      <button
                        onClick={() => {
                          setActiveFilterFields(prev => prev.filter(f => f !== field));
                          setFilterValues(prev => {
                            const newValues = { ...prev };
                            delete newValues[field];
                            return newValues;
                          });
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                    
                    {field === 'role' ? (
                      <select
                        value={filterValues[field] || ''}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="INSTRUCTOR">Instructor</option>
                        <option value="LEARNER">Learner</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={`Filter by ${label.toLowerCase()}...`}
                        value={filterValues[field] || ''}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

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
                Program Assignment
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

      {/* Modals */}
      {showImport && (
        <CSVImportModal
          onClose={() => setShowImport(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
        />
      )}
      
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