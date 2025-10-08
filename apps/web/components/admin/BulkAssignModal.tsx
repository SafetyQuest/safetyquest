'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';

type BulkAssignModalProps = {
  selectedUserIds: string[];
  onClose: () => void;
  onSuccess: () => void;
};

export function BulkAssignModal({ selectedUserIds, onClose, onSuccess }: BulkAssignModalProps) {
  const [selectedProgramId, setSelectedProgramId] = useState('');

  // Fetch programs
  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

  // Bulk assign mutation
  const mutation = useMutation({
    mutationFn: async (programId: string) => {
      const res = await fetch('/api/admin/users/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          programId
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error);
      }

      return res.json();
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    }
  });

  const handleAssign = () => {
    if (!selectedProgramId) {
      alert('Please select a program');
      return;
    }

    if (confirm(`Assign program to ${selectedUserIds.length} user(s)?`)) {
      mutation.mutate(selectedProgramId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Bulk Assign Program</h2>

        <p className="text-sm text-gray-600 mb-4">
          Assign a program to {selectedUserIds.length} selected user(s)
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Program</label>
          <select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">-- Select Program --</option>
            {programs?.map((program: any) => (
              <option key={program.id} value={program.id}>
                {program.title}
              </option>
            ))}
          </select>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
            {mutation.error.message}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleAssign}
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Assigning...' : 'Assign Program'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}