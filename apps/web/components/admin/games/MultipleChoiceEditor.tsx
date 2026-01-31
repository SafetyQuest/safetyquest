// apps/web/components/admin/games/MultipleChoiceEditor.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';
import GameRichTextEditor from './ui/GameRichTextEditor';
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
// HELPER FUNCTION — Character counting for rich text
// ============================================================================

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim().length;
};

// ============================================================================
// TYPES (Aligned with runtime usage - single activity)
// ============================================================================

type MultipleChoiceOption = {
  id: string;
  text: string;
  correct: boolean;
  imageUrl?: string;
  explanation?: string;
};

type MultipleChoiceConfig = {
  instruction: string;
  instructionImageUrl?: string;
  options: MultipleChoiceOption[];
  allowMultipleCorrect: boolean;
  points?: number;
  xp?: number;
  generalFeedback?: string;
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
        {option.imageUrl && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-white"></span>
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
        {/* Option Image */}
        {option.imageUrl && !imageError ? (
          <img
            src={option.imageUrl}
            alt={option.text || `Option ${String.fromCharCode(65 + index)}`}
            className="w-16 h-16 rounded border object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : option.imageUrl && imageError ? (
          <div className="w-16 h-16 rounded border border-border bg-surface flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : null}
        {/* Option Text + Explanation Preview */}
        <div className="flex-1 min-w-0">
          <span className="block break-words text-sm text-text-primary pr-6">{option.text}</span>
          {option.explanation && (
            <div className="mt-2 text-xs bg-primary-surface rounded p-2 text-text-secondary border border-primary-light">
              <span className="font-medium text-primary-dark">Explanation:</span>
              <span
                dangerouslySetInnerHTML={{
                  __html: option.explanation.length > 100
                    ? option.explanation.substring(0, 100) + '...'
                    : option.explanation
                }}
              />
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
// OPTION EDIT MODAL
// ============================================================================

function OptionEditModal({
  option,
  index,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage,
  explanation,
  onExplanationChange
}: {
  option: MultipleChoiceOption;
  index: number;
  onUpdate: (updates: Partial<MultipleChoiceOption>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
  explanation: string;
  onExplanationChange: (html: string) => void;
}) {
  const [text, setText] = useState(option.text);
  const [imageError, setImageError] = useState(false);
  const [localExplanation, setLocalExplanation] = useState(explanation);

  const handleSave = () => {
    if (!text?.trim()) {
      toast.error('Option text cannot be empty');
      return;
    }
    onUpdate({ text: text.trim() });
    onClose();
  };

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
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-heading-4 text-text-primary">Edit Option {String.fromCharCode(65 + index)}</h3>
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
              className="w-full"
              rows={3}
              placeholder="e.g., Wear gloves and goggles"
              autoFocus
            />
            <p className="text-xs text-text-muted mt-1.5">
              Press Ctrl+Enter to save, Esc to cancel
            </p>
          </div>
          {/* Explanation */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-sm font-medium text-text-secondary">Explanation (Optional)</label>
              <span
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help"
                title="Help learners understand why this option is correct/incorrect. Shown after submission."
              >
                ?
              </span>
            </div>
            <GameRichTextEditor
              key={`option-explanation-${index}`}
              content={localExplanation}
              onChange={(html) => {
                setLocalExplanation(html);
                onExplanationChange(html);
              }}
              height={120}
              placeholder="Explain why this choice is correct or incorrect..."
            />
            <div className="flex justify-end mt-1">
              <span className={
                getPlainTextLength(localExplanation) > 300
                  ? 'text-danger font-medium text-xs'
                  : getPlainTextLength(localExplanation) > 240
                  ? 'text-warning-dark text-xs'
                  : 'text-text-muted text-xs'
              }>
                {getPlainTextLength(localExplanation)}/300 characters
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
                {!imageError ? (
                  <img
                    src={option.imageUrl}
                    alt="Option"
                    className="w-full h-48 object-contain border rounded-lg bg-white"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-48 border rounded-lg bg-surface flex items-center justify-center">
                    <div className="text-center text-text-secondary">
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
                    className="flex-1 btn btn-secondary text-sm"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="btn btn-danger text-sm px-3 py-2"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
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
        </div>
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
          <button
            onClick={onDelete}
            className="btn btn-danger px-4 py-2 text-sm"
          >
            Delete Option
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn btn-secondary px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary px-4 py-2"
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

export default function MultipleChoiceEditor({
  config,
  onChange,
  isQuizQuestion
}: MultipleChoiceEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [showInstructionImageSelector, setShowInstructionImageSelector] = useState(false);
  const [imageTargetType, setImageTargetType] = useState<'instruction' | 'option'>('option');
  const [editingExplanation, setEditingExplanation] = useState<string>('');
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState<string>('');

  const initializedConfig: MultipleChoiceConfig = useMemo(() => ({
    instruction: config.instruction || '',
    instructionImageUrl: config.instructionImageUrl || undefined,
    options: config.options || [],
    allowMultipleCorrect: config.allowMultipleCorrect === true,
    generalFeedback: config.generalFeedback || '',
    ...(isQuizQuestion
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  }), [config, isQuizQuestion]);

  const [localInstruction, setLocalInstruction] = useState(config.instruction || '');

  useEffect(() => {
    setLocalInstruction(config.instruction || '');
  }, [config.instruction]);

  useEffect(() => {
    if (selectedOptionIndex !== null && initializedConfig.options[selectedOptionIndex]) {
      setEditingExplanation(initializedConfig.options[selectedOptionIndex].explanation || '');
    }
  }, [selectedOptionIndex, initializedConfig.options]);

  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);

  const correctCount = initializedConfig.options.filter(opt => opt.correct).length;
  const currentReward = isQuizQuestion ? (initializedConfig.points || 0) : (initializedConfig.xp || 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedOptionIndex !== null && editingOptionIndex === null) {
        e.preventDefault();
        deleteOption(selectedOptionIndex);
      }
      if (e.key === 'Escape' && selectedOptionIndex !== null && editingOptionIndex === null) {
        setSelectedOptionIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOptionIndex, editingOptionIndex]);

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalInstruction(e.target.value);
  };

  const handleInstructionBlur = () => {
    if (localInstruction !== initializedConfig.instruction) {
      onChange({
        ...initializedConfig,
        instruction: localInstruction
      });
    }
  };

  const handleAllowMultipleCorrectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allowMultiple = e.target.checked;
    let newOptions = [...initializedConfig.options];
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

  const handleGeneralFeedbackChange = (html: string) => {
    setLocalGeneralFeedback(html);
    onChange({ ...initializedConfig, generalFeedback: html });
  };

  const handleAddOption = () => {
    if (initializedConfig.options.length >= 6) {
      toast.error('Maximum 6 options allowed', { duration: 3000 });
      return;
    }
    const optionNumber = initializedConfig.options.length + 1;
    const newOption: MultipleChoiceOption = {
      id: `opt_${Date.now()}`,
      text: `Option ${optionNumber}`,
      correct: false,
      explanation: ''
    };
    const newOptions = [...initializedConfig.options, newOption];
    onChange({ ...initializedConfig, options: newOptions });
    setTimeout(() => {
      setSelectedOptionIndex(newOptions.length - 1);
    }, 0);
    toast.success('Option added - now edit the text', { duration: 2000 });
  };

  const updateOption = (index: number, updates: Partial<MultipleChoiceOption>) => {
    if (index < 0 || index >= initializedConfig.options.length) return;
    const newOptions = [...initializedConfig.options];
    const current = newOptions[index];
    newOptions[index] = { ...current, ...updates };
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
      updateOption(selectedOptionIndex, { imageUrl: url });
    } else if (editingOptionIndex !== null) {
      updateOption(editingOptionIndex, { imageUrl: url });
    }
    setShowImageSelector(false);
    toast.success('Option image added');
  };

  return (
    <div>
      {/* Instruction */}
      <div className="mb-5 relative">
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Instruction / Question <span className="text-danger">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary"
          rows={2}
          placeholder="e.g., Which of the following is the correct procedure for handling chemical spills?"
        />
        <InfoTooltip title="💡 Multiple Choice Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Add 2-6 options:</strong> Type option text and press Enter or click "+ Add Option"</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Mark correct:</strong> Check/uncheck options to mark correct answers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Multiple answers:</strong> Enable "Allow multiple correct" for checkbox mode</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Reorder:</strong> Drag options to change their display order</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Images:</strong> Add optional images to question or individual options</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Explanations:</strong> Add rich text explanations to help learners understand why options are correct/incorrect</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Auto-distribution:</strong> {isQuizQuestion ? 'Points' : 'XP'} split equally among correct options</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>

      {/* Image and Multiple Answers Option */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Question Image */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2">
            Question Image (Optional)
          </label>
          {initializedConfig.instructionImageUrl ? (
            <div className="relative border-2 border-border rounded-lg p-2 bg-surface">
              <img
                src={initializedConfig.instructionImageUrl}
                alt="Question"
                className="w-full h-48 object-contain rounded"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSelectInstructionImage}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  Change Image
                </button>
                <button
                  onClick={handleRemoveInstructionImage}
                  className="btn btn-danger text-sm px-3 py-1"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSelectInstructionImage}
              className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-primary-surface hover:border-primary-light transition-colors"
            >
              <svg className="w-10 h-10 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm text-text-secondary">Click to add image to question</p>
              <p className="text-xs text-text-muted mt-1">Great for showing diagrams, safety signs, or scenarios</p>
            </button>
          )}
        </div>
        {/* Settings Panel */}
        <div className="space-y-4">
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
                    ? "Users must select ALL correct answers (checkbox mode)"
                    : "Users select only ONE answer (radio button mode)"}
                </p>
              </div>
            </label>
          </div>
          <div className="p-3 bg-surface rounded-lg border border-border">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Total {isQuizQuestion ? 'Points' : 'XP'} <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
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
      </div>

      {/* Answer Options */}
      <div className="mb-6">
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
            onClick={handleAddOption}
            disabled={initializedConfig.options.length >= 6}
            className="btn btn-primary text-sm px-3 py-1.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Option</span>
          </button>
        </div>
        {initializedConfig.options.length >= 6 && (
          <p className="text-xs text-warning-dark mb-3">
            ⚠️ Maximum of 6 options reached
          </p>
        )}
        {initializedConfig.options.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-6 bg-surface text-center">
            <svg className="mx-auto h-10 w-10 text-text-muted mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <p className="text-text-secondary text-sm">No options added yet</p>
            <p className="text-xs text-text-muted mt-1">Add at least 2 options to create a valid question</p>
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
        {correctCount === 0 && initializedConfig.options.length > 0 && (
          <div className="mt-3 p-3 bg-alert-light border border-alert rounded-lg">
            <p className="text-sm text-alert-dark font-medium">⚠️ No correct answer selected</p>
            <p className="text-xs text-alert-dark mt-1">Mark at least one option as correct</p>
          </div>
        )}
      </div>

      {/* General Feedback */}
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
          placeholder="Provide context or hints about the question..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Provide context or hints about the question</span>
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

      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.options.length === 0 || correctCount === 0}
        emptyMessage="⚠️ Add at least 2 options and mark correct answer(s) to complete the game."
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

      {/* Edit Modal */}
      {selectedOptionIndex !== null && editingOptionIndex === null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={() => setSelectedOptionIndex(null)}>
          <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-heading-4 text-text-primary flex items-center gap-2">
                <span className="w-7 h-7 bg-text-primary text-white text-sm rounded-full flex items-center justify-center font-bold">
                  {String.fromCharCode(65 + selectedOptionIndex)}
                </span>
                Edit Option {selectedOptionIndex + 1}
              </h3>
              <button
                onClick={() => setSelectedOptionIndex(null)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Option Text <span className="text-danger">*</span>
                </label>
                <textarea
                  value={initializedConfig.options[selectedOptionIndex].text}
                  onChange={(e) => updateOption(selectedOptionIndex, { text: e.target.value })}
                  className="w-full"
                  rows={3}
                  placeholder="e.g., 'Wear gloves and goggles'"
                  autoFocus
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <label className="block text-sm font-medium text-text-secondary">Explanation (Optional)</label>
                  <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help"
                    title="Help learners understand why this option is correct/incorrect. Shown after submission."
                  >
                    ?
                  </span>
                </div>
                <GameRichTextEditor
                  key={`inline-option-explanation-${selectedOptionIndex}`}
                  content={editingExplanation}
                  onChange={(html) => {
                    setEditingExplanation(html);
                    updateOption(selectedOptionIndex, { explanation: html });
                  }}
                  height={120}
                  placeholder="Explain why this choice is correct or incorrect..."
                />
                <div className="flex justify-end mt-1">
                  <span className={
                    getPlainTextLength(editingExplanation) > 300
                      ? 'text-danger font-medium text-xs'
                      : getPlainTextLength(editingExplanation) > 240
                      ? 'text-warning-dark text-xs'
                      : 'text-text-muted text-xs'
                  }>
                    {getPlainTextLength(editingExplanation)}/300 characters
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Option Image (Optional)
                </label>
                {initializedConfig.options[selectedOptionIndex].imageUrl ? (
                  <div className="border rounded-lg p-3 bg-surface">
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
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        Change Image
                      </button>
                      <button
                        onClick={() => updateOption(selectedOptionIndex, { imageUrl: undefined })}
                        className="btn btn-danger text-sm px-3 py-2"
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
                    className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-primary-surface hover:border-primary-light transition-colors"
                  >
                    <svg className="w-12 h-12 mx-auto text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-text-secondary">Click to add image</p>
                    <p className="text-xs text-text-muted mt-1">Great for visual options (e.g., safety signs)</p>
                  </button>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={initializedConfig.options[selectedOptionIndex].correct}
                    onChange={() => toggleOptionCorrect(selectedOptionIndex)}
                    className="mr-3 h-5 w-5 text-success rounded focus:ring-success"
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-primary">
                      Mark as correct answer
                    </span>
                    <p className="text-xs text-text-secondary mt-0.5">
                      {initializedConfig.allowMultipleCorrect
                        ? "Users must select ALL correct options. Each correct option gets equal share of total reward."
                        : "Only one correct answer allowed in single-answer mode."}
                    </p>
                  </div>
                </label>
                {initializedConfig.options[selectedOptionIndex].correct && correctCount > 0 && (
                  <div className="mt-2 p-2 bg-success-light border border-success rounded text-xs text-success-dark">
                    🎯 This option will award <strong>{Math.round(currentReward / correctCount)} {isQuizQuestion ? 'pts' : 'XP'}</strong> (Total: {currentReward} ÷ {correctCount} correct)
                  </div>
                )}
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-text-secondary">
                  <strong>Display order:</strong> Position {selectedOptionIndex + 1} of {initializedConfig.options.length}
                </p>
                <p className="text-xs text-text-muted mt-1">
                  Drag options in the list to change their display order
                </p>
              </div>
            </div>
            <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
              <button
                onClick={() => {
                  deleteOption(selectedOptionIndex);
                  setSelectedOptionIndex(null);
                }}
                className="btn btn-danger px-4 py-2"
              >
                Delete Option
              </button>
              <button
                onClick={() => setSelectedOptionIndex(null)}
                className="btn btn-primary px-6 py-2"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Edit Modal */}
      {editingOptionIndex !== null && !showImageSelector && (
        <OptionEditModal
          option={initializedConfig.options[editingOptionIndex]}
          index={editingOptionIndex}
          explanation={initializedConfig.options[editingOptionIndex].explanation || ''}
          onExplanationChange={(html) => updateOption(editingOptionIndex, { explanation: html })}
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

      {/* Image Selectors */}
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={handleOptionImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}
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