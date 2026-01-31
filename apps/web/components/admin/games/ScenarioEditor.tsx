// apps/web/components/admin/games/ScenarioEditor.tsx
'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
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
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';
import GameRichTextEditor from './ui/GameRichTextEditor';

// ============================================================================
// HELPER FUNCTION — Character counting for rich text
// ============================================================================

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim().length;
};

// ============================================================================
// TYPES — Updated: feedback upgraded to rich text, added generalFeedback
// ============================================================================

type Option = {
  id: string;
  text: string;
  correct: boolean;
  feedback?: string;  // ✅ KEPT as "feedback" for backward compatibility (now rich text, 300 char limit)
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type ScenarioConfig = {
  scenario: string;
  question: string;
  imageUrl?: string;
  options: Option[];
  allowMultipleCorrect: boolean;
  xp?: number;
  points?: number;
  totalXp?: number;
  totalPoints?: number;
  generalFeedback?: string;  // ✅ NEW: Game-level feedback (500 char limit)
};

type ScenarioEditorProps = {
  config: any;
  onChange: (newConfig: ScenarioConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// SORTABLE OPTION ITEM — MC-style (letter badges, checkbox/radio, image badge)
// ============================================================================

function SortableOptionItem({
  option,
  index,
  isSelected,
  onSelect,
  onToggleCorrect,
  allowMultipleCorrect,
  isQuizQuestion
}: {
  option: Option;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onToggleCorrect: () => void;
  allowMultipleCorrect: boolean;
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
      className={`border-2 rounded-lg p-3 cursor-grab active:cursor-grabbing relative group transition-all
        ${option.correct
          ? 'bg-success-light border-success ring-1 ring-success'
          : 'bg-white border-border hover:bg-surface'}
        ${isSelected
          ? 'ring-2 ring-primary-light border-primary shadow-md'
          : 'hover:border-primary-light'}
        ${isDragging ? 'scale-105 shadow-lg z-50' : ''}
      `}
    >
      {/* Letter Badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-text-primary text-white text-xs rounded-full flex items-center justify-center font-bold z-10">
        {String.fromCharCode(65 + index)}
        {hasImage && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></span>
        )}
      </div>
      <div className="flex items-start gap-3">
        {/* Radio/Checkbox - STOPS PROPAGATION — ✅ VERTICALLY CENTERED */}
        <input
          type={allowMultipleCorrect ? 'checkbox' : 'radio'}
          checked={option.correct}
          onChange={(e) => {
            e.stopPropagation();
            onToggleCorrect();
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent opening modal
          }}
          className="self-center mt-0 flex-shrink-0 cursor-pointer"
        />
        {/* Option Image (thumbnail) */}
        {hasImage && (
          <img
            src={option.imageUrl}
            alt={`Option ${String.fromCharCode(65 + index)}`}
            className="w-16 h-16 rounded border object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        )}
        {/* Text + Feedback - OPENS MODAL ON CLICK */}
        <div
          className="flex-1 min-w-0 break-words text-sm pr-6 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {option.text || <span className="text-text-muted italic">Empty option</span>}
          {option.feedback && (
            <div className="mt-2 text-xs bg-primary-surface rounded p-2 text-text-secondary border border-primary-light">
              <span className="font-medium text-primary-dark">Feedback:</span> {option.feedback}
            </div>
          )}
        </div>
      </div>
      {/* Drag Indicator */}
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <svg className="w-4 h-4 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// INLINE OPTION EDIT PANEL (like MC editor — no modal by default)
// ============================================================================

function InlineOptionEditPanel({
  option,
  index,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage,
  allowMultipleCorrect,
  correctCount,
  isQuizQuestion,
  feedback,
  onFeedbackChange
}: {
  option: Option;
  index: number;
  onUpdate: (updates: Partial<Option>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
  allowMultipleCorrect: boolean;
  correctCount: number;
  isQuizQuestion: boolean;
  feedback: string;
  onFeedbackChange: (html: string) => void;
}) {
  const [text, setText] = useState(option.text);
  const [localCorrect, setLocalCorrect] = useState(option.correct);
  
  // Auto-save text on blur or Ctrl+Enter
  const handleTextBlur = () => {
    onUpdate({ text: text.trim() });
  };
  
  // Ctrl+Enter → save & close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        onUpdate({ text: text.trim() });
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, onClose, onUpdate]);
  
  const handleCorrectToggle = () => {
    const newCorrect = !localCorrect;
    setLocalCorrect(newCorrect);
    onUpdate({ correct: newCorrect });
  };
  
  const reward = isQuizQuestion
    ? (option.points || 0)
    : (option.xp || 0);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-heading-4 text-text-primary flex items-center gap-2">
            <span className="w-7 h-7 bg-text-primary text-white text-sm rounded-full flex items-center justify-center font-bold">
              {String.fromCharCode(65 + index)}
            </span>
            Edit Option {index + 1}
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Option Text */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Option Text <span className="text-danger">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onBlur={handleTextBlur}
              className="w-full"
              rows={3}
              placeholder="e.g., Stop the machine and report to supervisor"
              autoFocus
            />
            <p className="text-xs text-text-muted mt-1.5">
              Press Ctrl+Enter to save, Esc to cancel
            </p>
          </div>
          
          {/* Feedback — UPGRADED to rich text editor */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-sm font-medium text-text-secondary">Feedback (Optional)</label>
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help"
                title="Help learners understand why this option is correct/incorrect. Shown after submission."
              >
                ?
              </span>
            </div>
            <GameRichTextEditor
              key={`option-feedback-${index}`}
              content={feedback}
              onChange={(html) => onFeedbackChange(html)}
              height={120}
              placeholder="Explain why this choice is safe/unsafe..."
            />
            <div className="flex justify-end mt-1">
              <span className={
                getPlainTextLength(feedback) > 300
                  ? 'text-danger font-medium text-xs'
                  : getPlainTextLength(feedback) > 240
                  ? 'text-warning-dark text-xs'
                  : 'text-text-muted text-xs'
              }>
                {getPlainTextLength(feedback)}/300 characters
              </span>
            </div>
          </div>
          
          {/* Option Image */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Option Image (Optional)
            </label>
            {option.imageUrl ? (
              <div className="space-y-2">
                <img
                  src={option.imageUrl}
                  alt={`Option ${String.fromCharCode(65 + index)}`}
                  className="w-full h-48 object-contain rounded border border-border bg-white"
                  onError={() => {}}
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectImage();
                    }}
                    className="flex-1 btn btn-secondary text-sm"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveImage();
                    }}
                    className="btn btn-danger text-sm px-3 py-2"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectImage();
                }}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-primary-surface hover:border-primary-light transition-colors text-center"
              >
                <svg className="w-12 h-12 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-text-secondary">Click to add image</p>
                <p className="text-xs text-text-muted mt-1">Great for visual options (e.g., safety signs)</p>
              </button>
            )}
          </div>
          
          {/* Correct Toggle */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localCorrect}
                onChange={handleCorrectToggle}
                className="mr-3 h-5 w-5 text-success rounded focus:ring-success"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-text-primary">
                  Mark as correct answer
                </span>
                <p className="text-xs text-text-secondary mt-0.5">
                  {allowMultipleCorrect
                    ? "Users must select ALL correct options. Each gets equal reward."
                    : "Only one correct answer allowed in single-answer mode."}
                </p>
              </div>
            </label>
            {localCorrect && correctCount > 0 && (
              <div className="mt-2 p-2 bg-success-light border border-success rounded text-xs text-success-dark">
                🎯 This option awards <strong>{reward} {isQuizQuestion ? 'pts' : 'XP'}</strong>
              </div>
            )}
          </div>
          
          {/* Position Info */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-text-secondary">
              <strong>Display order:</strong> Position {index + 1}
            </p>
            <p className="text-xs text-text-muted mt-1">
              Drag options in the list to change their display order
            </p>
          </div>
        </div>
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="btn btn-danger px-4 py-2"
          >
            Delete Option
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary px-6 py-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT — aligned with MultipleChoiceEditor layout
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
  
  // ✅ Stable initializedConfig — avoid referential churn
  const initializedConfig = useMemo((): ScenarioConfig => ({
    scenario: config.scenario || '',
    question: config.question || '',
    imageUrl: config.imageUrl || '',
    options: config.options || [],
    allowMultipleCorrect: config.allowMultipleCorrect ?? false,
    generalFeedback: config.generalFeedback || '',  // ✅ NEW
    ...(isQuizQuestion
      ? {
        points: config.points ?? 10,
        totalPoints: config.totalPoints ?? (config.points ?? 10)
      }
      : {
        xp: config.xp ?? 10,
        totalXp: config.totalXp ?? (config.xp ?? 10)
      }
    )
  }), [config, isQuizQuestion]);
  
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Local state for smoother typing
  const [localScenario, setLocalScenario] = useState(initializedConfig.scenario);
  const [localQuestion, setLocalQuestion] = useState(initializedConfig.question);
  const [editingFeedback, setEditingFeedback] = useState<string>('');  // ✅ Kept as "feedback"
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState<string>('');  // ✅ NEW
  
  // Sync local state when config changes externally
  useEffect(() => {
    setLocalScenario(config.scenario || '');
    setLocalQuestion(config.question || '');
  }, [config.scenario, config.question]);
  
  // ✅ Sync feedback when option selection changes (KEPT as "feedback")
  useEffect(() => {
    if (selectedOptionIndex !== null && initializedConfig.options[selectedOptionIndex]) {
      setEditingFeedback(initializedConfig.options[selectedOptionIndex].feedback || '');
    }
  }, [selectedOptionIndex, initializedConfig.options]);
  
  // ✅ Sync general feedback when config changes
  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);
  
  // ✅ AUTO-CALCULATE — ONLY if config is loaded (non-empty) OR user has interacted
  useEffect(() => {
    // Skip for truly new games: empty or minimal config
    const isEmptyNewGame = (
      initializedConfig.options.length === 0 &&
      Object.keys(config).length <= 2 // e.g., just {id, type} or {}
    );
    if (isEmptyNewGame) {
      return;
    }
    const correctOptions = initializedConfig.options.filter(opt => opt.correct);
    const correctCount = correctOptions.length;
    const baseReward = isQuizQuestion
      ? (initializedConfig.points || 0)
      : (initializedConfig.xp || 0);
    let perOptionBase = 0;
    let remainder = 0;
    if (correctCount > 0) {
      perOptionBase = Math.floor(baseReward / correctCount);
      remainder = baseReward % correctCount;
    }
    const expectedOptions = [...initializedConfig.options].map((opt, i) => {
      const expectedReward = opt.correct ? perOptionBase + (i < remainder ? 1 : 0) : 0;
      const currentReward = isQuizQuestion ? (opt.points || 0) : (opt.xp || 0);
      if (currentReward !== expectedReward) {
        return {
          ...opt,
          ...(isQuizQuestion
            ? { points: expectedReward, xp: undefined }
            : { xp: expectedReward, points: undefined }
          )
        };
      }
      return opt;
    });
    const expectedTotalReward = expectedOptions.reduce((sum, opt) =>
      sum + (isQuizQuestion ? (opt.points || 0) : (opt.xp || 0)), 0
    );
    const currentTotal = isQuizQuestion
      ? (initializedConfig.totalPoints || 0)
      : (initializedConfig.totalXp || 0);
    const optionsChanged = expectedOptions.some((opt, i) => {
      const orig = initializedConfig.options[i];
      return opt.xp !== orig.xp || opt.points !== orig.points;
    });
    const totalsDontMatch = expectedTotalReward !== currentTotal;
    if (optionsChanged || totalsDontMatch) {
      onChange({
        ...initializedConfig,
        options: expectedOptions,
        ...(isQuizQuestion
          ? { totalPoints: expectedTotalReward }
          : { totalXp: expectedTotalReward }
        )
      });
    }
  }, [initializedConfig.options, initializedConfig.xp, initializedConfig.points, config, isQuizQuestion]);
  
  // ================================
  // HANDLERS
  // ================================
  
  const handleScenarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalScenario(e.target.value);
  };
  
  const handleScenarioBlur = () => {
    if (localScenario !== initializedConfig.scenario) {
      onChange({ ...initializedConfig, scenario: localScenario });
    }
  };
  
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalQuestion(e.target.value);
  };
  
  const handleQuestionBlur = () => {
    if (localQuestion !== initializedConfig.question) {
      onChange({ ...initializedConfig, question: localQuestion });
    }
  };
  
  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion
        ? { points: value }
        : { xp: value }
      )
    });
  };
  
  const handleAllowMultipleCorrectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowMultiple = e.target.checked;
    let newOptions = [...initializedConfig.options];
    if (!allowMultiple && newOptions.filter(opt => opt.correct).length > 1) {
      const firstCorrectIndex = newOptions.findIndex(opt => opt.correct);
      if (firstCorrectIndex !== -1) {
        newOptions = newOptions.map((opt, i) => ({
          ...opt,
          correct: i === firstCorrectIndex
        }));
      }
      toast.success('Only first correct option kept');
    }
    onChange({ ...initializedConfig, allowMultipleCorrect: allowMultiple, options: newOptions });
  };
  
  const handleImageSelect = (url: string) => {
    onChange({ ...initializedConfig, imageUrl: url });
    setShowImageSelector(false);
    setImageError(false);
    toast.success('Scenario image added');
  };
  
  const handleRemoveImage = () => {
    onChange({ ...initializedConfig, imageUrl: '' });
    setImageError(false);
    toast.success('Image removed from scenario');
  };
  
  // ✅ NEW: General feedback handler
  const handleGeneralFeedbackChange = (html: string) => {
    setLocalGeneralFeedback(html);
    onChange({ ...initializedConfig, generalFeedback: html });
  };
  
  const addOption = () => {
    if (initializedConfig.options.length >= 6) {
      toast.error('Maximum 6 options allowed');
      return;
    }
    const newOption: Option = {
      id: `opt_${Date.now()}`,
      text: `Option ${initializedConfig.options.length + 1}`,
      correct: false,
      feedback: '',  // ✅ KEPT as "feedback"
      ...(isQuizQuestion ? { points: 0 } : { xp: 0 })
    };
    const newOptions = [...initializedConfig.options, newOption];
    onChange({ ...initializedConfig, options: newOptions });
    setTimeout(() => {
      setSelectedOptionIndex(newOptions.length - 1);
    }, 0);
    toast.success('Option added — click to edit');
  };
  
  const updateOption = (index: number, updates: Partial<Option>) => {
    if (index < 0 || index >= initializedConfig.options.length) return;
    let newOptions = [...initializedConfig.options];
    newOptions[index] = { ...newOptions[index], ...updates };
    if (updates.correct === true && !initializedConfig.allowMultipleCorrect) {
      newOptions = newOptions.map((opt, i) =>
        i === index ? { ...opt, correct: true } : { ...opt, correct: false }
      );
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
    // If we deleted the only correct option, don't auto-mark another as correct
    if (deletedOption.correct && newOptions.length > 0) {
      const hasCorrect = newOptions.some(opt => opt.correct);
      if (!hasCorrect) {
        // Let user choose — no auto-mark
      }
    }
    onChange({ ...initializedConfig, options: newOptions });
    setSelectedOptionIndex(null);
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
    } else if (selectedOptionIndex !== null) {
      if (selectedOptionIndex > oldIndex && selectedOptionIndex <= newIndex) {
        setSelectedOptionIndex(prev => prev! - 1);
      } else if (selectedOptionIndex < oldIndex && selectedOptionIndex >= newIndex) {
        setSelectedOptionIndex(prev => prev! + 1);
      }
    }
  };
  
  const toggleOptionCorrect = (index: number) => {
    const option = initializedConfig.options[index];
    updateOption(index, { correct: !option.correct });
  };
  
  // Keyboard shortcuts
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
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOptionIndex, editingOptionIndex, initializedConfig.options.length]);
  
  // ================================
  // COMPUTED
  // ================================
  
  const correctCount = initializedConfig.options.filter(opt => opt.correct).length;
  const currentReward = isQuizQuestion ? (initializedConfig.points || 0) : (initializedConfig.xp || 0);
  const hasImage = initializedConfig.imageUrl && initializedConfig.imageUrl.trim() !== '';
  
  return (
    <div className="space-y-6">
      {/* 1. Scenario Description */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Scenario Description <span className="text-danger">*</span>
        </label>
        <textarea
          value={localScenario}
          onChange={handleScenarioChange}
          onBlur={handleScenarioBlur}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary"
          rows={4}
          placeholder="Describe a realistic safety situation (e.g., machine jam, chemical spill, unsecured load)..."
        />
        <p className="text-xs text-text-muted mt-1.5">
          Set the context for the learner - what's happening?
        </p>
      </div>
      
      {/* 2. Scenario Image — FULL WIDTH */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2 text-center">
          Scenario Image (Optional)
        </label>
        {hasImage && !imageError ? (
          <div className="relative border-2 border-border rounded-lg p-2 bg-surface">
            <img
              src={initializedConfig.imageUrl}
              alt="Scenario"
              className="w-full h-48 object-contain rounded"
            />
            <div className="flex gap-2 mt-2 justify-center">
              <button
                onClick={() => setShowImageSelector(true)}
                className="btn btn-secondary text-sm px-3 py-1"
              >
                Change Image
              </button>
              <button
                onClick={handleRemoveImage}
                className="btn btn-danger text-sm px-3 py-1"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowImageSelector(true)}
            className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-primary-surface hover:border-primary-light transition-colors"
          >
            <svg className="w-12 h-12 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-text-secondary">Click to add image</p>
            <p className="text-xs text-text-muted mt-1">
              Add a visual to help learners understand the scenario
            </p>
          </button>
        )}
      </div>
      
      {/* 3. Question + Tooltip — same as MC editor */}
      <div className="relative">
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Question / Decision <span className="text-danger">*</span>
        </label>
        <textarea
          value={localQuestion}
          onChange={handleQuestionChange}
          onBlur={handleQuestionBlur}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary"
          rows={2}
          placeholder="What should the worker do next?"
        />
        {/* ✅ InfoTooltip on right, above field */}
        <InfoTooltip title="💡 Scenario-Based Question Tips">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Realistic context:</strong> Make the scenario authentic and job-relevant</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Clear action focus:</strong> Phrase options as concrete behaviors (e.g., "Lock out energy source" vs "Be safe")</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Plausible distractors:</strong> Incorrect options should reflect real misconceptions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Feedback matters:</strong> Explain *why* in feedback — not just right/wrong</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Multiple correct:</strong> Use for complex decisions where several safe actions are valid</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Images:</strong> Add to scenario or individual options for visual realism</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>
      
      {/* 4. Settings Side-by-Side: Allow Multiple + Reward */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multiple Correct Toggle */}
        <div className="p-3 bg-surface rounded-lg border border-border">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={initializedConfig.allowMultipleCorrect}
              onChange={handleAllowMultipleCorrectChange}
              className="mr-3 h-4 w-4 text-primary rounded focus:ring-primary-light"
            />
            <div className="flex-1">
              <span className="font-medium text-text-primary text-sm">
                Allow multiple correct answers
              </span>
              <p className="text-xs text-text-secondary mt-0.5">
                {initializedConfig.allowMultipleCorrect
                  ? "Users must select ALL correct options (checkbox mode)"
                  : "Users select only ONE answer (radio button mode)"}
              </p>
            </div>
          </label>
        </div>
        
        {/* Reward Input */}
        <div className="p-3 bg-surface rounded-lg border border-border">
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Total {isQuizQuestion ? 'Points' : 'XP'} <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            min="0"
            value={currentReward}
            onChange={handleRewardChange}
            className="w-full"
          />
          <p className="text-xs text-text-muted mt-1.5">
            {correctCount > 0 ? (
              <>Auto-distributed: <strong>{Math.round(currentReward / correctCount)} {isQuizQuestion ? 'pts' : 'XP'}</strong> per correct option</>
            ) : (
              <>Awarded when user selects correct answer(s)</>
            )}
          </p>
        </div>
      </div>
      
      {/* 5. Answer Options — MC-style */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-3">
            <h3 className="font-medium text-text-primary">
              Answer Options ({initializedConfig.options.length}/6)
            </h3>
            {correctCount > 0 && (
              <span className="text-xs text-text-secondary">
                • {correctCount} correct ({Math.round(currentReward / correctCount)} {isQuizQuestion ? 'pts' : 'XP'} each)
              </span>
            )}
          </div>
          <button
            onClick={addOption}
            disabled={initializedConfig.options.length >= 6}
            className="btn btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Option</span>
          </button>
        </div>
        
        {initializedConfig.options.length >= 6 && (
          <p className="text-xs text-warning-dark mb-3">⚠️ Maximum of 6 options reached</p>
        )}
        
        {initializedConfig.options.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-6 bg-surface text-center">
            <svg className="mx-auto h-10 w-10 text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-text-secondary text-sm">No options added yet</p>
            <p className="text-xs text-text-muted mt-1">Add at least 2 options to create a valid scenario</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={initializedConfig.options.map(opt => opt.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {initializedConfig.options.map((option, index) => (
                  <SortableOptionItem
                    key={option.id}
                    option={option}
                    index={index}
                    isSelected={selectedOptionIndex === index}
                    onSelect={() => setSelectedOptionIndex(index)}
                    onToggleCorrect={() => toggleOptionCorrect(index)}
                    allowMultipleCorrect={initializedConfig.allowMultipleCorrect}
                    isQuizQuestion={isQuizQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        
        {/* Warnings - Only show if user has had time to add options */}
        {correctCount === 0 && initializedConfig.options.length >= 2 && (
          <div className="mt-3 p-3 bg-alert-light border border-alert rounded-lg">
            <p className="text-sm text-alert-dark font-medium">⚠️ No correct answer selected</p>
            <p className="text-xs text-alert-dark mt-1">Mark at least one option as correct</p>
          </div>
        )}
      </div>
      
      {/* 6. General Feedback — ✅ NEW SECTION */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-text-secondary">General Feedback (Optional)</label>
          <span
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help"
            title="This feedback will be shown to learners after they submit, regardless of their score. Use it to provide context, hints, or learning points."
          >
            ?
          </span>
        </div>
        <GameRichTextEditor
          key="general-feedback-editor"
          content={localGeneralFeedback}
          onChange={handleGeneralFeedbackChange}
          height={150}
          placeholder="Provide context or hints about the scenario..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Provide context or hints about the scenario</span>
          <span className={
            getPlainTextLength(localGeneralFeedback) > 500
              ? 'text-danger font-medium'
              : getPlainTextLength(localGeneralFeedback) > 400
              ? 'text-warning-dark'
              : 'text-text-muted'
          }>
            {getPlainTextLength(localGeneralFeedback)}/500 characters
          </span>
        </div>
      </div>
      
      {/* 7. Game Summary */}
      <GameSummary
        title="Scenario Summary"
        showEmpty={initializedConfig.options.length === 0 || correctCount === 0}
        emptyMessage="⚠️ Add at least 2 options and mark correct answer(s) to complete the scenario."
        items={[
          {
            label: 'Total Options',
            value: initializedConfig.options.length
          },
          {
            label: 'Correct Answers',
            value: correctCount,
            highlight: correctCount > 0
          },
          {
            label: 'Answer Mode',
            value: initializedConfig.allowMultipleCorrect ? 'Multiple' : 'Single'
          },
          {
            label: 'Total Reward',
            value: `${currentReward} ${isQuizQuestion ? 'pts' : 'XP'}`,
            highlight: true
          }
        ]}
      />
      
      {/* 🔥 INLINE OPTION EDIT PANEL — ONLY when NOT selecting image (✅ like MC) */}
      {selectedOptionIndex !== null && editingOptionIndex === null && !showImageSelector && (
        <InlineOptionEditPanel
          option={initializedConfig.options[selectedOptionIndex]}
          index={selectedOptionIndex}
          feedback={editingFeedback}
          onFeedbackChange={(html) => {
            setEditingFeedback(html);
            updateOption(selectedOptionIndex, { feedback: html });
          }}
          onUpdate={(updates) => updateOption(selectedOptionIndex, updates)}
          onDelete={() => {
            deleteOption(selectedOptionIndex);
            setSelectedOptionIndex(null);
          }}
          onClose={() => setSelectedOptionIndex(null)}
          onSelectImage={() => {
            setEditingOptionIndex(selectedOptionIndex); // 👈 enter full-edit mode
            setShowImageSelector(true);             // 👈 open selector
          }}
          onRemoveImage={() => {
            updateOption(selectedOptionIndex, { imageUrl: undefined });
            toast.success('Option image removed');
          }}
          allowMultipleCorrect={initializedConfig.allowMultipleCorrect}
          correctCount={correctCount}
          isQuizQuestion={isQuizQuestion}
        />
      )}
      
      {/* Image Selector — scenario or option */}
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={(url) => {
            if (editingOptionIndex !== null) {
              // For option image
              updateOption(editingOptionIndex, { imageUrl: url });
            } else {
              // For scenario image
              onChange({ ...initializedConfig, imageUrl: url });
            }
            setShowImageSelector(false);
            setEditingOptionIndex(null);
            toast.success('Image added');
          }}
          onClose={() => {
            setShowImageSelector(false);
            setEditingOptionIndex(null);
          }}
        />
      )}
    </div>
  );
}