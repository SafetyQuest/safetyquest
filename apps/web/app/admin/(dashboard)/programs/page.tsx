'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Copy } from 'lucide-react';
import Pagination from '@/components/Pagination';

const ITEMS_PER_PAGE = 9;

export default function ProgramsPage() {
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState<boolean | undefined>(true);
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Fetch programs with pagination
  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['programs', search, showActive, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (showActive !== undefined) params.append('isActive', String(showActive));
      params.append('page', currentPage.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      
      const res = await fetch(`/api/admin/programs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

  const programs = data?.programs || [];
  const totalItems = data?.total || 0;
  const totalPages = data?.totalPages || 0;

  // Toggle program active status
  const toggleActiveStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (!res.ok) throw new Error('Failed to update program');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    }
  });

  // Delete program
  const deleteProgram = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete program');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs'] });
    }
  });

  const handleDeleteProgram = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete the program "${title}"?`)) {
      deleteProgram.mutate(id);
    }
  };

  const handleEditProgram = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/admin/programs/${id}/edit`);
  };

  const handleCloneProgram = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    router.push(`/admin/programs/new?clone=${id}`);
  };

  const handleCardClick = (id: string) => {
    router.push(`/admin/programs/${id}`);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleActiveChange = (value: string) => {
    setShowActive(value === '' ? undefined : value === 'true');
    setCurrentPage(1);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Programs</h1>
        <Link
          href="/admin/programs/new"
          className="btn btn-primary px-4 py-2"
        >
          + New Program
        </Link>
      </div>

      {/* Filters - UPDATED WITH BRAND COLORS */}
      <div className="bg-[var(--background)] p-4 rounded-lg shadow mb-6 border border-[var(--border)]">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] transition-colors duration-[--transition-base]"
            />
          </div>
          <div>
            <select
              value={showActive === undefined ? '' : String(showActive)}
              onChange={(e) => handleActiveChange(e.target.value)}
              className="px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)] bg-[var(--background)] text-[var(--text-primary)]"
            >
              <option value="">All Programs</option>
              <option value="true">Active Programs</option>
              <option value="false">Inactive Programs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Programs List */}
      {isLoading || isRefetching ? (
        <div className="bg-[var(--background)] p-8 rounded-lg shadow text-center border border-[var(--border)]">
          <div className="animate-pulse text-[var(--text-primary)]">Loading programs...</div>
        </div>
      ) : totalItems === 0 ? (
        <div className="bg-[var(--background)] p-8 rounded-lg shadow text-center border border-[var(--border)]">
          <p className="text-[var(--text-primary)]">No programs found. Create your first program!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program: any) => (
              <div
                key={program.id}
                onClick={() => handleCardClick(program.id)}
                className={`bg-[var(--background)] rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-[--transition-base] flex flex-col ${
                  !program.isActive ? 'opacity-60' : ''
                } border border-[var(--border)] hover:border-[var(--primary-light)]`}
              >
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">{program.title}</h2>
                    <div className="flex items-center flex-shrink-0">
                      <span
                        className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          program.isActive ? 'bg-[var(--success)]' : 'bg-[var(--text-muted)]'
                        }`}
                      ></span>
                      <span className="text-sm text-[var(--text-secondary)]">
                        {program.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-[var(--text-secondary)] mb-4 line-clamp-2">
                    {program.description || 'No description provided.'}
                  </p>
                  
                  {program.userTypes && program.userTypes.length > 0 && (
                    <p className="text-sm mb-3 text-[var(--text-primary)]">
                      <span className="font-semibold">Default for:</span>{' '}
                      {program.userTypes.map((ut: any) => ut.userType.name).join(', ')}
                    </p>
                  )}
                  
                  <div className="mb-3">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">Courses:</span>{' '}
                    <span className="text-[var(--text-secondary)]">
                      {program.courses.length} course(s)
                    </span>
                  </div>

                  <div className="flex-grow"></div>
                  
                  <div className="flex gap-2 pt-4 border-t border-[var(--border)] mt-auto flex-wrap">
                    <button
                      onClick={(e) => handleEditProgram(e, program.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--success-dark)] hover:bg-[var(--success-light)] rounded-md transition-colors duration-[--transition-base]"
                      title="Edit Program"
                    >
                      <Pencil className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleCloneProgram(e, program.id)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary-surface)] rounded-md transition-colors duration-[--transition-base]"
                      title="Clone Program"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Clone</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteProgram(e, program.id, program.title)}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-light)] rounded-md transition-colors duration-[--transition-base]"
                      title="Delete Program"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
                
                <div className="bg-[var(--surface)] px-6 py-3 flex justify-between border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-muted)]">ID: {program.id.substring(0, 8)}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleActiveStatus.mutate({
                        id: program.id,
                        isActive: !program.isActive
                      });
                    }}
                    className={`text-xs font-medium transition-colors duration-[--transition-base] ${
                      program.isActive
                        ? 'text-[var(--warning-dark)] hover:text-[var(--warning)]'
                        : 'text-[var(--success-dark)] hover:text-[var(--success)]'
                    }`}
                  >
                    {program.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </>
      )}
    </div>
  );
}