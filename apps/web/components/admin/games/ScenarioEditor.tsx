'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
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
import ImageSelector from '../ImageSelector';

// ============================================================================
// TYPES — now includes per-option rewards (aligned with DragDropItem/MatchingItem)
// ============================================================================

type Option = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  imageUrl?: string;
  // ✅ Per-option rewards — critical for partial scoring
  xp?: number;
  points?: number;
};

type ScenarioConfig = {
  scenario: string;
  question: string;
  imageUrl?: string;
  options: Option[];
  allowMultipleCorrect?: boolean;
  xp?: number;         // total
  points?: number;     // total
  totalXp?: number;    // auto-calculated
  totalPoints?: number; // auto-calculated
};

type ScenarioEditorProps = {
  config: any;
  onChange: (newConfig: ScenarioConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// OPTION EDIT MODAL (with per-option reward display)
// ============================================================================

function OptionEditModal({
  option,
  index,
  onUpdate,
  onDelete,
  onClose,
  totalOptions,
  isQuizQuestion
}: {
  option: Option;
  index: number;
  onUpdate: (updates: Partial<Option>) => void;
  onDelete: () => void;
  onClose: () => void;
  totalOptions: number;
  isQuizQuestion: boolean;
}) {
  const [text, setText] = useState(option.text);
  const [feedback, setFeedback] = useState(option.feedback);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    if (!text.trim()) {
      toast.error('Option text cannot be empty');
      return;
    }
    onUpdate({ 
      text: text.trim(),
      feedback: feedback.trim()
    });
    onClose();
    toast.success('Option updated');
  };

  const handleImageSelect = (url: string) => {
    onUpdate({ imageUrl: url });
    setShowImageSelector(false);
    setImageError(false);
    toast.success('Image added to option');
  };

  const handleRemoveImage = () => {
    onUpdate({ imageUrl: '' });
    setImageError(false);
    toast.success('Image removed from option');
  };

  const hasImage = option.imageUrl && option.imageUrl.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Option {index + 1}</h3>
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
            <label className="block text-sm font-medium mb-1">
              Option Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="e.g., Stop the machine and report to supervisor"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              Write as a concrete action (not just "Yes" or "No")
            </p>
          </div>

          {/* Option Image */}
          <div>
            <label className="block text-sm font-medium mb-2 text-center">
              Option Image (Optional)
            </label>
            <div className="flex justify-center">
              {hasImage && !imageError ? (
                <div className="relative inline-block">
                  <img
                    src={option.imageUrl}
                    alt={`Option ${index + 1}`}
                    className="w-full max-w-sm h-32 object-cover rounded-lg border"
                    onError={() => setImageError(true)}
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowImageSelector(true)}
                  className="w-full max-w-sm border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-xs text-gray-600 mt-1">Click to add image</p>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Add a visual representation of this option
            </p>
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Explain why this choice is safe/unsafe. Be specific and empathetic."
            />
            <p className="text-xs text-gray-500 mt-1">
              Appears after selection to reinforce learning
            </p>
          </div>

          {/* Correct Answer Indicator */}
          <div className={`p-3 rounded-md ${option.correct ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex items-center gap-2">
              {option.correct ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-green-700">✓ Correct Answer</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-600">Incorrect Answer</span>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Toggle correct/incorrect by clicking the checkmark in the main list
            </p>
          </div>

          {/* ✅ Per-option reward display (read-only) */}
          {option.correct && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-medium text-blue-700">
                  Reward for this option: 
                  <span className="ml-1 font-bold">
                    {isQuizQuestion 
                      ? (option.points || 0) + ' pts' 
                      : (option.xp || 0) + ' XP'}
                  </span>
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Automatically calculated from total reward
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onDelete}
            disabled={totalOptions <= 2}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            title={totalOptions <= 2 ? 'Minimum 2 options required' : 'Delete this option'}
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

        {/* Image Selector Modal */}
        {showImageSelector && (
          <ImageSelector
            onSelect={handleImageSelect}
            onClose={() => setShowImageSelector(false)}
            accept="image/*"
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// SORTABLE OPTION ITEM (with per-option reward badge)
// ============================================================================

function SortableOptionItem({
  option,
  index,
  isSelected,
  onSelect,
  onDelete,
  onToggleCorrect,
  isCorrect,
  isQuizQuestion
}: {
  option: Option;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleCorrect: () => void;
  isCorrect: boolean;
  isQuizQuestion: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: option.id });
  const [imageError, setImageError] = useState(false);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasImage = option.imageUrl && option.imageUrl.trim() !== '' && !imageError;

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={`group relative border-2 rounded-lg p-4 cursor-grab active:cursor-grabbing transition-all ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-500 shadow-md' 
          : isCorrect 
            ? 'bg-green-50 border-green-300 hover:bg-green-100 hover:border-green-400' 
            : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-blue-300'
      } ${isDragging ? 'scale-105 shadow-lg' : ''}`}
    >
      {/* Option content */}
      <div className="flex items-start gap-3 pr-8">
        {/* Correct/Incorrect toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCorrect();
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
            isCorrect 
              ? 'bg-green-600 text-white hover:bg-green-700' 
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
          title={isCorrect ? 'Mark as incorrect' : 'Mark as correct'}
        >
          {isCorrect ? '✓' : '×'}
        </button>

        {/* Radio (visual only) */}
        <input
          type="radio"
          checked={isCorrect}
          onChange={() => {}}
          className="mt-1 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCorrect();
          }}
        />

        {/* Option image thumbnail (if exists) */}
        {hasImage && (
          <img
            src={option.imageUrl}
            alt={`Option ${index + 1}`}
            className="w-16 h-16 rounded border object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        )}

        {/* Text and feedback */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm break-words">
            {option.text || <span className="text-gray-400 italic">Empty option</span>}
          </p>
          {option.feedback && (
            <div className="mt-2 text-xs bg-gray-100 rounded p-2 text-gray-700">
              <span className="font-medium text-gray-800">Feedback:</span> {option.feedback}
            </div>
          )}
          {hasImage && (
            <p className="text-xs text-blue-600 mt-1">Has image</p>
          )}
          {/* ✅ Per-option reward badge */}
          {isCorrect && (
            <div className="mt-1 flex items-center gap-1">
              <span className="text-xs font-medium bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                {isQuizQuestion 
                  ? `${option.points || 0} pts` 
                  : `${option.xp || 0} XP`}
              </span>
              <span className="text-xs text-gray-500">✓</span>
            </div>
          )}
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-red-200 transition-opacity shadow-md"
        aria-label="Delete option"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScenarioEditor({
  config,
  onChange,
  isQuizQuestion
}: ScenarioEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const initializedConfig: ScenarioConfig = {
    scenario: config.scenario || '',
    question: config.question || '',
    imageUrl: config.imageUrl || '',
    options: config.options || [],
    allowMultipleCorrect: config.allowMultipleCorrect ?? false,
    ...(isQuizQuestion 
      ? { points: config.points ?? 10, totalPoints: config.totalPoints ?? 10 }
      : { xp: config.xp ?? 10, totalXp: config.totalXp ?? 10 }
    )
  };

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageError, setImageError] = useState(false);
  const lastValidationErrorRef = useRef<number>(0);

  // ✅ AUTO-CALCULATE PER-OPTION REWARDS (FAIR SPLITTING)
  useEffect(() => {
    const correctOptions = initializedConfig.options.filter(opt => opt.correct);
    const correctCount = correctOptions.length;
    const baseReward = isQuizQuestion 
      ? (initializedConfig.points || 0) 
      : (initializedConfig.xp || 0);

    // Calculate per-option reward (floor + distribute remainder)
    let perOptionBase = 0;
    let remainder = 0;
    if (correctCount > 0) {
      perOptionBase = Math.floor(baseReward / correctCount);
      remainder = baseReward % correctCount;
    }

    // Update options with per-option rewards
    const newOptions = [...initializedConfig.options].map((opt, i) => {
      if (!opt.correct) {
        return { 
          ...opt, 
          ...(isQuizQuestion ? { points: 0, xp: undefined } : { xp: 0, points: undefined }) 
        };
      }

      // Distribute remainder to first N correct options
      const extra = i < remainder ? 1 : 0;
      const rewardValue = perOptionBase + extra;

      return {
        ...opt,
        ...(isQuizQuestion 
          ? { points: rewardValue, xp: undefined } 
          : { xp: rewardValue, points: undefined }
        )
      };
    });

    // Calculate total (sum of all option rewards)
    const totalReward = newOptions.reduce((sum, opt) => 
      sum + (isQuizQuestion ? (opt.points || 0) : (opt.xp || 0))
    , 0);

    // Update only if changed
    const optionsChanged = 
      JSON.stringify(initializedConfig.options.map(o => ({
        id: o.id,
        correct: o.correct,
        points: o.points,
        xp: o.xp
      }))) !== 
      JSON.stringify(newOptions.map(o => ({
        id: o.id,
        correct: o.correct,
        points: o.points,
        xp: o.xp
      })));

    const totalChanged = 
      (isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp) !== totalReward;

    if (optionsChanged || totalChanged) {
      onChange({
        ...initializedConfig,
        options: newOptions,
        ...(isQuizQuestion 
          ? { totalPoints: totalReward } 
          : { totalXp: totalReward }
        )
      });
    }
  }, [initializedConfig.options, initializedConfig.xp, initializedConfig.points, isQuizQuestion]);

  // Validation warnings
  useEffect(() => {
    const correctCount = initializedConfig.options.filter(opt => opt.correct).length;
    const now = Date.now();

    if (now - lastValidationErrorRef.current > 3000) {
      if (correctCount === 0 && initializedConfig.options.length > 0) {
        toast.error('⚠️ Please mark at least one option as correct', { duration: 3000 });
        lastValidationErrorRef.current = now;
      } else if (!initializedConfig.allowMultipleCorrect && correctCount > 1) {
        toast.error('⚠️ Only one option can be correct (toggle "Allow Multiple Correct" to change)', { duration: 3000 });
        lastValidationErrorRef.current = now;
      }
    }
  }, [initializedConfig.options]);

  const handleScenarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...initializedConfig, scenario: e.target.value });
  };

  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({ ...initializedConfig, question: e.target.value });
  };

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0); // Allow 0 for "info-only"
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion 
        ? { points: value } 
        : { xp: value }
      )
    });
  };

  const handleImageSelect = (url: string) => {
    onChange({ ...initializedConfig, imageUrl: url });
    setShowImageSelector(false);
    setImageError(false);
    toast.success('Image added to scenario');
  };

  const handleRemoveImage = () => {
    onChange({ ...initializedConfig, imageUrl: '' });
    setImageError(false);
    toast.success('Image removed from scenario');
  };

  const addOption = () => {
    if (!newOptionText.trim()) {
      toast.error('Option text cannot be empty');
      return;
    }

    const newOption: Option = {
      id: crypto.randomUUID ? crypto.randomUUID() : `opt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      text: newOptionText.trim(),
      correct: initializedConfig.options.length === 0,
      feedback: '',
      ...(isQuizQuestion ? { points: 0 } : { xp: 0 })
    };

    const newOptions = [...initializedConfig.options, newOption];
    onChange({ ...initializedConfig, options: newOptions });
    
    setNewOptionText('');
    setIsAddingOption(false);
    setSelectedOptionIndex(newOptions.length - 1);
    toast.success('Option added');
  };

  const updateOption = (index: number, updates: Partial<Option>) => {
    if (index < 0 || index >= initializedConfig.options.length) return;

    let newOptions = [...initializedConfig.options];
    newOptions[index] = { ...newOptions[index], ...updates };

    if (updates.correct !== undefined) {
      if (updates.correct === true && !initializedConfig.allowMultipleCorrect) {
        newOptions = newOptions.map((opt, i) => 
          i === index ? { ...opt, correct: true } : { ...opt, correct: false }
        );
      }
    }

    onChange({ ...initializedConfig, options: newOptions });
  };

  const deleteOption = (index: number) => {
    if (index < 0 || index >= initializedConfig.options.length) return;
    
    if (initializedConfig.options.length <= 2) {
      toast.error('Minimum 2 options required');
      return;
    }

    const newOptions = [...initializedConfig.options];
    const deletedOption = newOptions.splice(index, 1)[0];

    if (deletedOption.correct && newOptions.length > 0 && !newOptions.some(opt => opt.correct)) {
      newOptions[0] = { ...newOptions[0], correct: true };
    }

    onChange({ ...initializedConfig, options: newOptions });
    setSelectedOptionIndex(null);
    setEditingOptionIndex(null);
    toast.success('Option deleted');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = initializedConfig.options.findIndex(opt => opt.id === active.id);
    const newIndex = initializedConfig.options.findIndex(opt => opt.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newOptions = [...initializedConfig.options];
    const [movedItem] = newOptions.splice(oldIndex, 1);
    newOptions.splice(newIndex, 0, movedItem);

    onChange({ ...initializedConfig, options: newOptions });
    
    if (selectedOptionIndex === oldIndex) {
      setSelectedOptionIndex(newIndex);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedOptionIndex === null || editingOptionIndex !== null) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteOption(selectedOptionIndex);
        return;
      }

      if (e.key === 'ArrowUp' && selectedOptionIndex > 0) {
        e.preventDefault();
        setSelectedOptionIndex(selectedOptionIndex - 1);
      } else if (e.key === 'ArrowDown' && selectedOptionIndex < initializedConfig.options.length - 1) {
        e.preventDefault();
        setSelectedOptionIndex(selectedOptionIndex + 1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        setEditingOptionIndex(selectedOptionIndex);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOptionIndex, editingOptionIndex, initializedConfig.options.length]);

  const rewardValue = isQuizQuestion ? initializedConfig.points : initializedConfig.xp;
  const totalReward = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
  const correctCount = initializedConfig.options.filter(opt => opt.correct).length;
  const hasImage = initializedConfig.imageUrl && initializedConfig.imageUrl.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Scenario Description */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Scenario Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.scenario}
          onChange={handleScenarioChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={4}
          placeholder="Describe a realistic safety situation (e.g., machine jam, chemical spill, unsecured load)..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Set the context for the learner - what's happening?
        </p>
      </div>

      {/* Scenario Image */}
      <div>
        <label className="block text-sm font-medium mb-2 text-center">
          Scenario Image (Optional)
        </label>
        <div className="flex justify-center">
          {hasImage && !imageError ? (
            <div className="relative inline-block">
              <img
                src={initializedConfig.imageUrl}
                alt="Scenario"
                className="w-full max-w-md h-48 object-cover rounded-lg border"
                onError={() => setImageError(true)}
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 shadow-lg"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowImageSelector(true)}
              className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-gray-600 mt-2">Click to add image</p>
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          Add a visual to help learners understand the scenario
        </p>
      </div>

      {/* Question */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Question / Decision <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.question}
          onChange={handleQuestionChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="What should the worker do next?"
        />
        <p className="text-xs text-gray-500 mt-1">
          Ask the decision or action the learner should take
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium text-gray-800">
              Answer Options ({initializedConfig.options.length})
            </h3>
            <button
              onClick={() => setIsAddingOption(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 shadow-sm flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Option
            </button>
          </div>

          {isAddingOption && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOptionText}
                  onChange={(e) => setNewOptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addOption();
                    } else if (e.key === 'Escape') {
                      setIsAddingOption(false);
                      setNewOptionText('');
                    }
                  }}
                  placeholder="e.g., Stop the machine and report to supervisor"
                  className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={addOption}
                  disabled={!newOptionText.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setIsAddingOption(false);
                    setNewOptionText('');
                  }}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                💡 Write options as concrete actions (not just "Yes/No")
              </p>
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={initializedConfig.options.map(opt => opt.id)}
              strategy={verticalListSortingStrategy}
            >
              {initializedConfig.options.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-gray-500 mb-2">No options yet</p>
                  <p className="text-sm text-gray-600">
                    Add 2–4 realistic choices (one correct, others plausible but unsafe)
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {initializedConfig.options.map((option, index) => (
                    <SortableOptionItem
                      key={option.id}
                      option={option}
                      index={index}
                      isSelected={selectedOptionIndex === index}
                      onSelect={() => {
                        setSelectedOptionIndex(index);
                        setEditingOptionIndex(index);
                      }}
                      onDelete={() => deleteOption(index)}
                      onToggleCorrect={() => updateOption(index, { correct: !option.correct })}
                      isCorrect={option.correct}
                      isQuizQuestion={isQuizQuestion}
                    />
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>

          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-sm font-medium text-gray-800 mb-1">💡 Best Practices</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Click</strong> an option to edit text, image, and feedback</li>
              <li>• <strong>Click the checkmark</strong> (✓/×) to mark correct/incorrect</li>
              <li>• <strong>Drag anywhere</strong> on the card to reorder options</li>
              <li>• <strong>Per-correct-option rewards</strong> shown in blue badge</li>
              <li>• Add <strong>images to options</strong> for visual choices</li>
              <li>• Use <strong>multiple correct</strong> for scenarios with several safe actions</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={initializedConfig.allowMultipleCorrect}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  if (!newValue) {
                    const correctIndices = initializedConfig.options
                      .map((opt, i) => opt.correct ? i : -1)
                      .filter(i => i !== -1);
                    if (correctIndices.length > 1) {
                      const newOptions = initializedConfig.options.map((opt, i) => ({
                        ...opt,
                        correct: i === correctIndices[0]
                      }));
                      onChange({ 
                        ...initializedConfig, 
                        options: newOptions,
                        allowMultipleCorrect: newValue 
                      });
                      toast.success('Kept first correct option, unmarked others');
                      return;
                    }
                  }
                  onChange({ 
                    ...initializedConfig, 
                    allowMultipleCorrect: newValue 
                  });
                }}
                className="w-5 h-5 rounded"
              />
              <div className="flex-1">
                <span className="font-medium text-purple-900">Allow Multiple Correct Answers</span>
                <p className="text-xs text-purple-700 mt-1">
                  {initializedConfig.allowMultipleCorrect 
                    ? 'Learners get partial credit for each correct option selected'
                    : 'Only one option can be marked as correct (single select)'}
                </p>
              </div>
            </label>
          </div>

          {/* ✅ Enhanced Reward Section with per-option breakdown */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-blue-900">
                Total Reward for All Correct Options
              </label>
              <span className="text-lg font-bold text-blue-700">
                {rewardValue || 0} {isQuizQuestion ? 'pts' : 'XP'}
              </span>
            </div>
            <input
              type="number"
              min="0"
              max="100"
              value={rewardValue}
              onChange={handleRewardChange}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 mb-2"
            />
            <div className="text-xs text-blue-700">
              {correctCount > 0 ? (
                <p className="mb-1">
                  <span className="font-medium">
                    {correctCount} correct option{correctCount !== 1 ? 's' : ''} get:
                  </span>
                  <span className="ml-2">
                    {Array.from({ length: correctCount }, (_, i) => {
                      // ✅ Safe fallback to 0 if undefined
                      const total = (isQuizQuestion ? initializedConfig.points : initializedConfig.xp) ?? 0;
                      const base = Math.floor(total / correctCount);
                      const extra = i < (total % correctCount) ? 1 : 0;
                      return `${base + extra}`;
                    }).join(', ')} {isQuizQuestion ? 'pts' : 'XP'}
                  </span>
                  {(() => {
                    const total = (isQuizQuestion ? initializedConfig.points : initializedConfig.xp) ?? 0;
                    return total % correctCount !== 0 ? (
                      <span className="block mt-1">
                        (First {total % correctCount} get +1)
                      </span>
                    ) : null;
                  })()}
                </p>
              ) : (
                <p className="mb-1">No correct options — rewards will be 0</p>
              )}
              <p>
                {initializedConfig.allowMultipleCorrect
                  ? '✅ Partial credit: reward = sum of selected correct options'
                  : '🎯 Full reward only if the single correct option is selected'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <p className="text-xs font-medium text-gray-700 mb-1">⌨️ Keyboard Shortcuts</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <kbd className="px-1 py-0.5 bg-white border rounded text-xs">↑</kbd> <kbd className="px-1 py-0.5 bg-white border rounded text-xs">↓</kbd> Navigate options</li>
              <li>• <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Enter</kbd> Edit selected option</li>
              <li>• <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Delete</kbd> Remove selected option</li>
            </ul>
          </div>
        </div>
      </div>

      {showImageSelector && (
        <ImageSelector
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
          accept="image/*"
        />
      )}

      {editingOptionIndex !== null && (
        <OptionEditModal
          option={initializedConfig.options[editingOptionIndex]}
          index={editingOptionIndex}
          onUpdate={(updates) => updateOption(editingOptionIndex, updates)}
          onDelete={() => deleteOption(editingOptionIndex)}
          onClose={() => setEditingOptionIndex(null)}
          totalOptions={initializedConfig.options.length}
          isQuizQuestion={isQuizQuestion}
        />
      )}
    </div>
  );
}