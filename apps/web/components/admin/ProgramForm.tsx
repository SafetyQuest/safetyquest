'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Trash2, GripVertical } from 'lucide-react';

type ProgramFormProps = {
  programId?: string; // If provided, it's edit mode
  initialData?: any;
};

export default function ProgramForm({ programId, initialData }: ProgramFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = !!programId;
  
  // Get clone parameter from URL
  const cloneFromId = searchParams?.get('clone');
  const isCloneMode = !!cloneFromId && !isEditMode;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    isActive: true,
  });

  const [selectedUserTypeIds, setSelectedUserTypeIds] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<Array<{ id: string; title: string; order: number }>>([]);
  const [draggedCourseIndex, setDraggedCourseIndex] = useState<number | null>(null);
  const [courseSearch, setCourseSearch] = useState('');

  // Fetch user types
  const { data: userTypes } = useQuery({
    queryKey: ['userTypes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/user-types');
      if (!res.ok) throw new Error('Failed to fetch user types');
      return res.json();
    }
  });

  // Fetch all courses
  const { data: allCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });

  // Filter available courses (not already selected)
  const availableCourses = allCourses?.filter((course: any) => 
    !selectedCourses.some(sc => sc.id === course.id)
  ) || [];

  // Filter courses by search term
  const filteredCourses = availableCourses.filter((course: any) =>
    course.title.toLowerCase().includes(courseSearch.toLowerCase())
  );

  // If editing and initialData not provided, fetch program
  const { data: programData, isLoading: isProgramLoading } = useQuery({
    queryKey: ['program', programId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/programs/${programId}`);
      if (!res.ok) throw new Error('Failed to fetch program');
      return res.json();
    },
    enabled: isEditMode && !initialData
  });

  // Fetch program to clone
  const { data: cloneData, isLoading: isCloneLoading } = useQuery({
    queryKey: ['program', cloneFromId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/programs/${cloneFromId}`);
      if (!res.ok) throw new Error('Failed to fetch program to clone');
      return res.json();
    },
    enabled: isCloneMode
  });

  // Set initial data
  useEffect(() => {
    if (isEditMode) {
      const data = initialData || programData;
      if (data) {
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          isActive: data.isActive === undefined ? true : data.isActive,
        });
        
        if (data.userTypes && Array.isArray(data.userTypes)) {
          setSelectedUserTypeIds(data.userTypes.map((ut: any) => ut.userTypeId));
        }

        // Set selected courses with order
        if (data.courses && Array.isArray(data.courses)) {
          const courses = data.courses
            .sort((a: any, b: any) => a.order - b.order)
            .map((pc: any) => ({
              id: pc.course.id,
              title: pc.course.title,
              order: pc.order
            }));
          setSelectedCourses(courses);
        }
      }
    } else if (isCloneMode && cloneData) {
      // Set data from clone source
      setFormData({
        title: `${cloneData.title} (Copy)`,
        slug: `${cloneData.slug}-copy`,
        description: cloneData.description || '',
        isActive: true,
      });
      
      // Copy user types
      if (cloneData.userTypes && Array.isArray(cloneData.userTypes)) {
        setSelectedUserTypeIds(cloneData.userTypes.map((ut: any) => ut.userTypeId));
      }

      // Copy courses
      if (cloneData.courses && Array.isArray(cloneData.courses)) {
        const courses = cloneData.courses
          .sort((a: any, b: any) => a.order - b.order)
          .map((pc: any, index: number) => ({
            id: pc.course.id,
            title: pc.course.title,
            order: index
          }));
        setSelectedCourses(courses);
      }
    }
  }, [isEditMode, isCloneMode, initialData, programData, cloneData]);

  // Save program mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditMode ? `/api/admin/programs/${programId}` : '/api/admin/programs';
      const method = isEditMode ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save program');
      }

      return res.json();
    },
    onSuccess: async (savedProgram) => {
      const targetProgramId = isEditMode ? programId : savedProgram.id;

      // Sync courses with backend
      if (isEditMode) {
        // For edit mode: sync differences
        const currentCourses = programData?.courses || [];
        const currentCourseIds = currentCourses.map((c: any) => c.course.id);
        const newCourseIds = selectedCourses.map(c => c.id);

        // Remove courses that are no longer selected
        for (const currentCourse of currentCourses) {
          if (!newCourseIds.includes(currentCourse.course.id)) {
            await fetch(`/api/admin/programs/${targetProgramId}/courses/${currentCourse.course.id}`, {
              method: 'DELETE'
            });
          }
        }

        // Add new courses and update order for all
        for (const course of selectedCourses) {
          if (!currentCourseIds.includes(course.id)) {
            // Add new course
            await fetch(`/api/admin/programs/${targetProgramId}/courses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                courseId: course.id, 
                order: course.order 
              })
            });
          } else {
            // Update order for existing course
            await fetch(`/api/admin/programs/${targetProgramId}/courses/${course.id}/reorder`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order: course.order })
            });
          }
        }
      } else {
        // For new programs: add all courses
        for (const course of selectedCourses) {
          await fetch(`/api/admin/programs/${targetProgramId}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              courseId: course.id, 
              order: course.order 
            })
          });
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['programs'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['program', programId] });
      }
      router.push('/admin/programs');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData({ ...formData, [name]: checked });
        return;
    }
    
    if (name === 'title') {
        const autoSlug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        setFormData({
        ...formData,
        title: value,
        slug: autoSlug
        });
    } else {
        setFormData({ ...formData, [name]: value });
    }
  };

  const handleUserTypeChange = (userTypeId: string) => {
    setSelectedUserTypeIds(prev => {
      if (prev.includes(userTypeId)) {
        return prev.filter(id => id !== userTypeId);
      } else {
        return [...prev, userTypeId];
      }
    });
  };

  const handleAddCourse = (courseId: string) => {
    const course = allCourses?.find((c: any) => c.id === courseId);
    if (course) {
      const newOrder = selectedCourses.length;
      setSelectedCourses([...selectedCourses, { 
        id: course.id, 
        title: course.title,
        order: newOrder 
      }]);
    }
  };

  const handleRemoveCourse = (courseId: string) => {
    const updatedCourses = selectedCourses
      .filter(c => c.id !== courseId)
      .map((c, index) => ({ ...c, order: index })); // Re-index orders
    setSelectedCourses(updatedCourses);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedCourseIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    
    if (draggedCourseIndex === null || draggedCourseIndex === targetIndex) {
      setDraggedCourseIndex(null);
      return;
    }

    const updatedCourses = [...selectedCourses];
    const [movedCourse] = updatedCourses.splice(draggedCourseIndex, 1);
    updatedCourses.splice(targetIndex, 0, movedCourse);
    
    // Update orders
    const reorderedCourses = updatedCourses.map((course, index) => ({
      ...course,
      order: index
    }));
    
    setSelectedCourses(reorderedCourses);
    setDraggedCourseIndex(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      ...formData,
      userTypeIds: selectedUserTypeIds
    };

    saveMutation.mutate(submitData);
  };

  if (isProgramLoading || isCloneLoading) {
    return <div className="p-8 text-center"><div className="animate-pulse text-[var(--text-primary)]">Loading program data...</div></div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-6">
        {isEditMode ? 'Edit Program' : isCloneMode ? 'Clone Program' : 'Create New Program'}
      </h1>

      {isCloneMode && cloneData && (
        <div className="mb-6 p-4 bg-[var(--primary-surface)] border border-[var(--primary-light)] rounded-md">
          <p className="text-sm text-[var(--primary-dark)]">
            <strong>Cloning from:</strong> {cloneData.title}
          </p>
          <p className="text-xs text-[var(--primary-dark)] mt-1">
            This will copy all user types and {cloneData.courses?.length || 0} course(s) to the new program.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Program Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Program Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="title">
                    Program Title <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="slug">
                    Slug <span className="text-[var(--danger)]">*</span>
                  </label>
                  <input
                    id="slug"
                    name="slug"
                    type="text"
                    required
                    value={formData.slug}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Used in URLs. Auto-generated from title but can be customized.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1" htmlFor="description">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)] focus:border-[var(--primary-light)]"
                  />
                </div>

                <div>
                  <MultiSelectDropdown
                    label="Assigned User Types"
                    options={userTypes || []}
                    selectedIds={selectedUserTypeIds}
                    onChange={handleUserTypeChange}
                    labelField="name"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Users of these types will automatically be assigned to this program.
                  </p>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-[var(--text-primary)]">Active Program</span>
                  </label>
                  <p className="text-xs text-[var(--text-muted)] ml-6">
                    Inactive programs are not visible to learners but still exist in the database.
                  </p>
                </div>
              </div>
            </div>

            {/* Courses Section */}
            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Program Courses ({selectedCourses.length})</h2>
              
              {selectedCourses.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-sm">
                  No courses added yet. Add courses from the panel on the right.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    Drag and drop to reorder courses
                  </p>
                  {selectedCourses.map((course, index) => (
                    <div
                      key={course.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className="flex items-center justify-between p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:bg-[var(--primary-surface)] cursor-move transition-colors duration-[--transition-base]"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-5 h-5 text-[var(--text-muted)]" />
                        <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                          ${index % 2 === 0 
                            ? 'bg-[var(--primary-surface)] text-[var(--primary-dark)]' 
                            : 'bg-[var(--success-light)] text-[var(--success-dark)]'
                          }`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">{course.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCourse(course.id)}
                        className="flex items-center gap-1 text-[var(--danger)] hover:text-[var(--danger-dark)] text-sm p-2 hover:bg-[var(--danger-light)] rounded transition-colors duration-[--transition-base]"
                        title="Remove Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Available Courses */}
          <div className="lg:col-span-1">
            <div className="bg-[var(--background)] rounded-lg shadow-md p-6 sticky top-8 border border-[var(--border)]">
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-4">Available Courses</h2>
              
              {!allCourses ? (
                <p className="text-[var(--text-secondary)] text-sm">Loading courses...</p>
              ) : (
                <>
                  {/* Search Input */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search courses..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-light)]"
                    />
                  </div>

                  {/* Courses List */}
                  {filteredCourses.length === 0 ? (
                    <p className="text-[var(--text-secondary)] text-sm">
                      {courseSearch ? 'No courses match your search.' : 'All courses have been added to this program.'}
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {filteredCourses.map((course: any) => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 bg-[var(--surface)] rounded border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
                        >
                          <div className="flex-1 min-w-0 mr-2">
                            <p className="font-medium text-sm text-[var(--text-primary)] truncate">{course.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{course.difficulty}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddCourse(course.id)}
                            className="px-3 py-1 text-xs btn btn-primary flex-shrink-0"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {saveMutation.isError && (
          <div className="p-3 bg-[var(--danger-light)] text-[var(--danger-dark)] rounded border border-[var(--danger-light)]">
            {saveMutation.error.message}
          </div>
        )}

        <div className="flex justify-end gap-3 bg-[var(--background)] p-4 rounded-lg shadow-md border border-[var(--border)]">
          <button
            type="button"
            onClick={() => router.push('/admin/programs')}
            className="px-4 py-2 border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-md transition-colors duration-[--transition-base]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="px-4 py-2 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveMutation.isPending
              ? isEditMode ? 'Saving...' : 'Creating...'
              : isEditMode ? 'Save Program' : isCloneMode ? 'Clone Program' : 'Create Program'}
          </button>
        </div>
      </form>
    </div>
  );
}