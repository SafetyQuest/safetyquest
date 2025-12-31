// apps/web/components/admin/QuizForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GameEditor from './GameEditor';

type QuizFormProps = {
  quizId?: string;
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

export default function QuizForm({ quizId }: QuizFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isEditMode = !!quizId;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    type: 'lesson', // 'gap_assessment', 'lesson', 'course'
    passingScore: 70
  });
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newGameType, setNewGameType] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  
  // Fetch quiz data if in edit mode
  const { data: quizData, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/quizzes/${quizId}`);
      if (!res.ok) throw new Error('Failed to fetch quiz');
      return res.json();
    },
    enabled: isEditMode
  });
  
  // Set initial data when in edit mode
  useEffect(() => {
    if (isEditMode && quizData) {
      setFormData({
        title: quizData.title || '',
        slug: quizData.slug || '',
        description: quizData.description || '',
        type: quizData.type || 'lesson',
        passingScore: quizData.passingScore || 70
      });
      
      if (quizData.questions) {
        setQuestions(quizData.questions.map(q => ({
          ...q,
          gameConfig: typeof q.gameConfig === 'string' ? JSON.parse(q.gameConfig) : q.gameConfig
        })));
      }
    }
  }, [isEditMode, quizData]);
  
  // Save quiz mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = isEditMode ? `/api/admin/quizzes/${quizId}` : '/api/admin/quizzes';
      const method = isEditMode ? 'PATCH' : 'POST';
      
      const questionsData = questions.map(q => ({
        ...q,
        gameConfig: typeof q.gameConfig === 'string' ? q.gameConfig : JSON.stringify(q.gameConfig)
      }));
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          questions: questionsData
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save quiz');
      }
      
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      if (isEditMode) {
        queryClient.invalidateQueries({ queryKey: ['quiz', quizId] });
      }
      router.push('/admin/quizzes');
    }
  });
  
  // Handle form changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'passingScore') {
      setFormData({
        ...formData,
        passingScore: Math.min(Math.max(0, parseInt(value) || 0), 100)
      });
    } else if (name === 'title') {
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
  
  // Question management
  const addQuestion = () => {
    if (!newGameType) return;
    
    const newQuestion = {
      id: `temp-${Date.now()}`,
      order: questions.length,
      gameType: newGameType,
      gameConfig: {},
      difficulty: 3,
      points: 10  // Default points (will auto-sync when game is configured)
    };
    
    setQuestions([...questions, newQuestion]);
    setNewGameType('');
    setShowAddQuestion(false);
    setEditingQuestion(newQuestion);
  };
  
  const updateQuestion = (id: string, updates: Partial<any>) => {
    setQuestions(questions.map(q => 
      q.id === id ? { ...q, ...updates } : q
    ));
    
    // If we're editing this question, update the editing state
    if (editingQuestion && editingQuestion.id === id) {
      setEditingQuestion({ ...editingQuestion, ...updates });
    }
  };
  
  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
    
    // If we're editing this question, close the editor
    if (editingQuestion && editingQuestion.id === id) {
      setEditingQuestion(null);
    }
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setQuestions(items => {
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
  
  // Helper function to get a text preview of the question
  const getQuestionPreview = (question: any): string => {
    const config = question.gameConfig;
    
    switch(question.gameType) {
      case 'multiple-choice':
        return `Q: ${config.question || '[No question text]'} (${config.options?.length || 0} options)`;
      case 'true-false':
        return `Q: ${config.question || '[No question text]'} - Statement: ${config.statement || '[No statement]'}`;
      case 'matching':
        return `Matching game with ${config.pairs?.length || 0} pairs`;
      case 'sequence':
        return `Sequence game with ${config.items?.length || 0} items to arrange`;
      case 'hotspot':
        return `Hotspot game with ${config.hotspots?.length || 0} target areas`;
      case 'drag-drop':
        return `Drag & Drop game with ${config.items?.length || 0} items and ${config.targets?.length || 0} targets`;
      case 'fill-blank':
        return `Fill in the blank: ${config.beforeText || '...'} ____ ${config.afterText || '...'}`;
      case 'scenario':
        return `Scenario: ${config.scenario?.substring(0, 50) || '[No scenario]'}${config.scenario?.length > 50 ? '...' : ''}`;
      case 'photo-swipe':
        return `PhotoSwipe game with ${config.cards?.length || 0} card${(config.cards?.length || 0) !== 1 ? 's' : ''}`;
      case 'memory-flip':
        return `Memory Flip game with ${config.cards?.length || 0} cards`;
      case 'time-attack-sorting':
        return `Time Attack Sorting with ${config.items?.length || 0} items, ${config.targets?.length || 0} target zones, and a ${config.timeLimitSeconds || 60}s time limit`;

      default:
        return `${question.gameType} game`;
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (questions.length === 0) {
      alert('Please add at least one question to the quiz');
      return;
    }
    
    saveMutation.mutate(formData);
  };
  
  if (isEditMode && isLoading) {
    return <div className="p-8 text-center">Loading quiz data...</div>;
  }
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">
        {isEditMode ? 'Edit Quiz' : 'Create New Quiz'}
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1" htmlFor="title">
                  Quiz Title <span className="text-red-500">*</span>
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
                <label className="block text-sm font-medium mb-1" htmlFor="type">
                  Quiz Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="gap_assessment">Gap Assessment</option>
                  <option value="lesson">Lesson Quiz</option>
                  <option value="course">Course Quiz</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Gap Assessment: Initial knowledge check<br />
                  Lesson Quiz: Assessment for a lesson<br />
                  Course Quiz: Comprehensive assessment for a course
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
                <label className="block text-sm font-medium mb-1" htmlFor="passingScore">
                  Passing Score (%)
                </label>
                <input
                  id="passingScore"
                  name="passingScore"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.passingScore}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            
            {/* Questions */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Quiz Questions</h2>
                <button
                  type="button"
                  onClick={() => setShowAddQuestion(true)}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                >
                  + Add Question
                </button>
              </div>
              
              {showAddQuestion && (
                <div className="border rounded-md p-4 bg-gray-50 mb-4">
                  <h3 className="font-medium mb-2">Add New Question</h3>
                  <div className="mb-3">
                    <label className="block text-sm mb-1">Question Type</label>
                    <select
                      value={newGameType}
                      onChange={(e) => setNewGameType(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option value="">-- Select Game Type --</option>
                      <option value="hotspot">Hotspot</option>
                      <option value="drag-drop">Drag & Drop</option>
                      <option value="matching">Matching</option>
                      <option value="sequence">Sequence</option>
                      <option value="true-false">True/False</option>
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="scenario">Scenario</option>
                      <option value="time-attack-sorting">Time-Attack Sorting</option>
                      <option value="memory-flip">Memory Flip Game</option>
                      <option value="photo-swipe">Photo Swipe Game</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAddQuestion(false)}
                      className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={addQuestion}
                      disabled={!newGameType}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              )}
              
              {/* Questions list */}
              {questions.length === 0 ? (
                <div className="border border-dashed rounded-md p-4 text-center text-gray-500 mb-4">
                  No questions added yet. Add a question to get started.
                </div>
              ) : (
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={questions.map(q => q.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 mb-4">
                      {questions.map((question, index) => (
                        <SortableItem key={question.id} id={question.id}>
                          <div className={`border rounded-md p-4 bg-gray-50 cursor-grab ${
                            editingQuestion?.id === question.id ? 'ring-2 ring-blue-300' : ''
                          }`}>
                            <div className="space-y-3">
                              {/* Header Row */}
                              <div className="flex justify-between items-start">
                                <div className="flex items-center">
                                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold mr-2">
                                    {index + 1}
                                  </span>
                                  <div>
                                    <h3 className="font-medium">
                                      {question.gameType.charAt(0).toUpperCase() + question.gameType.slice(1).replace('-', ' ')}
                                    </h3>
                                    <div className="text-sm text-gray-600">
                                      <span>Points: {question.points}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex space-x-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditingQuestion(question)}
                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (window.confirm('Are you sure you want to delete this question?')) {
                                        deleteQuestion(question.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {/* Difficulty Selector */}
                              <div className="flex items-center space-x-2">
                                <label className="text-xs font-medium text-gray-600">Difficulty:</label>
                                <div className="flex space-x-1">
                                  {[1, 2, 3, 4, 5].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        updateQuestion(question.id, { difficulty: num });
                                      }}
                                      className={`w-7 h-7 rounded-md border text-xs font-semibold transition-colors ${
                                        question.difficulty === num
                                          ? 'bg-blue-600 text-white border-blue-600'
                                          : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                      }`}
                                      title={`Difficulty ${num}`}
                                    >
                                      {num}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Question preview */}
                              <div className="pt-2 border-t border-gray-200">
                                <div className="text-sm text-gray-700">
                                  {getQuestionPreview(question)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              
              <div className="text-sm text-gray-600">
                Tip: Drag questions to reorder them. Questions will be presented in this order.
              </div>
            </div>
            
            {/* Submit buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.push('/admin/quizzes')}
                className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || questions.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saveMutation.isPending
                  ? isEditMode ? 'Saving...' : 'Creating...'
                  : isEditMode ? 'Save Quiz' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
        
        {/* Sidebar */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold mb-3">Quiz Settings</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Usage</h3>
                <p className="mt-1 text-sm">
                  {formData.type === 'gap_assessment' && 
                    'This quiz will be used to assess initial knowledge gaps.'}
                  {formData.type === 'lesson' && 
                    'This quiz will be attached to a lesson for assessment.'}
                  {formData.type === 'course' && 
                    'This quiz will be used as a comprehensive assessment for a course.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Passing Score</h3>
                <p className="mt-1 text-sm">
                  Users need {formData.passingScore}% to pass this quiz.
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Points</h3>
                <p className="mt-1 text-sm">
                  {questions.reduce((sum, q) => sum + q.points, 0)} points across {questions.length} questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Game Editor Modal */}
      {editingQuestion && (
        <GameEditor
          gameType={editingQuestion.gameType}
          initialConfig={editingQuestion.gameConfig}
          isQuizQuestion={true}
          onSave={(newConfig) => {
            // ✅ AUTO-SYNC: question.points = gameConfig.totalPoints
            const autoSyncedPoints = newConfig.totalPoints || newConfig.totalXp || editingQuestion.points;
            
            updateQuestion(editingQuestion.id, {
              gameConfig: newConfig,
              points: autoSyncedPoints  // ✅ Auto-synced!
            });
            setEditingQuestion(null);
          }}
          onClose={() => setEditingQuestion(null)}
        />
      )}
    </div>
  );
}