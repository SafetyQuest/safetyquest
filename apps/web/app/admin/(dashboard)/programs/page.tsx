'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

export default function ProgramsPage() {
  const [search, setSearch] = useState('');
  const [showActive, setShowActive] = useState<boolean | undefined>(true);
  const queryClient = useQueryClient();

  // Fetch programs
  const { data: programs, isLoading, isRefetching } = useQuery({
    queryKey: ['programs', search, showActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (showActive !== undefined) params.append('isActive', String(showActive));
      
      const res = await fetch(`/api/admin/programs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

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

  const handleDeleteProgram = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the program "${title}"?`)) {
      deleteProgram.mutate(id);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Programs</h1>
        <Link
          href="/admin/programs/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + New Program
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search programs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <select
              value={showActive === undefined ? '' : String(showActive)}
              onChange={(e) => {
                const value = e.target.value;
                setShowActive(value === '' ? undefined : value === 'true');
              }}
              className="px-3 py-2 border rounded-md"
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
        <div className="bg-white p-8 rounded-lg shadow text-center">
          Loading programs...
        </div>
      ) : programs?.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          No programs found. Create your first program!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs?.map((program: any) => (
            <div
              key={program.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden ${
                !program.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold">{program.title}</h2>
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-3 h-3 rounded-full mr-2 ${
                        program.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    ></span>
                    <span className="text-sm text-gray-600">
                      {program.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {program.description || 'No description provided.'}
                </p>
                
                {program.userTypes && program.userTypes.length > 0 && (
                  <p className="text-sm mb-3">
                    <span className="font-semibold">Default for:</span>{' '}
                    {program.userTypes.map(ut => ut.userType.name).join(', ')}
                  </p>
                )}
                
                <div className="mb-3">
                  <span className="font-semibold text-sm">Courses:</span>{' '}
                  <span className="text-gray-600">
                    {program.courses.length} course(s)
                  </span>
                </div>
                
                <div className="flex mt-4">
                  <Link
                    href={`/admin/programs/${program.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4"
                  >
                    View Details
                  </Link>
                  <Link
                    href={`/admin/programs/${program.id}/edit`}
                    className="text-green-600 hover:text-green-800 text-sm font-medium mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDeleteProgram(program.id, program.title)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 px-6 py-3 flex justify-between">
                <span className="text-xs text-gray-500">ID: {program.id.substring(0, 8)}</span>
                <button
                  onClick={() =>
                    toggleActiveStatus.mutate({
                      id: program.id,
                      isActive: !program.isActive
                    })
                  }
                  className={`text-xs font-medium ${
                    program.isActive
                      ? 'text-yellow-600 hover:text-yellow-700'
                      : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  {program.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}