'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper } from '@tanstack/react-table';
import { CSVImportModal } from '@/components/admin/CSVImportModal';
import { UserFormModal } from '@/components/admin/UserFormModal';
import { BulkAssignModal } from '@/components/admin/BulkAssignModal';
import { BulkEditModal } from '@/components/admin/BulkEditModal';
import { BulkAssignCoursesModal } from '@/components/admin/BulkAssignCoursesModal';

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
  roleId: string | null;
  roleModel: { id: string; name: string; slug: string } | null;
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
  courseAssignments: Array<{
    course: { id: string; title: string };
    source: string;
    isActive: boolean;
  }>;
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState('');
  const [activeFilterFields, setActiveFilterFields] = useState<string[]>([]);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [showImport, setShowImport] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | undefined>();
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [showBulkCourseModal, setShowBulkCourseModal] = useState(false);
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
    programs: true,
    courses: true
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const stickyScrollbarRef = useRef<HTMLDivElement>(null);
  const stickyScrollbarContentRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();

  // Load column visibility from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('userTableColumnVisibility');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that all keys exist in current column structure
        const validKeys = Object.keys(columnVisibility);
        const isValid = Object.keys(parsed).every(key => validKeys.includes(key));
        
        if (isValid) {
          setColumnVisibility(parsed);
        } else {
          // Schema changed - reset to defaults
          console.warn('Column visibility schema mismatch - resetting');
          localStorage.removeItem('userTableColumnVisibility');
        }
      } catch (e) {
        console.warn('Failed to parse saved column visibility', e);
        localStorage.removeItem('userTableColumnVisibility');
      }
    }
  }, []); // Run once on mount

  // Save column visibility to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('userTableColumnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  // Fetch user types for filter dropdown
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Fetch programs for filter dropdown
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

  // Fetch roles for filter dropdown (NEW)
  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/admin/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    }
  });

  // Derive API-ready filters from active fields + values
  const activeFilters = useMemo(() => {
    const result: Record<string, string> = {};
    activeFilterFields.forEach(field => {
      if (filterValues[field]) {
        const apiField = field === 'userType' ? 'userTypeId' : 
                        field === 'programs' ? 'programId' : 
                        field === 'role' ? 'roleId' :
                        field;
        result[apiField] = filterValues[field];
      }
    });
    return result;
  }, [activeFilterFields, filterValues]);

  // Reset to page 1 when filters, search, or page size changes
  useEffect(() => {
    setPage(1);
  }, [search, activeFilters, pageSize]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    
    if (showFilters) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFilters]);

  // Fetch users
  const { data, isLoading } = useQuery({
    queryKey: ['users', page, pageSize, search, activeFilters],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        search,
        ...activeFilters
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      return res.json();
    }
  });

  // Sync sticky scrollbar with table scroll
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const stickyScrollbar = stickyScrollbarRef.current;
    const stickyScrollbarContent = stickyScrollbarContentRef.current;

    if (!tableContainer || !stickyScrollbar || !stickyScrollbarContent) return;

    const updateScrollbarWidth = () => {
      const scrollWidth = tableContainer.scrollWidth;
      stickyScrollbarContent.style.width = `${scrollWidth}px`;
    };

    const handleTableScroll = () => {
      if (stickyScrollbar && tableContainer) {
        stickyScrollbar.scrollLeft = tableContainer.scrollLeft;
      }
    };

    const handleStickyScroll = () => {
      if (tableContainer && stickyScrollbar) {
        tableContainer.scrollLeft = stickyScrollbar.scrollLeft;
      }
    };

    const handleScrollVisibility = () => {
      if (!tableContainer || !stickyScrollbar) return;
      
      const hasHorizontalScroll = tableContainer.scrollWidth > tableContainer.clientWidth;
      
      if (!hasHorizontalScroll) {
        stickyScrollbar.style.display = 'none';
        return;
      }

      const tableRect = tableContainer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      const tableBottomBelowViewport = tableRect.bottom > windowHeight;
      
      if (tableBottomBelowViewport) {
        stickyScrollbar.style.display = 'block';
        stickyScrollbar.style.width = `${tableContainer.clientWidth}px`;
        stickyScrollbar.style.left = `${tableRect.left}px`;
      } else {
        stickyScrollbar.style.display = 'none';
      }
    };

    updateScrollbarWidth();
    handleScrollVisibility();

    tableContainer.addEventListener('scroll', handleTableScroll);
    stickyScrollbar.addEventListener('scroll', handleStickyScroll);
    window.addEventListener('scroll', handleScrollVisibility);
    
    const resizeHandler = () => {
      updateScrollbarWidth();
      handleScrollVisibility();
    };
    window.addEventListener('resize', resizeHandler);

    const observer = new MutationObserver(() => {
      updateScrollbarWidth();
      handleScrollVisibility();
    });

    observer.observe(tableContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true
    });

    return () => {
      tableContainer.removeEventListener('scroll', handleTableScroll);
      stickyScrollbar.removeEventListener('scroll', handleStickyScroll);
      window.removeEventListener('scroll', handleScrollVisibility);
      window.removeEventListener('resize', resizeHandler);
      observer.disconnect();
    };
  }, [data, isLoading]);

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
      
      if (sorting.field === 'role') {
        aVal = a.roleModel?.name || a.role || '';
        bVal = b.roleModel?.name || b.role || '';
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
    ...(columnVisibility.role ? [columnHelper.display({
      id: 'role',
      header: () => <SortableHeader field="role" label="Role" />,
      cell: (info) => {
        const user = info.row.original;
        const roleName = user.roleModel?.name || user.role;
        const roleSlug = user.roleModel?.slug || user.role.toLowerCase();
        
        // Helper function to get role color
        const getRoleColor = (slug: string): { bg: string; text: string } => {
          // Define color map
          const colorMap: Record<string, { bg: string; text: string }> = {
            purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
            blue: { bg: 'bg-blue-100', text: 'text-blue-800' },
            green: { bg: 'bg-green-100', text: 'text-green-800' },
            red: { bg: 'bg-red-100', text: 'text-red-800' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
            amber: { bg: 'bg-amber-100', text: 'text-amber-800' },
            orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
            teal: { bg: 'bg-teal-100', text: 'text-teal-800' },
            cyan: { bg: 'bg-cyan-100', text: 'text-cyan-800' },
            indigo: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
            pink: { bg: 'bg-pink-100', text: 'text-pink-800' },
            rose: { bg: 'bg-rose-100', text: 'text-rose-800' },
            gray: { bg: 'bg-gray-100', text: 'text-gray-800' },
            slate: { bg: 'bg-slate-100', text: 'text-slate-800' },
            emerald: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
            lime: { bg: 'bg-lime-100', text: 'text-lime-800' },
            sky: { bg: 'bg-sky-100', text: 'text-sky-800' },
            violet: { bg: 'bg-violet-100', text: 'text-violet-800' },
            fuchsia: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
          };
          
          // 1. Check for system roles first (highest priority)
          if (slug === 'admin') return colorMap.purple;
          if (slug === 'instructor') return colorMap.blue;
          if (slug === 'learner') return colorMap.green;
          
          // 2. Check if slug matches a color name directly
          if (colorMap[slug]) return colorMap[slug];
          
          // 3. Check if slug contains a color suffix (e.g., 'safety-officer-blue')
          const slugParts = slug.split('-');
          if (slugParts.length > 1) {
            const lastPart = slugParts[slugParts.length - 1];
            if (colorMap[lastPart]) {
              return colorMap[lastPart];
            }
          }
          
          // 4. Default for custom roles
          return colorMap.orange;
        };
        
        const { bg, text } = getRoleColor(roleSlug);
        const isSystem = ['admin', 'instructor', 'learner'].includes(roleSlug);
        
        return (
          <span 
            className={`px-2 py-1 rounded text-xs font-medium ${bg} ${text}`}
            title={isSystem ? `System role: ${roleName}` : `Custom role: ${roleName}`}
          >
            {roleName}
          </span>
        );
      }
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
          <div className="flex flex-wrap gap-1 pr-4">
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
                        className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-1 rounded text-xs font-medium"
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

    ...(columnVisibility.courses ? [columnHelper.display({
      id: 'courses',
      header: 'Courses',
      cell: (info) => {
        const activeAssignments = info.row.original.courseAssignments.filter(a => a.isActive);
        const courseMap = new Map<string, Array<{ source: string; course: { title: string } }>>();
        
        activeAssignments.forEach(a => {
          if (!courseMap.has(a.course.id)) {
            courseMap.set(a.course.id, []);
          }
          courseMap.get(a.course.id)!.push({
            source: a.source,
            course: a.course
          });
        });

        return (
          <div className="flex flex-wrap gap-1 pr-4">
            {courseMap.size === 0 ? (
              <span className="text-gray-400 text-sm">No courses</span>
            ) : (
              Array.from(courseMap.entries()).map(([courseId, assignments]) => {
                const badgeType = getBadgeType(assignments);
                const courseTitle = assignments[0].course.title;
                
                switch (badgeType) {
                  case 'dual':
                    return (
                      <span
                        key={courseId}
                        className="diagonal-badge dual-badge-courses"
                        title="Assigned both manually and via User Type"
                      >
                        {courseTitle}
                      </span>
                    );

                  case 'manual':
                    return (
                      <span
                        key={courseId}
                        className="bg-violet-100 text-violet-800 border border-violet-200 px-2 py-1 rounded text-xs font-medium"
                        title="Manually Assigned"
                      >
                        {courseTitle}
                      </span>
                    );

                  case 'usertype':
                    return (
                      <span
                        key={courseId}
                        className="bg-pink-100 text-pink-800 border border-pink-200 px-2 py-1 rounded text-xs font-medium"
                        title="Inherited from User Type"
                      >
                        {courseTitle}
                      </span>
                    );
                  
                  default:
                    return (
                      <span
                        key={courseId}
                        className="bg-gray-100 text-gray-800 border border-gray-200 px-2 py-1 rounded text-xs font-medium"
                        title="Unknown assignment type"
                      >
                        {courseTitle}
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
      header: () => (
        <div className="flex items-center justify-end gap-2">
          <span>Actions</span>
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
        </div>
      ),
      cell: (info) => (
        <div className="flex gap-2 justify-end">
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
              setSelectedUserIds([info.row.original.id]);
              setShowBulkCourseModal(true);
            }}
            className="text-purple-600 hover:text-purple-800 p-1 rounded hover:bg-purple-50 transition-colors"
            title="Assign Course"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
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
          
          <div className="relative" ref={filterDropdownRef}>
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

            {showFilters && (
              <div 
                className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg z-50 border py-2"
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
                        {roles?.map((role: any) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    ) : field === 'userType' ? (
                      <select
                        value={filterValues[field] || ''}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">All User Types</option>
                        {userTypes?.map((type: any) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    ) : field === 'programs' ? (
                      <select
                        value={filterValues[field] || ''}
                        onChange={(e) => setFilterValues(prev => ({ ...prev, [field]: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">All Programs</option>
                        {programs?.map((program: any) => (
                          <option key={program.id} value={program.id}>
                            {program.title}
                          </option>
                        ))}
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
        <div className="sticky top-0 z-30 bg-blue-50 p-4 rounded-lg mb-4 shadow-md">
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
                onClick={() => setShowBulkCourseModal(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm flex items-center gap-1"
                title="Assign Courses"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                Course Assignment
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
                
                {/* Action Buttons Row */}
                <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const allVisible = {
                          email: true,
                          name: true,
                          role: true,
                          userType: true,
                          department: true,
                          section: true,
                          designation: true,
                          supervisor: true,
                          manager: true,
                          programs: true,
                          courses: true
                        };
                        setColumnVisibility(allVisible);
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Show All
                    </button>
                    <button
                      onClick={() => {
                        const essentialOnly = {
                          email: true,
                          name: true,
                          role: true,
                          userType: false,
                          department: false,
                          section: false,
                          designation: false,
                          supervisor: false,
                          manager: false,
                          programs: true,
                          courses: true
                        };
                        setColumnVisibility(essentialOnly);
                      }}
                      className="text-xs text-gray-600 hover:text-gray-800"
                    >
                      Show Essential Only
                    </button>
                  </div>
                  
                  {/* Reset Button - NEW! */}
                  <button
                    onClick={() => {
                      const defaultVisibility = {
                        email: true,
                        name: true,
                        role: true,
                        userType: true,
                        department: true,
                        section: true,
                        designation: true,
                        supervisor: true,
                        manager: true,
                        programs: true,
                        courses: true
                      };
                      setColumnVisibility(defaultVisibility);
                      localStorage.removeItem('userTableColumnVisibility');
                    }}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium"
                    title="Reset to default column visibility"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-3 w-3" 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                    Reset to Defaults
                  </button>
                </div>
              </div>
            )}
            
            <div 
              ref={tableContainerRef}
              className="overflow-x-auto"
            >
              <table className="w-full">
                <thead className="bg-gray-50 border-b sticky top-0 z-20">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className={`px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 ${
                            header.id === 'actions' ? 'sticky right-0 shadow-[-2px_0_4px_rgba(0,0,0,0.08)]' : ''
                          }`}
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
                <tbody className="divide-y divide-gray-200 bg-white">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td 
                          key={cell.id} 
                          className={`px-4 py-3 text-sm ${
                            cell.column.id === 'actions' ? 'sticky right-0 bg-white shadow-[-2px_0_4px_rgba(0,0,0,0.08)]' : 'bg-white'
                          }`}
                        >
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

            {/* Sticky Bottom Scrollbar */}
            <div 
              ref={stickyScrollbarRef}
              className="fixed bottom-0 overflow-x-auto overflow-y-hidden z-40"
              style={{ 
                display: 'none',
                height: '16px',
                background: 'linear-gradient(to bottom, #f3f4f6 0%, #e5e7eb 100%)',
                borderTop: '1px solid #d1d5db',
                boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              <div 
                ref={stickyScrollbarContentRef}
                style={{
                  height: '1px',
                  background: 'transparent'
                }}
              ></div>
            </div>

            {data?.pagination && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-700">
                      Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.pagination.total)} of {data.pagination.total} users
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">Show:</label>
                      <select
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="px-3 py-1 border rounded-md text-sm bg-white"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                      title="First Page"
                    >
                      «
                    </button>
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                    >
                      ‹ Previous
                    </button>
                    
                    <div className="flex items-center gap-2 px-3">
                      <span className="text-sm text-gray-600">Page</span>
                      <input
                        type="number"
                        min={1}
                        max={data.pagination.totalPages}
                        value={page}
                        onChange={(e) => {
                          const newPage = Number(e.target.value);
                          if (newPage >= 1 && newPage <= data.pagination.totalPages) {
                            setPage(newPage);
                          }
                        }}
                        className="w-16 px-2 py-1 border rounded text-center text-sm"
                      />
                      <span className="text-sm text-gray-600">of {data.pagination.totalPages}</span>
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page >= data.pagination.totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                    >
                      Next ›
                    </button>
                    <button
                      onClick={() => setPage(data.pagination.totalPages)}
                      disabled={page >= data.pagination.totalPages}
                      className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
                      title="Last Page"
                    >
                      »
                    </button>
                  </div>
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

      {showBulkCourseModal && (
        <BulkAssignCoursesModal
          selectedUserIds={selectedUserIds}
          onClose={() => setShowBulkCourseModal(false)}
          onSuccess={() => {
            setSelectedUserIds([]);
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