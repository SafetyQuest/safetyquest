'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GameEditor from './GameEditor';
import MediaSelector from './MediaSelector';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import MultiSelectDropdown from '../MultiSelectDropdown';
import { Trash, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'; 

function RichTextEditor({ content, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content: content || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose max-w-none p-3 min-h-[96px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p></p>');
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="border rounded-md p-2 min-h-24 flex items-center justify-center text-gray-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <div className="border-b p-2 flex gap-2 flex-wrap bg-gray-50">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('bold') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('italic') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 2 }) 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('heading', { level: 3 }) 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          H3
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('bulletList') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 rounded text-sm ${
            editor.isActive('orderedList') 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100 border'
          }`}
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHardBreak().run()}
          className="px-3 py-1 rounded text-sm bg-white hover:bg-gray-100 border"
          title="Insert line break"
        >
          ↵ Break
        </button>
        
        <div className="border-l pl-2 ml-1 flex gap-2">
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive({ textAlign: 'left' }) 
                ? 'bg-blue-600 text-white' 
                : 'bg-white hover:bg-gray-100 border'
            }`}
            title="Align left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive({ textAlign: 'center' }) 
                ? 'bg-blue-600 text-white' 
                : 'bg-white hover:bg-gray-100 border'
            }`}
            title="Align center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`px-3 py-1 rounded text-sm ${
              editor.isActive({ textAlign: 'right' }) 
                ? 'bg-blue-600 text-white' 
                : 'bg-white hover:bg-gray-100 border'
            }`}
            title="Align right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

type LessonFormProps = {
  lessonId?: string;
  initialData?: any;
};

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
      { value: 'scenario', label: 'Scenario Game' },
      { value: 'time-attack-sorting', label: 'Time-Attack Sorting' },
      { value: 'memory-flip', label: 'Memory Flip Game' },
      { value: 'photo-swipe', label: 'Photo Swipe Game' }
    ]
  }
};

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

  const filteredListeners = Object.fromEntries(
    Object.entries(listeners).map(([key, listener]) => [
      key,
      (event: PointerEvent) => {
        const target = event.target as HTMLElement;
        if (target.closest('input, textarea, select, button, .ProseMirror')) {
          return;
        }
        listener(event);
      },
    ])
  );
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...filteredListeners}
    >
      {children}
    </div>
  );
}

function StepItem({ step, index, onUpdate, onDelete, setEditingGameStep }) {
  const [showMediaSelector, setShowMediaSelector] = useState(false);
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
          onClick={() => {
            if (window.confirm('Are you sure you want to remove this step?')) {
              onDelete(step.id);
            }
          }}
          className="text-red-600 hover:text-red-800 p-1 rounded cursor-pointer"
          title="Remove Step"
        >
          <Trash className="w-4 h-4" />
        </button>
      </div>
      
      {isContentStep ? (
        <div>
          {step.contentType === 'text' && (
            <RichTextEditor
              content={step.contentData?.html || ''}
              onChange={(html) => onUpdate(step.id, { 
                ...step, 
                contentData: { html } 
              })}
            />
          )}
          
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
                <button
                  type="button"
                  className="px-3 py-2 border rounded-md bg-gray-100 hover:bg-gray-200"
                  onClick={() => setShowMediaSelector(true)}
                >
                  Select Image
                </button>
              </div>
              {showMediaSelector && (
                <MediaSelector
                  accept="image/*"
                  onSelect={(url, fileInfo) => {
                    onUpdate(step.id, {
                      ...step,
                      contentData: {
                        ...step.contentData,
                        url,
                        alt: fileInfo.filename,
                      },
                    });
                    setShowMediaSelector(false);
                  }}
                  onClose={() => setShowMediaSelector(false)}
                />
              )}
              <input
                type="text"
                value={step.contentData?.alt || ''}
                onChange={(e) => {
                    e.preventDefault();
                    onUpdate(step.id, { 
                    ...step, 
                    contentData: { ...step.contentData, alt: e.target.value } 
                })}}
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
              <input
                type="text"
                value={step.contentData?.title || ''}
                onChange={(e) =>
                  onUpdate(step.id, {
                    ...step,
                    contentData: { ...step.contentData, title: e.target.value }
                  })
                }
                className="w-full border rounded-md p-2 mt-2"
                placeholder="Image title (optional)"
              />

              <textarea
                value={step.contentData?.description || ''}
                onChange={(e) =>
                  onUpdate(step.id, {
                    ...step,
                    contentData: { ...step.contentData, description: e.target.value }
                  })
                }
                className="w-full border rounded-md p-2 mt-2"
                placeholder="Description (optional)"
              />
            </div>
          )}
          
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
                <button
                  type="button"
                  className="px-3 py-2 border rounded-md bg-gray-100 hover:bg-gray-200"
                  onClick={() => setShowMediaSelector(true)}
                >
                  Select Video
                </button>
              </div>
              {showMediaSelector && (
                <MediaSelector
                  accept="video/*"
                  onSelect={(url, fileInfo) => {
                    onUpdate(step.id, {
                      ...step,
                      contentData: {
                        ...step.contentData,
                        url,
                        thumbnail: step.contentData?.thumbnail || '',
                        duration: step.contentData?.duration || 0,
                      },
                    });
                    setShowMediaSelector(false);
                  }}
                  onClose={() => setShowMediaSelector(false)}
                />
              )}
              <input
                type="text"
                value={step.contentData?.title || ''}
                onChange={(e) =>
                  onUpdate(step.id, {
                    ...step,
                    contentData: { ...step.contentData, title: e.target.value }
                  })
                }
                className="w-full border rounded-md p-2 mt-2"
                placeholder="Video title (optional)"
              />

              <textarea
                value={step.contentData?.description || ''}
                onChange={(e) =>
                  onUpdate(step.id, {
                    ...step,
                    contentData: { ...step.contentData, description: e.target.value }
                  })
                }
                className="w-full border rounded-md p-2 mt-2"
                placeholder="Description (optional)"
              />

            </div>
          )}
          
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
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = !!lessonId;
  
  // Get clone parameter from URL
  const cloneFromId = searchParams?.get('clone');
  const isCloneMode = !!cloneFromId && !isEditMode;

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

  // Fetch lesson to clone
  const { data: cloneData, isLoading: isCloneLoading } = useQuery({
    queryKey: ['lesson', cloneFromId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/lessons/${cloneFromId}`);
      if (!res.ok) throw new Error('Failed to fetch lesson to clone');
      return res.json();
    },
    enabled: isCloneMode
  });

  // Fetch quizzes
  const { data: quizzes } = useQuery({
    queryKey: ['quizzes', 'lesson', 'unassigned', lessonId, lessonData?.quizId],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'lesson',
        unassignedOnly: 'true'
      });
      
      if (isEditMode && lessonData?.quizId) {
        params.append('includeQuizId', lessonData.quizId);
      }
      
      const res = await fetch(`/api/admin/quizzes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch quizzes');
      return res.json();
    },
    enabled: !isEditMode || !!lessonData
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
          setSteps(data.steps.map((step: any) => ({
            ...step,
            id: step.id || `temp-${Math.random().toString(36).substring(7)}`,
            contentData: typeof step.contentData === 'string' 
              ? JSON.parse(step.contentData) 
              : step.contentData,
          })));
        }
      }
    } else if (isCloneMode && cloneData) {
      // Set data from clone source
      setFormData({
        title: `${cloneData.title} (Copy)`,
        slug: `${cloneData.slug}-copy`,
        description: cloneData.description || '',
        difficulty: cloneData.difficulty || 'Beginner',
        quizId: '', // Don't clone quiz
        tagIds: cloneData.tags?.map((tag: any) => tag.tagId) || [],
        courseIds: [] // Don't clone course associations
      });

      // Clone all steps with their content
      if (cloneData.steps) {
        setSteps(cloneData.steps.map((step: any) => ({
          ...step,
          id: `temp-${Math.random().toString(36).substring(7)}`,
          contentData: typeof step.contentData === 'string' 
            ? JSON.parse(step.contentData) 
            : step.contentData,
          gameConfig: typeof step.gameConfig === 'string'
            ? JSON.parse(step.gameConfig)
            : step.gameConfig,
        })));
      }
    }
  }, [isEditMode, isCloneMode, initialData, lessonData, cloneData]);

  // Save lesson mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditMode ? `/api/admin/lessons/${lessonId}` : '/api/admin/lessons';
      const method = isEditMode ? 'PATCH' : 'POST';

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
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['lesson', lessonId] });
      }
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      router.push('/admin/lessons');
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
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
          
          return reordered.map((item, idx) => ({
            ...item,
            order: idx
          }));
        });
      }
    };
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const formDataToSubmit = {
        ...formData,
        quizId: formData.quizId && formData.quizId.trim() !== '' ? formData.quizId : undefined
      };
      saveMutation.mutate(formDataToSubmit);
    };
  
    if (isLessonLoading || isCloneLoading) {
      return <div className="p-8 text-center">Loading lesson data...</div>;
    }
  
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">
          {isEditMode ? 'Edit Lesson' : isCloneMode ? 'Clone Lesson' : 'Create New Lesson'}
        </h1>

        {isCloneMode && cloneData && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Cloning from:</strong> {cloneData.title}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              This will copy tags and all {cloneData.steps?.length || 0} step(s) to the new lesson.
            </p>
          </div>
        )}
  
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
                    : isEditMode ? 'Save Lesson' : isCloneMode ? 'Clone Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
          
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <MultiSelectDropdown
                label="Tags"
                options={tags?.map((tag: any) => ({ id: tag.id, name: tag.name })) || []}
                selectedIds={formData.tagIds}
                onChange={handleTagChange}
              />
              
              <div className="mt-4">
                <MultiSelectDropdown
                  label="Courses"
                  options={courses?.map((course: any) => ({ id: course.id, name: course.title })) || []}
                  selectedIds={formData.courseIds}
                  onChange={handleCourseChange}
                />
              </div>
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