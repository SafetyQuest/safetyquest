'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// ====== ADD THESE TYPE DEFINITIONS ======
type UserAssignment = {
  source: 'manual' | 'usertype';
  isActive: boolean;
};

type ProgramAssignmentsMap = {
  [programId: string]: {
    [userId: string]: UserAssignment;
  };
};
// ====== END TYPE DEFINITIONS ======

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
  const [operationResult, setOperationResult] = useState<any>(null);
  
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

  // Fetch current assignments for selected users - with proper typing
  const { data: userAssignments, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useQuery<ProgramAssignmentsMap>({
    queryKey: ['userProgramAssignments', selectedUserIds],
    queryFn: async () => {
      const res = await fetch('/api/admin/users/program-assignments?' + 
        new URLSearchParams({ userIds: selectedUserIds.join(',') }));
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
    enabled: selectedUserIds.length > 0,
    refetchOnMount: 'always',
    staleTime: 0
  });

  // Refetch data when modal opens
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      refetchAssignments();
      refetchPrograms();
    }
  }, [selectedUserIds]);

  // ====== PERFORMANCE OPTIMIZATION WITH PROPER TYPING ======
  const assignmentMaps = useMemo(() => {
    if (!userAssignments || !programs) return null;
    
    // Create a map: programId -> { manualCount, inheritedCount }
    const programAssignmentMap: Record<string, { 
      manualCount: number; 
      inheritedCount: number 
    }> = {};
    
    // Initialize all programs
    programs.forEach((program: any) => {
      programAssignmentMap[program.id] = { manualCount: 0, inheritedCount: 0 };
    });
    
    // Count assignments in a single pass through users
    selectedUserIds.forEach(userId => {
      Object.entries(userAssignments).forEach(([programId, assignmentsForProgram]) => {
        // Fix: assignmentsForProgram is now properly typed as { [userId]: UserAssignment }
        const assignment = assignmentsForProgram[userId];
        
        if (assignment?.isActive) {
          if (assignment.source === 'manual') {
            programAssignmentMap[programId].manualCount++;
          } else if (assignment.source === 'usertype') {
            programAssignmentMap[programId].inheritedCount++;
          }
        }
      });
    });
    
    return programAssignmentMap;
  }, [userAssignments, programs, selectedUserIds]);
  // ====== END PERFORMANCE OPTIMIZATION ======

  // Process programs with assignment status
  useEffect(() => {
    if (programs && assignmentMaps) {
      const processedPrograms = programs.map((program: any) => {
        const counts = assignmentMaps[program.id] || { manualCount: 0, inheritedCount: 0 };
        
        return {
          id: program.id,
          title: program.title,
          hasManualAssignments: counts.manualCount > 0,
          hasInheritedAssignments: counts.inheritedCount > 0,
          manualAssignmentsCount: counts.manualCount,
          inheritedAssignmentsCount: counts.inheritedCount,
          canBeRemoved: counts.manualCount > 0,
          isFullyAssigned: selectedUserIds.length === (counts.manualCount + counts.inheritedCount)
        };
      });

      setProgramsWithAssignments(processedPrograms);
    }
  }, [programs, assignmentMaps, selectedUserIds]);

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
    onSuccess: (data) => {
      setOperationResult(data); // Store the API response
      queryClient.invalidateQueries({ queryKey: ['userProgramAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
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
    onSuccess: (data) => {
      setOperationResult(data); // Store the API response
      queryClient.invalidateQueries({ queryKey: ['userProgramAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
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
      const selectable = filteredPrograms.map(p => p.id);
      setSelectedPrograms(selectable);
    } else {
      const removable = filteredPrograms.map(p => p.id);
      setSelectedPrograms(removable);
    }
  };

  const clearSelection = () => {
    setSelectedPrograms([]);
  };

  const filteredPrograms = useMemo(() => {
    if (action === 'assign') {
      // ✅ FIXED: Only hide programs that ALL users already have as MANUAL assignments
      // This allows creating dual assignments (manual + usertype)
      return programsWithAssignments.filter(p => {
        return p.manualAssignmentsCount < selectedUserIds.length;
      });
    } else {
      // Deassign: Only show programs with manual assignments (can be removed)
      return programsWithAssignments.filter(p => p.canBeRemoved);
    }
  }, [action, programsWithAssignments, selectedUserIds]);

  const isPending = assignMutation.isPending || deassignMutation.isPending;
  const error = assignMutation.error || deassignMutation.error;

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

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
                {error.message}
              </div>
            )}

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
                onClick={() => {
                  setOperationResult(null); // Clear the result
                  onClose();
                }}
                disabled={isPending}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-md hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>

            {/* ====== SUCCESS FEEDBACK SECTION ====== */}
            {operationResult && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 animate-fade-in">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 mb-1">Operation Completed Successfully</p>
                    
                    {action === 'assign' ? (
                      <p className="text-blue-800">
                        ✅ Assigned <span className="font-semibold">{operationResult.count}</span> program(s) to users
                      </p>
                    ) : (
                      <div>
                        <p className="text-blue-800">
                          ✅ Deactivated <span className="font-semibold">{operationResult.deactivated}</span> manual assignment(s)
                        </p>
                        {operationResult.skippedUserTypeAssignments > 0 && (
                          <p className="text-orange-700 mt-1 flex items-start gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>
                              ⚠️ Skipped <span className="font-semibold">{operationResult.skippedUserTypeAssignments}</span> inherited assignment(s) that cannot be removed
                            </span>
                          </p>
                        )}
                        {operationResult.message && (
                          <p className="text-sm text-gray-600 mt-2 bg-white p-2 rounded border border-blue-100">
                            {operationResult.message}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-blue-200 flex justify-end">
                      <button
                        onClick={() => {
                          setOperationResult(null);
                          onClose();
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* ====== END SUCCESS FEEDBACK ====== */}
          </>
        )}
      </div>
    </div>
  );
}