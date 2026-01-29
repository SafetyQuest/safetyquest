'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';
import GameRichTextEditor from './ui/GameRichTextEditor';

// ============================================================================
// TYPES (Aligned with games.ts)
// ============================================================================

type PhotoSwipeCard = {
  id: string;
  imageUrl: string;
  isCorrect: 'safe' | 'unsafe';  // ✅ Better than boolean - more explicit
  explanation: string;           // ✅ Required - always provide learning context (rich text HTML)
  xp?: number;
  points?: number;
};

type PhotoSwipeConfig = {
  instruction: string;
  cards: PhotoSwipeCard[];       // ✅ "cards" not "items" - consistent naming
  timeAttackMode: boolean;       // Enable time challenge
  timeLimitSeconds?: number;     // Duration (only used if timeAttackMode = true) - Total time for all cards
  totalXp?: number;              // Auto-calculated
  totalPoints?: number;          // Auto-calculated
  generalFeedback?: string;      // ✅ NEW: General feedback (rich text HTML)
};

type PhotoSwipeEditorProps = {
  config: any;
  onChange: (newConfig: PhotoSwipeConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim().length;
};

// ============================================================================
// SORTABLE CARD COMPONENT
// ============================================================================

function SortableCard({ 
  card, 
  index,
  isSelected, 
  onSelect,
  isQuizQuestion,
  onDelete
}: { 
  card: PhotoSwipeCard; 
  index: number;
  isSelected: boolean; 
  onSelect: () => void;
  isQuizQuestion: boolean;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: card.id });

  const [imageError, setImageError] = useState(false);
  const isSafe = card.isCorrect === 'safe';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(index);
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`
        border-2 rounded-lg p-3 cursor-move transition-all relative
        ${isSelected 
          ? isSafe
            ? 'bg-green-50 border-green-500 shadow-md ring-2 ring-green-200'
            : 'bg-red-50 border-red-500 shadow-md ring-2 ring-red-200'
          : isSafe
            ? 'bg-white border-green-200 hover:border-green-300 hover:shadow-sm'
            : 'bg-white border-red-200 hover:border-red-300 hover:shadow-sm'}
        ${isDragging ? 'scale-105 shadow-lg' : ''}
      `}
    >
      {/* Delete Icon */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 z-10"
        title={`Delete Card ${index + 1}`}
        aria-label={`Delete Card ${index + 1}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex items-center gap-3">
        {/* Numbered badge */}
        <div className={`
          flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-bold text-sm
          ${isSafe 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'}
        `}>
          {index + 1}
        </div>
        
        {/* Image preview */}
        <div className="w-20 h-20 rounded border overflow-hidden flex-shrink-0 bg-gray-100">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          ) : (
            <img 
              src={card.imageUrl} 
              alt={`Card ${index + 1}`}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          )}
        </div>
        
        {/* Card info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`
              px-2 py-0.5 rounded text-xs font-medium
              ${isSafe 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'}
            `}>
              {isSafe ? '✓ Safe' : '✗ Unsafe'}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {isQuizQuestion ? (card.points || 10) : (card.xp || 10)} {isQuizQuestion ? 'pts' : 'XP'}
            </span>
          </div>
          {card.explanation && (
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <span className="font-bold text-red-600">Feedback:</span>
              <span className="truncate" title={card.explanation}>{card.explanation}</span>
            </div>
          )}
          {imageError && (
            <p className="text-xs text-red-500">⚠ Image failed to load</p>
          )}
        </div>
        
        {isSelected && (
          <div className="flex-shrink-0">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isSafe ? 'bg-green-600' : 'bg-red-600'
            }`}></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CARD EDIT MODAL
// ============================================================================

function CardEditModal({
  card,
  index,
  isQuizQuestion,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage
}: {
  card: PhotoSwipeCard;
  index: number;
  isQuizQuestion: boolean;
  onUpdate: (updates: Partial<PhotoSwipeCard>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
}) {
  const [localExplanation, setLocalExplanation] = useState(card.explanation);
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setLocalExplanation(card.explanation);
  }, [card.explanation]);
  
  const handleExplanationChange = (html: string) => {
    setLocalExplanation(html);
    onUpdate({ explanation: html });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Card {index + 1}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image Preview & Select */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Card Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed rounded-lg p-4">
              {imageError || !card.imageUrl ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <button
                    onClick={onSelectImage}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Select Image
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <img 
                    src={card.imageUrl} 
                    alt={`Card ${index + 1}`}
                    className="w-full h-64 object-contain rounded"
                    onError={() => setImageError(true)}
                  />
                  <button
                    onClick={onSelectImage}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Change Image
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Safety Classification */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Safety Classification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onUpdate({ isCorrect: 'safe' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  card.isCorrect === 'safe'
                    ? 'bg-green-50 border-green-500 ring-2 ring-green-200'
                    : 'bg-white border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-1">✓</div>
                <div className="font-medium">Safe</div>
                <div className="text-xs text-gray-600">Correct/Good Practice</div>
              </button>
              <button
                onClick={() => onUpdate({ isCorrect: 'unsafe' })}
                className={`p-4 rounded-lg border-2 transition-all ${
                  card.isCorrect === 'unsafe'
                    ? 'bg-red-50 border-red-500 ring-2 ring-red-200'
                    : 'bg-white border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="text-2xl mb-1">✗</div>
                <div className="font-medium">Unsafe</div>
                <div className="text-xs text-gray-600">Incorrect/Bad Practice</div>
              </button>
            </div>
          </div>

          {/* Explanation - REPLACED WITH RICH TEXT EDITOR */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label className="block text-sm font-medium">Explanation / Feedback <span className="text-red-500">*</span></label>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help" title="Explain why this scenario is safe or unsafe. This helps learners understand their mistakes. Shown when the user makes a wrong choice (in non-time-attack mode).">?</span>
            </div>
            <GameRichTextEditor
              key={`card-explanation-${index}`}
              content={localExplanation}
              onChange={handleExplanationChange}
              height={120}
              placeholder="Explain why this is safe/unsafe. This helps learners understand their mistakes."
            />
            <div className="flex justify-end mt-1">
              <span className={getPlainTextLength(localExplanation) > 300 ? 'text-red-600 font-medium text-xs' : getPlainTextLength(localExplanation) > 240 ? 'text-yellow-600 text-xs' : 'text-gray-500 text-xs'}>
                {getPlainTextLength(localExplanation)}/300 characters
              </span>
            </div>
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={isQuizQuestion ? (card.points || 10) : (card.xp || 10)}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onUpdate(isQuizQuestion ? { points: value } : { xp: value });
              }}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-600 mt-1">
              Reward for correctly classifying this card
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
            >
              Delete Card
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EDITOR
// ============================================================================

export default function PhotoSwipeEditor({
  config,
  onChange,
  isQuizQuestion,
}: PhotoSwipeEditorProps) {
  
  // Initialize config with proper structure
  const initializedConfig: PhotoSwipeConfig = useMemo(() => ({
    instruction: config.instruction || 'Swipe right for Safe ✓ or left for Unsafe ✗',
    cards: config.cards || [],
    timeAttackMode: config.timeAttackMode || false,
    timeLimitSeconds: config.timeLimitSeconds || 30,
    generalFeedback: config.generalFeedback || '', // ✅ NEW FIELD
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  }), [config, isQuizQuestion]);

  // Local state for instruction to prevent focus loss
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Swipe right for Safe ✓ or left for Unsafe ✗');
  
  // Local state for time limit to allow smooth slider interaction
  const [localTimeLimit, setLocalTimeLimit] = useState(config.timeLimitSeconds || 30);
  
  // ✅ NEW: Local state for general feedback
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState(config.generalFeedback || '');
  
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [showImageSelectorForIndex, setShowImageSelectorForIndex] = useState<number | null>(null);
  const [activeCard, setActiveCard] = useState<PhotoSwipeCard | null>(null);

  // Sync local instruction when config changes
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Swipe right for Safe ✓ or left for Unsafe ✗');
  }, [config.instruction]);

  // Sync local time limit when config changes
  useEffect(() => {
    setLocalTimeLimit(config.timeLimitSeconds || 30);
  }, [config.timeLimitSeconds]);

  // ✅ NEW: Sync local general feedback when config changes
  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 } // Require 5px movement before drag starts, allowing clicks
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate total reward
  const totalReward = useMemo(() => {
    return initializedConfig.cards.reduce((sum, card) => {
      return sum + (isQuizQuestion ? (card.points || 0) : (card.xp || 0));
    }, 0);
  }, [initializedConfig.cards, isQuizQuestion]);

  // Auto-update total reward
  useEffect(() => {
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== totalReward) {
      const updatedConfig = {
        ...initializedConfig,
        ...(isQuizQuestion ? { totalPoints: totalReward } : { totalXp: totalReward })
      };
      onChange(updatedConfig);
    }
  }, [totalReward, initializedConfig, isQuizQuestion, onChange]);

  // Count safe and unsafe cards
  const safeCount = initializedConfig.cards.filter(c => c.isCorrect === 'safe').length;
  const unsafeCount = initializedConfig.cards.filter(c => c.isCorrect === 'unsafe').length;

  // ============================================================================
  // HANDLERS
  // ============================================================================

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

  const handleTimeAttackToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...initializedConfig,
      timeAttackMode: e.target.checked
    });
  };

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTimeLimit(parseInt(e.target.value) || 30);
  };

  const handleTimeLimitMouseUp = () => {
    if (localTimeLimit !== initializedConfig.timeLimitSeconds) {
      onChange({
        ...initializedConfig,
        timeLimitSeconds: localTimeLimit
      });
    }
  };

  const addCard = () => {
    const newCard: PhotoSwipeCard = {
      id: `card-${Date.now()}-${Math.random()}`,
      imageUrl: '',
      isCorrect: 'safe',
      explanation: '',
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };
    
    onChange({
      ...initializedConfig,
      cards: [...initializedConfig.cards, newCard]
    });
    
    toast.success('Card added! Click to edit.');
  };

  const updateCard = (index: number, updates: Partial<PhotoSwipeCard>) => {
    const newCards = [...initializedConfig.cards];
    newCards[index] = { ...newCards[index], ...updates };
    onChange({
      ...initializedConfig,
      cards: newCards
    });
  };

  const deleteCard = (index: number) => {
    const newCards = initializedConfig.cards.filter((_, i) => i !== index);
    onChange({
      ...initializedConfig,
      cards: newCards
    });
    
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
    }
    
    toast.success('Card deleted');
  };

  const handleImageSelect = (url: string) => {
    if (showImageSelectorForIndex !== null) {
      updateCard(showImageSelectorForIndex, { imageUrl: url });
      setShowImageSelectorForIndex(null);
      toast.success('Image updated');
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = initializedConfig.cards.find(c => c.id === active.id);
    setActiveCard(card || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || active.id === over.id) return;

    const oldIndex = initializedConfig.cards.findIndex(c => c.id === active.id);
    const newIndex = initializedConfig.cards.findIndex(c => c.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const newCards = arrayMove(initializedConfig.cards, oldIndex, newIndex);
      onChange({
        ...initializedConfig,
        cards: newCards
      });
      toast.success('Card order updated');
    }
  };

  // Validation
  const validationErrors: string[] = [];
  if (!initializedConfig.instruction.trim()) {
    validationErrors.push('Game instruction is required');
  }
  if (initializedConfig.cards.length === 0) {
    validationErrors.push('At least one card is required');
  }
  initializedConfig.cards.forEach((card, index) => {
    if (!card.imageUrl) {
      validationErrors.push(`Card ${index + 1}: Image is required`);
    }
    if (getPlainTextLength(card.explanation) === 0) { // ✅ UPDATED: Check plain text length
      validationErrors.push(`Card ${index + 1}: Explanation is required`);
    }
  });

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Game Instruction <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="e.g., Swipe right for Safe ✓ or left for Unsafe ✗"
        />
        
        {/* Tips Tooltip */}
        <InfoTooltip title="💡 Photo Swipe Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Mobile-first design</strong> — players swipe right for safe, left for unsafe scenarios</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Clear visuals</strong> — use high-quality images that clearly show safe or unsafe situations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Explanations required</strong> — provide feedback to help learners understand their mistakes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Mix scenarios</strong> — include both safe and unsafe situations for variety</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Time Attack mode</strong> — hides explanations and adds urgency, use for speed challenges</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Drag to reorder</strong> — arrange cards in the sequence you want players to see them</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Click to edit</strong> — select any card to modify its image, classification, or feedback</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>
      
      {/* Time Settings */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={initializedConfig.timeAttackMode}
                onChange={handleTimeAttackToggle}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <span className="font-medium">⚡ Time Attack Mode</span>
            </label>
            <p className="text-xs text-gray-600 ml-6 mt-1">
              Enable timer for speed challenge (hides explanations)
            </p>
          </div>
        </div>
        
        {/* Time Limit Slider - Always Visible */}
        <div className="mt-3 pl-6 border-l-2 border-blue-200">
          <label className="block text-sm font-medium mb-1">
            Time Limit (seconds) <span className="text-red-500">*</span>
          </label>
          <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Duration</span>
              <span className="text-2xl font-bold text-blue-900">
                {localTimeLimit}s
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="300"
              step="5"
              value={localTimeLimit}
              onChange={handleTimeLimitChange}
              onMouseUp={handleTimeLimitMouseUp}
              onTouchEnd={handleTimeLimitMouseUp}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>15s (Quick)</span>
              <span className="font-medium text-blue-900">{localTimeLimit}s</span>
              <span>300s (Extended)</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {initializedConfig.timeAttackMode 
              ? `Total time to complete all ${initializedConfig.cards.length} card${initializedConfig.cards.length !== 1 ? 's' : ''}`
              : 'Time limit will only apply when Time Attack Mode is enabled'
            }
          </p>
        </div>
      </div>
      
      {/* Cards Section Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Cards ({initializedConfig.cards.length})
          </h3>
          <p className="text-sm text-gray-600">
            {safeCount} Safe • {unsafeCount} Unsafe
            {totalReward > 0 && ` • ${totalReward} ${isQuizQuestion ? 'points' : 'XP'} total`}
          </p>
        </div>
        <button
          onClick={addCard}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Card
        </button>
      </div>
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-900 mb-2">⚠️ Validation Issues:</p>
          <ul className="text-xs text-red-800 space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Cards List */}
      {initializedConfig.cards.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 mb-4">No cards added yet</p>
          <button
            onClick={addCard}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Your First Card
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={initializedConfig.cards.map(card => card.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {initializedConfig.cards.map((card, index) => (
                <SortableCard
                  key={card.id}
                  card={card}
                  index={index}
                  isSelected={selectedCardIndex === index}
                  onSelect={() => setSelectedCardIndex(index)}
                  isQuizQuestion={isQuizQuestion}
                  onDelete={deleteCard}
                />
              ))}
            </div>
          </SortableContext>
          
          <DragOverlay>
            {activeCard && (
              <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-xl opacity-90">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                    {initializedConfig.cards.findIndex(c => c.id === activeCard.id) + 1}
                  </div>
                  <div className="w-20 h-20 rounded border overflow-hidden flex-shrink-0">
                    <img 
                      src={activeCard.imageUrl} 
                      alt="Dragging"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <span className={`
                      px-2 py-0.5 rounded text-xs font-medium
                      ${activeCard.isCorrect === 'safe'
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'}
                    `}>
                      {activeCard.isCorrect === 'safe' ? '✓ Safe' : '✗ Unsafe'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
      
      {/* ✅ NEW: General Feedback Section */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">General Feedback (Optional)</label>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help" title="This feedback will be shown to learners after they submit, regardless of their score. Use it to provide context, hints, or learning points.">?</span>
        </div>
        <GameRichTextEditor
          key="general-feedback-editor"
          content={localGeneralFeedback}
          onChange={(html) => {
            setLocalGeneralFeedback(html);
            onChange({ ...initializedConfig, generalFeedback: html });
          }}
          height={150}
          placeholder="Provide context or hints about what learners should look for..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-gray-500">Provide context or hints about what learners should look for</span>
          <span className={getPlainTextLength(localGeneralFeedback) > 500 ? 'text-red-600 font-medium' : getPlainTextLength(localGeneralFeedback) > 400 ? 'text-yellow-600' : 'text-gray-500'}>
            {getPlainTextLength(localGeneralFeedback)}/500 characters
          </span>
        </div>
      </div>
      
      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.cards.length === 0}
        emptyMessage="⚠️ Add cards to calculate statistics and finalize the game."
        items={[
          {
            label: 'Total Cards',
            value: initializedConfig.cards.length
          },
          {
            label: 'Safe Scenarios',
            value: safeCount,
            icon: (
              <span className="text-green-600">✓</span>
            )
          },
          {
            label: 'Unsafe Scenarios',
            value: unsafeCount,
            icon: (
              <span className="text-red-600">✗</span>
            )
          },
          {
            label: `Total ${isQuizQuestion ? 'Points' : 'XP'}`,
            value: totalReward,
            highlight: true
          },
          ...(initializedConfig.timeAttackMode ? [{
            label: 'Time Limit',
            value: `${initializedConfig.timeLimitSeconds}s`,
            icon: (
              <span className="text-blue-600">⚡</span>
            )
          }] : [])
        ]}
      />
      
      {/* Image Selector Modal */}
      {showImageSelectorForIndex !== null && (
        <MediaSelector
          accept="image/*"
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelectorForIndex(null)}
        />
      )}
      
      {/* Card Edit Modal */}
      {selectedCardIndex !== null && initializedConfig.cards[selectedCardIndex] && (
        <CardEditModal
          card={initializedConfig.cards[selectedCardIndex]}
          index={selectedCardIndex}
          isQuizQuestion={isQuizQuestion}
          onUpdate={(updates) => updateCard(selectedCardIndex, updates)}
          onDelete={() => deleteCard(selectedCardIndex)}
          onClose={() => setSelectedCardIndex(null)}
          onSelectImage={() => setShowImageSelectorForIndex(selectedCardIndex)}
        />
      )}
    </div>
  );
}