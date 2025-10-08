'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { CSVImportModal } from '@/components/admin/CSVImportModal';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { BulkAssignModal } from '@/components/admin/BulkAssignModal';

type User = {
  id: string;
  email: string;
  name: string;
  role: string;
  section: string | null;
  department: string | null;
  designation: string | null;
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

  const queryClient = useQueryClient();

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

  const columnHelper = createColumnHelper<User>();

  const columns = [
    columnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="rounded"
        />
      ),
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
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => (
        <div className="font-medium">{info.getValue()}</div>
      )
    }),
    columnHelper.accessor('name', {
      header: 'Name',
      cell: (info) => info.getValue()
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          info.getValue() === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
          info.getValue() === 'INSTRUCTOR' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('userType.name', {
      header: 'User Type',
      cell: (info) => info.getValue() || '—'
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      cell: (info) => info.getValue() || '—'
    }),
    columnHelper.accessor('section', {
      header: 'Section',
      cell: (info) => info.getValue() || '—'
    }),
    columnHelper.display({
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
    }),
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
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Edit
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
            className="text-green-600 hover:text-green-800 text-sm"
          >
            Invite
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this user?')) {
                deleteUser.mutate(info.row.original.id);
              }
            }}
            className="text-red-600 hover:text-red-800 text-sm"
          >
            Delete
          </button>
        </div>
      )
    })
  ];

  const table = useReactTable({
    data: data?.users || [],
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Filter by section..."
            value={filters.section}
            onChange={(e) => setFilters({ ...filters, section: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Filter by department..."
            value={filters.department}
            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            className="px-3 py-2 border rounded-md"
          />
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="LEARNER">Learner</option>
          </select>
        </div>
      </div>
      
      {selectedUserIds.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 flex items-center justify-between">
          <span className="text-sm font-medium">
            {selectedUserIds.length} user(s) selected
          </span>
          <button
            onClick={() => setShowBulkAssign(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Assign Program
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">Loading...</div>
        ) : (
          <>
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
          onClose={() => setShowBulkAssign(false)}
          onSuccess={() => {
            setSelectedUserIds([]);
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }}
        />
      )}
    </div>
  );
}