// apps/web/components/admin/games/MultipleChoiceEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ImageSelector from '../ImageSelector';
import MediaSelector from '../MediaSelector';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ============================================================================
// TYPES (Aligned with runtime usage - single activity)
// ============================================================================

type MultipleChoiceOption = {
  id: string;
  text: string;
  correct: boolean;  // Note: 'correct', not 'isCorrect'
  imageUrl?: string; // Optional image for visual options
};

type MultipleChoiceConfig = {
  instruction: string;  // Standardized field (matches HotspotEditor/SequenceEditor)
  instructionImageUrl?: string; // Optional image for the question
  options: MultipleChoiceOption[];
  allowMultipleCorrect: boolean;
  points?: number;   // For quiz mode
  xp?: number;       // For lesson mode
};

type MultipleChoiceEditorProps = {
  config: any;
  onChange: (newConfig: MultipleChoiceConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// SORTABLE OPTION COMPONENT
// ============================================================================

function SortableOption({ 
  option, 
  index,
  isSelected, 
  onSelect,
  onToggleCorrect,
  allowMultipleCorrect
}: { 
  option: MultipleChoiceOption; 
  index: number;
  isSelected: boolean; 
  onSelect: () => void;
  onToggleCorrect: () => void;
  allowMultipleCorrect: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: option.id });

  const [imageError, setImageError] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`
        border-2 rounded-lg p-3 cursor-grab active:cursor-grabbing relative group transition-all
        ${option.correct
          ? 'bg-green-50 border-green-300 ring-1 ring-green-200'
          : 'bg-white border-gray-200 hover:bg-gray-50'}
        ${isSelected
          ? 'ring-2 ring-blue-400 border-blue-400 shadow-md'
          : 'hover:border-gray-300'}
        ${isDragging ? 'scale-105 shadow-lg z-50' : ''}
      `}
    >
      {/* Letter Badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-gray-800 text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
        {String.fromCharCode(65 + index)}
        {option.imageUrl && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"></span>
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Checkbox/Radio */}
        <input
          type={allowMultipleCorrect ? 'checkbox' : 'radio'}
          checked={option.correct}
          onChange={onToggleCorrect}
          className="mt-0.5 flex-shrink-0 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        />
        
        {/* Option Image (if present) */}
        {option.imageUrl && !imageError ? (
          <img 
            src={option.imageUrl} 
            alt={option.text || `Option ${String.fromCharCode(65 + index)}`}
            className="w-16 h-16 rounded border object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : option.imageUrl && imageError ? (
          <div className="w-16 h-16 rounded border border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : null}
        
        {/* Option Text */}
        <span className="flex-1 break-words text-sm pr-6">{option.text}</span>
      </div>

      {/* Drag Indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// OPTION EDIT MODAL
// ============================================================================

// ============================================================================
// OPTION EDIT MODAL
// ============================================================================

function OptionEditModal({
  option,
  index,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage
}: {
  option: MultipleChoiceOption;
  index: number;
  onUpdate: (updates: Partial<MultipleChoiceOption>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
}) {
  const [text, setText] = useState(option.text);
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    if (!text?.trim()) {
      toast.error('Option text cannot be empty');
      return;
    }
    onUpdate({ text: text.trim() });
    onClose();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && e.ctrlKey) handleSave();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Option {String.fromCharCode(65 + index)}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Option Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Option Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., Wear gloves and goggles"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Press Ctrl+Enter to save, Esc to cancel
            </p>
          </div>

          {/* Option Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Option Image (Optional)
            </label>
            
            {option.imageUrl ? (
              <div className="space-y-2">
                {!imageError ? (
                  <img
                    src={option.imageUrl}
                    alt="Option"
                    className="w-full h-48 object-contain border rounded-md bg-gray-50"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-48 border rounded-md bg-gray-100 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">Image failed to load</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={onSelectImage}
                    className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
              >
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600">Click to add image</p>
                <p className="text-xs text-gray-500 mt-1">Great for visual options (e.g., safety signs)</p>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Delete Option
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MultipleChoiceEditor({
  config,
  onChange,
  isQuizQuestion
}: MultipleChoiceEditorProps) {
  // ============================================================================
  // STATE & SENSORS
  // ============================================================================
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showInstructionImageSelector, setShowInstructionImageSelector] = useState(false);
  const [imageTargetType, setImageTargetType] = useState<'instruction' | 'option'>('option');

  // ============================================================================
  // INITIALIZE CONFIG
  // ============================================================================
  
  const initializedConfig: MultipleChoiceConfig = {
    instruction: config.instruction || '',
    instructionImageUrl: config.instructionImageUrl || undefined,
    options: config.options || [],
    allowMultipleCorrect: config.allowMultipleCorrect === true,
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const correctCount = initializedConfig.options.filter(opt => opt.correct).length;
  const currentReward = isQuizQuestion ? (initializedConfig.points || 0) : (initializedConfig.xp || 0);

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete selected option
      if (e.key === 'Delete' && selectedOptionIndex !== null && editingOptionIndex === null) {
        e.preventDefault();
        deleteOption(selectedOptionIndex);
      }
      // Escape to deselect
      if (e.key === 'Escape' && selectedOptionIndex !== null && editingOptionIndex === null) {
        setSelectedOptionIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOptionIndex, editingOptionIndex]);

  // ============================================================================
  // HANDLERS - INSTRUCTION & SETTINGS
  // ============================================================================

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...initializedConfig, instruction: e.target.value });
  };

  const handleAllowMultipleCorrectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowMultiple = e.target.checked;
    let newOptions = [...initializedConfig.options];

    // If disabling multiple-correct and multiple are selected, keep only first
    if (!allowMultiple && correctCount > 1) {
      const firstCorrectIndex = newOptions.findIndex(opt => opt.correct);
      if (firstCorrectIndex !== -1) {
        newOptions = newOptions.map((opt, i) => ({
          ...opt,
          correct: i === firstCorrectIndex
        }));
      }
      toast.success('Only first correct answer kept', { duration: 2000 });
    }

    onChange({
      ...initializedConfig,
      allowMultipleCorrect: allowMultiple,
      options: newOptions
    });
  };

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value) || 0;
    if (value < 0) value = 0;
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion ? { points: value } : { xp: value })
    });
  };

  // ============================================================================
  // HANDLERS - OPTIONS
  // ============================================================================

  const handleAddOption = () => {
    const trimmed = newOptionText.trim();
    if (!trimmed) {
      toast.error('Option text cannot be empty', { duration: 2000 });
      return;
    }

    // Prevent duplicates (case-insensitive)
    const exists = initializedConfig.options.some(
      opt => opt.text.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      toast.error('This option already exists', { duration: 2000 });
      return;
    }

    // Max 6 options (cognitive load best practice)
    if (initializedConfig.options.length >= 6) {
      toast.error('Maximum 6 options recommended', { duration: 3000 });
      return;
    }

    const newOption: MultipleChoiceOption = {
      id: `opt_${Date.now()}`,
      text: trimmed,
      correct: false
    };

    const newOptions = [...initializedConfig.options, newOption];
    onChange({ ...initializedConfig, options: newOptions });
    setNewOptionText('');
    setSelectedOptionIndex(newOptions.length - 1);
    toast.success('Option added', { duration: 1000 });
  };

  const updateOption = (index: number, updates: Partial<MultipleChoiceOption>) => {
    if (index < 0 || index >= initializedConfig.options.length) return;

    const newOptions = [...initializedConfig.options];
    const current = newOptions[index];
    newOptions[index] = { ...current, ...updates };

    // Enforce single-correct if needed
    if (updates.correct === true && !initializedConfig.allowMultipleCorrect) {
      newOptions.forEach((opt, i) => {
        if (i !== index) opt.correct = false;
      });
    }

    onChange({ ...initializedConfig, options: newOptions });
  };

  const deleteOption = (index: number) => {
    if (index < 0 || index >= initializedConfig.options.length) return;

    const newOptions = [...initializedConfig.options];
    newOptions.splice(index, 1);
    onChange({ ...initializedConfig, options: newOptions });
    
    // Adjust selected index
    setSelectedOptionIndex(prev => 
      prev === null ? null :
      prev === index ? null :
      prev > index ? prev - 1 : prev
    );
    
    toast.success('Option deleted', { duration: 1000 });
  };

  const toggleOptionCorrect = (index: number) => {
    const option = initializedConfig.options[index];
    updateOption(index, { correct: !option.correct });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!active || !over || active.id === over.id) return;

    const oldIndex = initializedConfig.options.findIndex(opt => opt.id === active.id);
    const newIndex = initializedConfig.options.findIndex(opt => opt.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOptions = [...initializedConfig.options];
    const [moved] = newOptions.splice(oldIndex, 1);
    newOptions.splice(newIndex, 0, moved);

    onChange({ ...initializedConfig, options: newOptions });

    // Adjust selected index
    if (selectedOptionIndex === oldIndex) {
      setSelectedOptionIndex(newIndex);
    } else if (selectedOptionIndex !== null) {
      if (selectedOptionIndex > oldIndex && selectedOptionIndex <= newIndex) {
        setSelectedOptionIndex(prev => prev! - 1);
      } else if (selectedOptionIndex < oldIndex && selectedOptionIndex >= newIndex) {
        setSelectedOptionIndex(prev => prev! + 1);
      }
    }
  };

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================

  const handleSelectInstructionImage = () => {
    setImageTargetType('instruction');
    setShowInstructionImageSelector(true);
  };

  const handleRemoveInstructionImage = () => {
    const { instructionImageUrl, ...rest } = initializedConfig;
    onChange(rest);
    toast.success('Instruction image removed');
  };

  const handleInstructionImageSelect = (url: string) => {
    onChange({ ...initializedConfig, instructionImageUrl: url });
    setShowInstructionImageSelector(false);
    toast.success('Instruction image added');
  };

  const handleSelectOptionImage = () => {
    if (editingOptionIndex === null) return;
    setImageTargetType('option');
    setShowImageSelector(true);
  };

  const handleRemoveOptionImage = () => {
    if (editingOptionIndex === null) return;
    updateOption(editingOptionIndex, { imageUrl: undefined });
    toast.success('Option image removed');
  };

  const handleOptionImageSelect = (url: string) => {
    if (editingOptionIndex === null && selectedOptionIndex !== null) {
      // Inline editing from right panel
      updateOption(selectedOptionIndex, { imageUrl: url });
    } else if (editingOptionIndex !== null) {
      // Modal editing
      updateOption(editingOptionIndex, { imageUrl: url });
    }
    setShowImageSelector(false);
    toast.success('Option image added');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Instruction */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="e.g., Which of the following is the correct procedure for handling chemical spills?"
        />
      </div>

      {/* Instruction Image (Optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Question Image (Optional)
        </label>
        {initializedConfig.instructionImageUrl ? (
          <div className="relative border-2 border-gray-200 rounded-lg p-2 bg-gray-50">
            <img
              src={initializedConfig.instructionImageUrl}
              alt="Question"
              className="w-full h-48 object-contain rounded"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSelectInstructionImage}
                className="flex-1 px-3 py-1 border rounded-md text-gray-700 hover:bg-gray-100 text-sm"
              >
                Change Image
              </button>
              <button
                onClick={handleRemoveInstructionImage}
                className="px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={handleSelectInstructionImage}
            className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600">Click to add image to question</p>
            <p className="text-xs text-gray-500 mt-1">Great for showing diagrams, safety signs, or scenarios</p>
          </button>
        )}
      </div>

      {/* Reward Banner */}
      <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">
            Total {isQuizQuestion ? 'Points' : 'XP'} for correct answer:
          </span>
          <span className="text-lg font-bold text-blue-600">
            {currentReward}
          </span>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          {correctCount > 0 ? (
            <>Auto-distributed: <strong>{Math.round(currentReward / correctCount)} {isQuizQuestion ? 'pts' : 'XP'}</strong> per correct option ({correctCount} correct {correctCount === 1 ? 'option' : 'options'})</>
          ) : (
            <>Awarded when user selects {initializedConfig.allowMultipleCorrect ? 'all' : 'the'} correct {initializedConfig.allowMultipleCorrect ? 'answers' : 'answer'}.</>
          )}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="mb-6">
        {/* ===== OPTIONS LIST (Full Width) ===== */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">
              Answer Options ({initializedConfig.options.length}/6)
            </h3>
            <span className={`text-xs ${correctCount === 0 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
              Correct: {correctCount} {correctCount > 0 && `(${Math.round(currentReward / correctCount)} ${isQuizQuestion ? 'pts' : 'XP'} each)`}
            </span>
          </div>

          {/* Add Option Input */}
          <div className="border rounded-md p-3 bg-gray-50 mb-3">
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
              placeholder="Type option text (e.g., 'Wear gloves and goggles')"
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Press Enter to add • {6 - initializedConfig.options.length} slots remaining
              </p>
              <button
                onClick={handleAddOption}
                disabled={initializedConfig.options.length >= 6}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add Option
              </button>
            </div>
          </div>

          {/* Options List */}
          {initializedConfig.options.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
              <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="text-gray-500 text-sm">No options added yet</p>
              <p className="text-xs text-gray-400 mt-1">Add at least 2 options to create a valid question</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={initializedConfig.options.map(o => o.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {initializedConfig.options.map((option, index) => (
                    <SortableOption
                      key={option.id}
                      option={option}
                      index={index}
                      isSelected={selectedOptionIndex === index}
                      onSelect={() => setSelectedOptionIndex(index)}
                      onToggleCorrect={() => toggleOptionCorrect(index)}
                      allowMultipleCorrect={initializedConfig.allowMultipleCorrect}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Tips */}
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 font-medium mb-1">💡 Tips:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Click</strong> option to edit details</li>
              <li>• <strong>Check/uncheck</strong> to mark correct answer(s)</li>
              <li>• <strong>Drag</strong> to reorder options</li>
              <li>• Press <strong>Delete</strong> to remove selected option</li>
              <li>• {isQuizQuestion ? 'Points' : 'XP'} auto-distributed equally among correct options</li>
            </ul>
          </div>

          {/* Warnings */}
          {correctCount === 0 && initializedConfig.options.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700 font-medium">❗ No correct answer selected</p>
              <p className="text-xs text-red-600 mt-1">Mark at least one option as correct</p>
            </div>
          )}
          
          {initializedConfig.options.length === 1 && (
            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-700 font-medium">⚠ Add more options</p>
              <p className="text-xs text-amber-600 mt-1">Multiple choice questions need at least 2 options</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Multiple Correct Toggle */}
        <div className="p-3 bg-gray-50 rounded-md border">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={initializedConfig.allowMultipleCorrect}
              onChange={handleAllowMultipleCorrectChange}
              className="mr-3 h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <div className="flex-1">
              <span className="font-medium text-gray-800 text-sm">
                Allow multiple correct answers
              </span>
              <p className="text-xs text-gray-600 mt-0.5">
                {initializedConfig.allowMultipleCorrect
                  ? "Users must select ALL correct answers (checkbox mode)"
                  : "Users select only ONE answer (radio button mode)"}
              </p>
            </div>
          </label>
        </div>

        {/* Reward Input */}
        <div className="p-3 bg-gray-50 rounded-md border">
          <label className="block text-sm font-medium mb-1">
            Total {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={currentReward}
            onChange={handleRewardChange}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Auto-distributed equally among {correctCount || '?'} correct option{correctCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Game Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Game Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Options</p>
            <p className="font-semibold text-lg">{initializedConfig.options.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Correct Answers</p>
            <p className={`font-semibold text-lg ${correctCount === 0 ? 'text-red-600' : 'text-green-600'}`}>
              {correctCount}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Answer Mode</p>
            <p className="font-semibold text-sm">
              {initializedConfig.allowMultipleCorrect ? 'Multiple' : 'Single'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">Reward</p>
            <p className="font-semibold text-lg">
              {currentReward} {isQuizQuestion ? 'pts' : 'XP'}
            </p>
          </div>
        </div>

        {/* Validation Warnings */}
        {(initializedConfig.options.length < 2 || correctCount === 0 || !initializedConfig.instruction.trim()) && (
          <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            <strong>⚠ Incomplete:</strong>
            {!initializedConfig.instruction.trim() && ' Add instruction.'}
            {initializedConfig.options.length < 2 && ' Need at least 2 options.'}
            {correctCount === 0 && ' Mark correct answer(s).'}
          </div>
        )}
      </div>

      {/* Edit Modal (appears when clicking an option) */}
      {selectedOptionIndex !== null && editingOptionIndex === null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={() => setSelectedOptionIndex(null)}>
          <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <span className="w-7 h-7 bg-gray-800 text-white text-sm rounded-full flex items-center justify-center font-bold">
                  {String.fromCharCode(65 + selectedOptionIndex)}
                </span>
                Edit Option {selectedOptionIndex + 1}
              </h3>
              <button
                onClick={() => setSelectedOptionIndex(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Text Editor */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Option Text <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={initializedConfig.options[selectedOptionIndex].text}
                  onChange={(e) => updateOption(selectedOptionIndex, { text: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="e.g., 'Wear gloves and goggles'"
                  autoFocus
                />
              </div>

              {/* Image Section */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Option Image (Optional)
                </label>
                {initializedConfig.options[selectedOptionIndex].imageUrl ? (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <img
                      src={initializedConfig.options[selectedOptionIndex].imageUrl}
                      alt={`Option ${String.fromCharCode(65 + selectedOptionIndex)}`}
                      className="w-full h-48 object-contain rounded bg-white mb-3"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingOptionIndex(selectedOptionIndex);
                          setShowImageSelector(true);
                        }}
                        className="flex-1 px-3 py-2 border rounded-md text-gray-700 hover:bg-white text-sm"
                      >
                        Change Image
                      </button>
                      <button
                        onClick={() => updateOption(selectedOptionIndex, { imageUrl: undefined })}
                        className="px-3 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingOptionIndex(selectedOptionIndex);
                      setShowImageSelector(true);
                    }}
                    className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-600">Click to add image</p>
                    <p className="text-xs text-gray-500 mt-1">Great for visual options (e.g., safety signs)</p>
                  </button>
                )}
              </div>

              {/* Correct Toggle */}
              <div className="border-t pt-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={initializedConfig.options[selectedOptionIndex].correct}
                    onChange={() => toggleOptionCorrect(selectedOptionIndex)}
                    className="mr-3 h-5 w-5 text-green-600 rounded focus:ring-green-500"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-800">
                      Mark as correct answer
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {initializedConfig.allowMultipleCorrect
                        ? "Users must select ALL correct options. Each correct option gets equal share of total reward."
                        : "Only one correct answer allowed in single-answer mode."}
                    </p>
                  </div>
                </label>
                {initializedConfig.options[selectedOptionIndex].correct && correctCount > 0 && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
                    💰 This option will award <strong>{Math.round(currentReward / correctCount)} {isQuizQuestion ? 'pts' : 'XP'}</strong> (Total: {currentReward} ÷ {correctCount} correct)
                  </div>
                )}
              </div>

              {/* Position Info */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-600">
                  <strong>Display order:</strong> Position {selectedOptionIndex + 1} of {initializedConfig.options.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Drag options in the list to change their display order
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex justify-between">
              <button
                onClick={() => {
                  deleteOption(selectedOptionIndex);
                  setSelectedOptionIndex(null);
                }}
                className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
              >
                Delete Option
              </button>
              <button
                onClick={() => setSelectedOptionIndex(null)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Modal (for detailed editing with Ctrl+Enter) */}
      {editingOptionIndex !== null && !showImageSelector && (
        <OptionEditModal
          option={initializedConfig.options[editingOptionIndex]}
          index={editingOptionIndex}
          onUpdate={(updates) => updateOption(editingOptionIndex, updates)}
          onDelete={() => {
            deleteOption(editingOptionIndex);
            setEditingOptionIndex(null);
          }}
          onClose={() => setEditingOptionIndex(null)}
          onSelectImage={handleSelectOptionImage}
          onRemoveImage={handleRemoveOptionImage}
        />
      )}

      {/* Image Selector for Option */}
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={handleOptionImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}

      {/* Image Selector for Instruction */}
      {showInstructionImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={handleInstructionImageSelect}
          onClose={() => setShowInstructionImageSelector(false)}
        />
      )}
    </div>
  );
}