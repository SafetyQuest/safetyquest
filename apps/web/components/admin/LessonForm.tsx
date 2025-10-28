'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GameEditor from './GameEditor';

type LessonFormProps = {
  lessonId?: string; // If provided, it's edit mode
  initialData?: any;
};

// Step types
const STEP_TYPES = {
  CONTENT: {
    type: 'content',
    options: [
      { value: 'text', label: 'Text' },
      { value: 'image', label: 'Image' },
      { value: 'video', label: 'Video' },
      { value: 'embed', label: 'Embed' }
    ]
  },
  GAME: {
    type: 'game',
    options: [
      { value: 'hotspot', label: 'Hotspot Game' },
      { value: 'drag-drop', label: 'Drag & Drop' },
      { value: 'matching', label: 'Matching Game' },
      { value: 'sequence', label: 'Sequence Game' },
      { value: 'true-false', label: 'True/False' },
      { value: 'multiple-choice', label: 'Multiple Choice' },
      { value: 'fill-blank', label: 'Fill in the Blank' },
      { value: 'scenario', label: 'Scenario Game' }
    ]
  }
};

// SortableItem component for drag and drop
function SortableItem({ id, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

// StepItem component
function StepItem({ step, index, onUpdate, onDelete, setEditingGameStep }) {
  const isContentStep = step.type === 'content';
  
  return (
    <div className="border rounded-md p-4 bg-white mb-2">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center">
          <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold mr-2">
            {index + 1}
          </span>
          <h3 className="font-semibold">
            {isContentStep ? 'Content' : 'Game'}: {' '}
            {isContentStep ? 
              step.contentType.charAt(0).toUpperCase() + step.contentType.slice(1) :
              STEP_TYPES.GAME.options.find(opt => opt.value === step.gameType)?.label
            }
          </h3>
        </div>
        <button
          onClick={() => onDelete(step.id)}
          className="text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
      
      {/* Render based on type */}
      {isContentStep ? (
        <div>
          {/* Text content */}
          {step.contentType === 'text' && (
            <textarea
              value={step.contentData?.html || ''}
              onChange={(e) => onUpdate(step.id, { 
                ...step, 
                contentData: { html: e.target.value } 
              })}
              className="w-full h-24 border rounded-md p-2"
              placeholder="Enter HTML content here..."
            />
          )}
          
          {/* Image content */}
          {step.contentType === 'image' && (
            <div>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={step.contentData?.url || ''}
                  onChange={(e) => onUpdate(step.id, { 
                    ...step, 
                    contentData: { ...step.contentData, url: e.target.value } 
                  })}
                  className="flex-1 border rounded-md p-2 mr-2"
                  placeholder="Image URL..."
                />
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md">
                  Upload
                </button>
              </div>
              <input
                type="text"
                value={step.contentData?.alt || ''}
                onChange={(e) => onUpdate(step.id, { 
                  ...step, 
                  contentData: { ...step.contentData, alt: e.target.value } 
                })}
                className="w-full border rounded-md p-2"
                placeholder="Alt text..."
              />
              {step.contentData?.url && (
                <img 
                  src={step.contentData.url} 
                  alt={step.contentData.alt || 'Preview'} 
                  className="mt-2 max-h-32 object-contain"
                />
              )}
            </div>
          )}
          
          {/* Video content */}
          {step.contentType === 'video' && (
            <div>
              <div className="flex mb-2">
                <input
                  type="text"
                  value={step.contentData?.url || ''}
                  onChange={(e) => onUpdate(step.id, { 
                    ...step, 
                    contentData: { ...step.contentData, url: e.target.value } 
                  })}
                  className="flex-1 border rounded-md p-2 mr-2"
                  placeholder="Video URL..."
                />
                <button className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md">
                  Upload
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={step.contentData?.thumbnail || ''}
                  onChange={(e) => onUpdate(step.id, { 
                    ...step, 
                    contentData: { ...step.contentData, thumbnail: e.target.value } 
                  })}
                  className="border rounded-md p-2"
                  placeholder="Thumbnail URL..."
                />
                <input
                  type="number"
                  value={step.contentData?.duration || ''}
                  onChange={(e) => onUpdate(step.id, { 
                    ...step, 
                    contentData: { ...step.contentData, duration: parseInt(e.target.value) } 
                  })}
                  className="border rounded-md p-2"
                  placeholder="Duration (seconds)..."
                />
              </div>
            </div>
          )}
          
          {/* Embed content */}
          {step.contentType === 'embed' && (
            <textarea
              value={step.contentData?.html || ''}
              onChange={(e) => onUpdate(step.id, { 
                ...step, 
                contentData: { html: e.target.value } 
              })}
              className="w-full h-24 border rounded-md p-2"
              placeholder="Enter embed HTML code..."
            />
          )}
        </div>
      ) : (
        <div>
          {/* Game configuration */}
          <div className="bg-gray-50 p-2 rounded mb-2">
            <p className="text-sm text-gray-600">
              Game configuration is managed via the specific game type interface. Click Edit to customize game parameters.
            </p>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                setEditingGameStep(step)
              }}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              Edit Game Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LessonForm({ lessonId, initialData }: LessonFormProps) {
  const router = useRouter();
  const isEditMode = !!lessonId;

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    difficulty: 'Beginner',
    quizId: '',
    tagIds: [] as string[],
    courseIds: [] as string[]
  });

  const [steps, setSteps] = useState<any[]>([]);
  const [showNewStepForm, setShowNewStepForm] = useState(false);
  const [newStepType, setNewStepType] = useState(STEP_TYPES.CONTENT.type);
  const [newStepSubtype, setNewStepSubtype] = useState('');
  const [editingGameStep, setEditingGameStep] = useState<any | null>(null);

  // For drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch tags
  const { data: tags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await fetch('/api/admin/tags');
      if (!res.ok) throw new Error('Failed to fetch tags');
      return res.json();
    }
  });

  // Fetch quizzes
  const { data: quizzes } = useQuery({
    queryKey: ['quizzes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/quizzes?type=lesson');
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      return res.json();
    }
  });

  // Fetch courses
  const { data: courses } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    }
  });

  // If editing and initialData not provided, fetch lesson
  const { data: lessonData, isLoading: isLessonLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Failed to fetch lesson');
      return res.json();
    },
    enabled: isEditMode && !initialData
  });

  // Set initial data
  useEffect(() => {
    if (isEditMode) {
      const data = initialData || lessonData;
      if (data) {
        setFormData({
          title: data.title || '',
          slug: data.slug || '',
          description: data.description || '',
          difficulty: data.difficulty || 'Beginner',
          quizId: data.quizId || '',
          tagIds: data.tags?.map((tag: any) => tag.tagId) || [],
          courseIds: data.courses?.map((course: any) => course.courseId) || []
        });
        
        if (data.steps) {
          // Ensure steps have unique IDs for drag & drop
          setSteps(data.steps.map((step: any) => ({
            ...step,
            id: step.id || `temp-${Math.random().toString(36).substring(7)}`
          })));
        }
      }
    }
  }, [isEditMode, initialData, lessonData]);

  // Save lesson mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditMode ? `/api/admin/lessons/${lessonId}` : '/api/admin/lessons';
      const method = isEditMode ? 'PATCH' : 'POST';

      // Prepare steps data - remove temp IDs
      const stepsData = steps.map(step => {
        const { id, ...stepData } = step;
        return {
          ...stepData,
          contentData: typeof stepData.contentData === 'string' 
            ? stepData.contentData 
            : JSON.stringify(stepData.contentData || {}),
          gameConfig: typeof stepData.gameConfig === 'string' 
            ? stepData.gameConfig 
            : JSON.stringify(stepData.gameConfig || {})
        };
      });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          steps: stepsData
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save lesson');
      }

      return res.json();
    },
    onSuccess: () => {
      router.push('/admin/lessons');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData({ ...formData, [name]: value });
    
    // Auto-generate slug from title
    if (name === 'title' && !formData.slug) {
      setFormData({
        ...formData,
        title: value,
        slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      });
    }
  };

  const handleTagChange = (tagId: string) => {
    setFormData(prev => {
        const tagIds = [...prev.tagIds];
        if (tagIds.includes(tagId)) {
          return { ...prev, tagIds: tagIds.filter(id => id !== tagId) };
        } else {
          return { ...prev, tagIds: [...tagIds, tagId] };
        }
      });
    };
  
    const handleCourseChange = (courseId: string) => {
      setFormData(prev => {
        const courseIds = [...prev.courseIds];
        if (courseIds.includes(courseId)) {
          return { ...prev, courseIds: courseIds.filter(id => id !== courseId) };
        } else {
          return { ...prev, courseIds: [...courseIds, courseId] };
        }
      });
    };
  
    // Steps management
    const addStep = () => {
      if (!newStepSubtype) {
        alert('Please select a content or game type');
        return;
      }
  
      const newStep = {
        id: `temp-${Math.random().toString(36).substring(7)}`,
        type: newStepType,
        order: steps.length,
      };
  
      if (newStepType === 'content') {
        newStep.contentType = newStepSubtype;
        newStep.contentData = {};
      } else {
        newStep.gameType = newStepSubtype;
        newStep.gameConfig = {};
      }
  
      setSteps([...steps, newStep]);
      setShowNewStepForm(false);
      setNewStepSubtype('');
    };
  
    const updateStep = (stepId: string, updatedStep: any) => {
      setSteps(steps.map(step => 
        step.id === stepId ? updatedStep : step
      ));
    };
  
    const deleteStep = (stepId: string) => {
      setSteps(steps.filter(step => step.id !== stepId));
    };
  
    const handleDragEnd = (event: any) => {
      const { active, over } = event;
      
      if (active.id !== over.id) {
        setSteps(items => {
          const oldIndex = items.findIndex(item => item.id === active.id);
          const newIndex = items.findIndex(item => item.id === over.id);
          
          const reordered = [...items];
          const [movedItem] = reordered.splice(oldIndex, 1);
          reordered.splice(newIndex, 0, movedItem);
          
          // Update orders
          return reordered.map((item, idx) => ({
            ...item,
            order: idx
          }));
        });
      }
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      saveMutation.mutate(formData);
    };
  
    if (isLessonLoading) {
      return <div className="p-8 text-center">Loading lesson data...</div>;
    }
  
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          {isEditMode ? 'Edit Lesson' : 'Create New Lesson'}
        </h1>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="title">
                  Lesson Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
  
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="slug">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used in URLs. Auto-generated from title but can be customized.
                </p>
              </div>
  
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
  
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="difficulty">
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
  
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1" htmlFor="quizId">
                  Lesson Quiz (Optional)
                </label>
                <select
                  id="quizId"
                  name="quizId"
                  value={formData.quizId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">-- No Quiz --</option>
                  {quizzes?.map((quiz: any) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Lesson quiz is taken after completing all content steps.
                </p>
              </div>
              
              <h2 className="text-xl font-bold mb-3">Lesson Steps</h2>
              
              {/* Steps List */}
              <div className="mb-6">
                {steps.length === 0 ? (
                  <p className="text-gray-600 mb-4">
                    No steps added yet. Add content or game steps below.
                  </p>
                ) : (
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={steps.map(step => step.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {steps.map((step, index) => (
                        <SortableItem key={step.id} id={step.id}>
                          <StepItem
                            step={step}
                            index={index}
                            onUpdate={updateStep}
                            onDelete={deleteStep}
                            setEditingGameStep={setEditingGameStep}
                          />
                        </SortableItem>
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
                
                {/* Add Step Form */}
                {showNewStepForm ? (
                  <div className="border rounded-md p-4 bg-gray-50 mb-4">
                    <h3 className="font-semibold mb-2">Add New Step</h3>
                    
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-sm mb-1">Step Type</label>
                        <select
                          value={newStepType}
                          onChange={(e) => {
                            setNewStepType(e.target.value);
                            setNewStepSubtype('');
                          }}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value={STEP_TYPES.CONTENT.type}>Content</option>
                          <option value={STEP_TYPES.GAME.type}>Game</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm mb-1">
                          {newStepType === 'content' ? 'Content Type' : 'Game Type'}
                        </label>
                        <select
                          value={newStepSubtype}
                          onChange={(e) => setNewStepSubtype(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">-- Select --</option>
                          {(newStepType === 'content' ? STEP_TYPES.CONTENT.options : STEP_TYPES.GAME.options)
                            .map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowNewStepForm(false)}
                        className="px-3 py-1 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addStep}
                        disabled={!newStepSubtype}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                      >
                        Add Step
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowNewStepForm(true)}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 mb-4"
                  >
                    + Add Step
                  </button>
                )}
                
                <p className="text-sm text-gray-600 mt-2">
                  Tip: Drag and drop steps to reorder them. Mix content and game steps for an engaging learning experience.
                </p>
              </div>
  
              {saveMutation.isError && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
                  {saveMutation.error.message}
                </div>
              )}
  
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/lessons')}
                  className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveMutation.isPending
                    ? isEditMode ? 'Saving...' : 'Creating...'
                    : isEditMode ? 'Save Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
          
          <div>
            {/* Tags & Courses Panel */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-lg font-bold mb-3">Tags</h2>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto mb-4">
                {tags?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No tags available. Create some tags first.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {tags?.map((tag: any) => (
                      <label key={tag.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.tagIds.includes(tag.id)}
                          onChange={() => handleTagChange(tag.id)}
                          className="mr-2"
                        />
                        <span>{tag.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              
              <h2 className="text-lg font-bold mb-3">Add to Courses</h2>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {courses?.length === 0 ? (
                  <p className="text-gray-500 text-sm">No courses available. Create some courses first.</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {courses?.map((course: any) => (
                      <label key={course.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.courseIds.includes(course.id)}
                          onChange={() => handleCourseChange(course.id)}
                          className="mr-2"
                        />
                        <span>{course.title}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Preview Panel */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold mb-3">Lesson Preview</h2>
              <p className="text-sm text-gray-600 mb-4">
                This panel will show a preview of your lesson as learners will see it.
              </p>
              
              <button
                type="button"
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
                disabled={steps.length === 0}
                onClick={() => {/* TODO: Show preview modal */}}
              >
                Preview Lesson
              </button>
            </div>
            {editingGameStep && (
                <GameEditor
                    gameType={editingGameStep.gameType}
                    initialConfig={
                    typeof editingGameStep.gameConfig === 'string'
                        ? JSON.parse(editingGameStep.gameConfig || '{}')
                        : editingGameStep.gameConfig || {}
                    }
                    isQuizQuestion={false}
                    onSave={(newConfig) => {
                    updateStep(editingGameStep.id, {
                        ...editingGameStep,
                        gameConfig: JSON.stringify(newConfig)
                    });
                    setEditingGameStep(null);
                    }}
                    onClose={() => setEditingGameStep(null)}
                />
            )}
          </div>
        </div>
      </div>
    );
  }