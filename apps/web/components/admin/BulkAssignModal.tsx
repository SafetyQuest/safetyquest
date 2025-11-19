'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type BulkAssignModalProps = {
  selectedUserIds: string[];
  onClose: () => void;
  onSuccess: () => void;
};

type ProgramWithAssignment = {
  id: string;
  title: string;
  hasManualAssignments: boolean;
  hasInheritedAssignments: boolean;
  manualAssignmentsCount: number;
  inheritedAssignmentsCount: number;
  canBeRemoved: boolean;        // Can this program be removed from ANY selected user?
  isFullyAssigned: boolean;     // Do ALL selected users have this program (manual OR inherited)?
};

export function BulkAssignModal({ selectedUserIds, onClose, onSuccess }: BulkAssignModalProps) {
  const [action, setAction] = useState<'assign' | 'deassign'>('assign');
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [programsWithAssignments, setProgramsWithAssignments] = useState<ProgramWithAssignment[]>([]);
  
  const queryClient = useQueryClient();

  // Fetch all programs
  const { data: programs, refetch: refetchPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const res = await fetch('/api/admin/programs');
      if (!res.ok) throw new Error('Failed to fetch programs');
      return res.json();
    }
  });

  // Fetch current assignments for selected users - with refetchOnMount to ensure fresh data
  const { data: userAssignments, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useQuery({
    queryKey: ['userProgramAssignments', selectedUserIds],
    queryFn: async () => {
      const res = await fetch('/api/admin/users/program-assignments?' + 
        new URLSearchParams({ userIds: selectedUserIds.join(',') }));
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
    enabled: selectedUserIds.length > 0,
    refetchOnMount: 'always', // Always refetch when component mounts
    staleTime: 0 // Consider data immediately stale
  });

  // Refetch data when modal opens
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      refetchAssignments();
      refetchPrograms();
    }
  }, [selectedUserIds]);

  // Process programs with assignment status
  useEffect(() => {
    if (programs && userAssignments) {
      const processedPrograms = programs.map((program: any) => {
        const assignments = userAssignments[program.id] || {};
        
        // Count manual assignments (these can be removed)
        const manualAssignmentsCount = selectedUserIds.filter(userId => 
          assignments[userId]?.source === 'manual' && assignments[userId]?.isActive
        ).length;
        
        // Count inherited assignments (these cannot be removed)
        const inheritedAssignmentsCount = selectedUserIds.filter(userId => 
          assignments[userId]?.source === 'usertype' && assignments[userId]?.isActive
        ).length;

        return {
          id: program.id,
          title: program.title,
          hasManualAssignments: manualAssignmentsCount > 0,
          hasInheritedAssignments: inheritedAssignmentsCount > 0,
          manualAssignmentsCount,
          inheritedAssignmentsCount,
          // For Remove tab: show if there are manual assignments to remove
          canBeRemoved: manualAssignmentsCount > 0,
          // For Assign tab: hide if ALL users already have it (manual OR inherited)
          isFullyAssigned: selectedUserIds.length === (manualAssignmentsCount + inheritedAssignmentsCount)
        };
      });

      setProgramsWithAssignments(processedPrograms);
    }
  }, [programs, userAssignments, selectedUserIds]);

  // Bulk assign mutation
  const assignMutation = useMutation({
    mutationFn: async (programIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          programIds
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to assign programs');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['userProgramAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
      onClose();
    }
  });

  // Bulk deassign mutation
  const deassignMutation = useMutation({
    mutationFn: async (programIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-deassign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          programIds
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to deassign programs');
      }

      return res.json();
    },
    onSuccess: () => {
      // Invalidate related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ['userProgramAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
      onClose();
    }
  });

  const handleSubmit = () => {
    if (selectedPrograms.length === 0) {
      alert('Please select at least one program');
      return;
    }

    const actionText = action === 'assign' ? 'assign' : 'remove';
    if (confirm(`${actionText} ${selectedPrograms.length} program(s) ${action === 'assign' ? 'to' : 'from'} ${selectedUserIds.length} user(s)?`)) {
      if (action === 'assign') {
        assignMutation.mutate(selectedPrograms);
      } else {
        deassignMutation.mutate(selectedPrograms);
      }
    }
  };

  const toggleProgram = (programId: string) => {
    setSelectedPrograms(prev =>
      prev.includes(programId)
        ? prev.filter(id => id !== programId)
        : [...prev, programId]
    );
  };

  const selectAll = () => {
    if (action === 'assign') {
      // Select all programs NOT fully assigned to all users
      const selectable = filteredPrograms.map(p => p.id);
      setSelectedPrograms(selectable);
    } else {
      // Select all programs that CAN BE REMOVED (have manual assignments)
      const removable = filteredPrograms.map(p => p.id);
      setSelectedPrograms(removable);
    }
  };

  const clearSelection = () => {
    setSelectedPrograms([]);
  };

  const filteredPrograms = useMemo(() => {
    if (action === 'assign') {
      // Show programs not fully assigned to all users
      return programsWithAssignments.filter(p => !p.isFullyAssigned);
    } else {
      // Show ONLY programs that have manual assignments (can be removed)
      return programsWithAssignments.filter(p => p.canBeRemoved);
    }
  }, [action, programsWithAssignments]);

  const isPending = assignMutation.isPending || deassignMutation.isPending;
  const error = assignMutation.error || deassignMutation.error;

  // Reset selected programs when switching tabs
  useEffect(() => {
    setSelectedPrograms([]);
  }, [action]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Manage Program Assignments</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Managing programs for {selectedUserIds.length} selected user(s)
        </p>

        {/* Action Tabs */}
        <div className="flex mb-6 border-b">
          <button
            onClick={() => setAction('assign')}
            className={`px-4 py-2 font-medium transition-colors ${
              action === 'assign'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Assign Programs
          </button>
          <button
            onClick={() => setAction('deassign')}
            className={`px-4 py-2 font-medium transition-colors ${
              action === 'deassign'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Remove Programs
          </button>
        </div>

        {isLoadingAssignments ? (
          <div className="text-center py-8">Loading program assignments...</div>
        ) : (
          <>
            {/* Selection Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-gray-600">
                {selectedPrograms.length} program(s) selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  disabled={filteredPrograms.length === 0}
                  className={`text-sm ${filteredPrograms.length === 0 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-600 hover:text-blue-800'}`}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Program List */}
            <div className="border rounded-lg max-h-96 overflow-y-auto mb-4">
              {filteredPrograms.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {action === 'assign' 
                    ? 'All programs are already assigned to the selected users' 
                    : 'No programs are currently assigned to the selected users'}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredPrograms.map((program) => (
                    <label
                      key={program.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedPrograms.includes(program.id)}
                        onChange={() => toggleProgram(program.id)}
                        disabled={action === 'deassign' && !program.canBeRemoved}
                        className="rounded mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{program.title}</div>
                        {program.hasInheritedAssignments && action === 'deassign' && (
                          <div className="text-xs text-orange-600 mt-1">
                            ⚠️ {program.inheritedAssignmentsCount} user(s) have inherited assignments that will be preserved
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                {error.message}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isPending || selectedPrograms.length === 0}
                className={`flex-1 text-white py-2 rounded-md disabled:opacity-50 ${
                  action === 'assign'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isPending 
                  ? 'Processing...' 
                  : action === 'assign' 
                    ? 'Assign Selected Programs' 
                    : 'Remove Selected Programs'}
              </button>
              <button
                onClick={onClose}
                disabled={isPending}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}