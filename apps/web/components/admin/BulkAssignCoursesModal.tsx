'use client';

import { useState, useEffect, useMemo } from 'react';  // ✅ Added useMemo
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Type definitions (LOGIC PRESERVED)
type UserAssignment = {
  source: 'manual' | 'usertype';
  isActive: boolean;
};

type CourseAssignmentsMap = {
  [courseId: string]: {
    [userId: string]: UserAssignment;
  };
};

type BulkAssignCoursesModalProps = {
  selectedUserIds: string[];
  onClose: () => void;
  onSuccess: () => void;
};

type CourseWithAssignment = {
  id: string;
  title: string;
  difficulty: string;
  hasManualAssignments: boolean;
  hasInheritedAssignments: boolean;
  manualAssignmentsCount: number;
  inheritedAssignmentsCount: number;
  canBeRemoved: boolean;
  isFullyAssigned: boolean;
};

export function BulkAssignCoursesModal({ selectedUserIds, onClose, onSuccess }: BulkAssignCoursesModalProps) {
  const [action, setAction] = useState<'assign' | 'deassign'>('assign');
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [coursesWithAssignments, setCoursesWithAssignments] = useState<CourseWithAssignment[]>([]);
  const [operationResult, setOperationResult] = useState<any>(null);
  
  const queryClient = useQueryClient();

  // Fetch all courses (LOGIC PRESERVED)
  const { data: courses, refetch: refetchCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });

  // Fetch current assignments for selected users (LOGIC PRESERVED)
  const { data: userAssignments, isLoading: isLoadingAssignments, refetch: refetchAssignments } = useQuery<CourseAssignmentsMap>({
    queryKey: ['userCourseAssignments', selectedUserIds],
    queryFn: async () => {
      const res = await fetch('/api/admin/users/course-assignments?' + 
        new URLSearchParams({ userIds: selectedUserIds.join(',') }));
      if (!res.ok) throw new Error('Failed to fetch assignments');
      return res.json();
    },
    enabled: selectedUserIds.length > 0,
    refetchOnMount: 'always',
    staleTime: 0
  });

  // Refetch data when modal opens (LOGIC PRESERVED)
  useEffect(() => {
    if (selectedUserIds.length > 0) {
      refetchAssignments();
      refetchCourses();
    }
  }, [selectedUserIds]);

  // Calculate assignment statistics (LOGIC PRESERVED)
  const assignmentMaps = useMemo(() => {
    if (!userAssignments || !courses) return null;
    
    const courseAssignmentMap: Record<string, { 
      manualCount: number; 
      inheritedCount: number 
    }> = {};
    
    // Initialize all courses
    courses.forEach((course: any) => {
      courseAssignmentMap[course.id] = { manualCount: 0, inheritedCount: 0 };
    });
    
    // Count assignments
    selectedUserIds.forEach(userId => {
      Object.entries(userAssignments).forEach(([courseId, assignmentsForCourse]) => {
        const assignment = assignmentsForCourse[userId];
        
        if (assignment?.isActive) {
          if (assignment.source === 'manual') {
            courseAssignmentMap[courseId].manualCount++;
          } else if (assignment.source === 'usertype') {
            courseAssignmentMap[courseId].inheritedCount++;
          }
        }
      });
    });
    
    return courseAssignmentMap;
  }, [userAssignments, courses, selectedUserIds]);

  // Process courses with assignment status (LOGIC PRESERVED)
  useEffect(() => {
    if (courses && assignmentMaps) {
      const processedCourses = courses.map((course: any) => {
        const counts = assignmentMaps[course.id] || { manualCount: 0, inheritedCount: 0 };
        
        return {
          id: course.id,
          title: course.title,
          difficulty: course.difficulty,
          hasManualAssignments: counts.manualCount > 0,
          hasInheritedAssignments: counts.inheritedCount > 0,
          manualAssignmentsCount: counts.manualCount,
          inheritedAssignmentsCount: counts.inheritedCount,
          canBeRemoved: counts.manualCount > 0,
          isFullyAssigned: selectedUserIds.length === (counts.manualCount + counts.inheritedCount)
        };
      });

      setCoursesWithAssignments(processedCourses);
    }
  }, [courses, assignmentMaps, selectedUserIds]);

  // Bulk assign mutation (LOGIC PRESERVED)
  const assignMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-assign-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          courseIds
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to assign courses');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setOperationResult(data);
      queryClient.invalidateQueries({ queryKey: ['userCourseAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    }
  });

  // Bulk deassign mutation (LOGIC PRESERVED)
  const deassignMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      const res = await fetch('/api/admin/users/bulk-deassign-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUserIds,
          courseIds
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to deassign courses');
      }

      return res.json();
    },
    onSuccess: (data) => {
      setOperationResult(data);
      queryClient.invalidateQueries({ queryKey: ['userCourseAssignments'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onSuccess();
    }
  });

  const handleSubmit = () => {
    if (selectedCourses.length === 0) {
      alert('Please select at least one course');
      return;
    }

    const actionText = action === 'assign' ? 'assign' : 'remove';
    if (confirm(`${actionText} ${selectedCourses.length} course(s) ${action === 'assign' ? 'to' : 'from'} ${selectedUserIds.length} user(s)?`)) {
      if (action === 'assign') {
        assignMutation.mutate(selectedCourses);
      } else {
        deassignMutation.mutate(selectedCourses);
      }
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const selectAll = () => {
    if (action === 'assign') {
      const assignable = filteredCourses.map((c: CourseWithAssignment) => c.id);
      setSelectedCourses(assignable);
    } else {
      const removable = filteredCourses.filter((c: CourseWithAssignment) => c.canBeRemoved).map((c: CourseWithAssignment) => c.id);
      setSelectedCourses(removable);
    }
  };

  const clearSelection = () => {
    setSelectedCourses([]);
  };

  // ✅ Add requestClose function
  const requestClose = () => {
    if (selectedCourses.length === 0) {
      onClose();
      return;
    }
    
    if (confirm(`You have selected ${selectedCourses.length} course(s) but haven't applied changes yet. Leave without saving?`)) {
      onClose();
    }
  };

  const filteredCourses = useMemo(() => {
    if (action === 'assign') {
      return coursesWithAssignments.filter((c: CourseWithAssignment) => {
        return c.manualAssignmentsCount < selectedUserIds.length;
      });
    } else {
      return coursesWithAssignments.filter((c: CourseWithAssignment) => c.canBeRemoved);
    }
  }, [action, coursesWithAssignments, selectedUserIds]);

  const isPending = assignMutation.isPending || deassignMutation.isPending;
  const error = assignMutation.error || deassignMutation.error;

  useEffect(() => {
    setSelectedCourses([]);
  }, [action]);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          requestClose();
        }
      }}
      onKeyDown={(e) => e.key === 'Escape' && requestClose()}
      tabIndex={-1}
    >
      <div className="bg-[var(--background)] rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[var(--border)]">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Manage Course Assignments</h2>
        
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Managing courses for {selectedUserIds.length} selected user(s)
        </p>

        <div className="flex mb-6 border-b border-[var(--border)]">
          <button
            onClick={() => setAction('assign')}
            className={`px-4 py-2 font-medium transition-colors duration-[--transition-base] ${
              action === 'assign'
                ? 'border-b-2 border-[var(--primary)] text-[var(--primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Assign Courses
          </button>
          <button
            onClick={() => setAction('deassign')}
            className={`px-4 py-2 font-medium transition-colors duration-[--transition-base] ${
              action === 'deassign'
                ? 'border-b-2 border-[var(--danger)] text-[var(--danger)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Remove Courses
          </button>
        </div>

        {isLoadingAssignments ? (
          <div className="text-center py-8"><div className="animate-pulse text-[var(--text-primary)]">Loading course assignments...</div></div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm text-[var(--text-secondary)]">
                {selectedCourses.length} course(s) selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  disabled={filteredCourses.length === 0}
                  className={`text-sm transition-colors duration-[--transition-base] ${
                    filteredCourses.length === 0 
                      ? 'text-[var(--text-muted)] cursor-not-allowed' 
                      : 'text-[var(--primary)] hover:text-[var(--primary-dark)]'
                  }`}
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-[--transition-base]"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="border border-[var(--border)] rounded-lg max-h-96 overflow-y-auto mb-4">
              {filteredCourses.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-secondary)]">
                  {action === 'assign' 
                    ? 'All courses are already assigned to the selected users' 
                    : 'No courses are currently assigned to the selected users'}
                </div>
              ) : (
                <div className="divide-y divide-[var(--border)]">
                  {filteredCourses.map((course) => (
                    <label
                      key={course.id}
                      className="flex items-center p-3 hover:bg-[var(--surface-hover)] cursor-pointer transition-colors duration-[--transition-base]">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={() => toggleCourse(course.id)}
                        disabled={action === 'deassign' && !course.canBeRemoved}
                        className="rounded mr-3 border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary-light)]"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-[var(--text-primary)]">{course.title}</div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {course.difficulty}
                        </div>
                        {course.hasInheritedAssignments && action === 'deassign' && (
                          <div className="text-xs text-[var(--warning-dark)] mt-1 flex items-start gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>
                              {course.inheritedAssignmentsCount} user(s) have inherited assignments
                            </span>
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="bg-[var(--danger-light)] text-[var(--danger-dark)] p-3 rounded border border-[var(--danger-light)] mb-4">
                {error.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isPending || selectedCourses.length === 0}
                className={`flex-1 text-[var(--text-inverse)] py-2 rounded-md disabled:opacity-50 transition-colors duration-[--transition-base] ${
                  action === 'assign'
                    ? 'bg-[var(--primary)] hover:bg-[var(--primary-dark)]'
                    : 'bg-[var(--danger)] hover:bg-[var(--danger-dark)]'
                }`}
              >
                {isPending 
                  ? 'Processing...' 
                  : action === 'assign' 
                    ? 'Assign Selected Courses' 
                    : 'Remove Selected Courses'}
              </button>
              <button
                onClick={requestClose}
                disabled={isPending}
                className="flex-1 bg-[var(--surface)] text-[var(--text-primary)] py-2 rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-50 transition-colors duration-[--transition-base]"
              >
                Cancel
              </button>
            </div>

            {/* Success Feedback - UPDATED WITH BRAND COLORS */}
            {operationResult && (
              <div className="mt-4 p-4 bg-[var(--primary-surface)] rounded-lg border border-[var(--primary-light)] animate-fade-in">
                <div className="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--primary-dark)] mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium text-[var(--primary-dark)] mb-1">Operation Completed Successfully</p>
                    
                    {action === 'assign' ? (
                      <p className="text-[var(--primary-dark)]">
                        ✅ Assigned <span className="font-semibold">{operationResult.count}</span> course(s) to users
                      </p>
                    ) : (
                      <div>
                        <p className="text-[var(--primary-dark)]">
                          ✅ Deactivated <span className="font-semibold">{operationResult.deactivated}</span> manual assignment(s)
                        </p>
                        {operationResult.skippedUserTypeAssignments > 0 && (
                          <p className="text-[var(--warning-dark)] mt-1 flex items-start gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>
                              ⚠️ Skipped <span className="font-semibold">{operationResult.skippedUserTypeAssignments}</span> inherited assignment(s)
                            </span>
                          </p>
                        )}
                        {operationResult.message && (
                          <p className="text-sm text-[var(--text-secondary)] mt-2 bg-[var(--background)] p-2 rounded border border-[var(--primary-light)]">
                            {operationResult.message}
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="mt-4 pt-3 border-t border-[var(--primary-light)] flex justify-end">
                      <button
                        onClick={() => {
                          setOperationResult(null);
                          onClose();
                        }}
                        className="bg-[var(--primary)] text-[var(--text-inverse)] px-4 py-2 rounded-md hover:bg-[var(--primary-dark)] transition-colors duration-[--transition-base]"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}