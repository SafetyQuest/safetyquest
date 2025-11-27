// apps/web/components/admin/games/PhotoSwipeEditor.tsx
'use client';

import { useState, useEffect } from 'react';
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
import ImageSelector from '../ImageSelector';

// ============================================================================
// TYPES (Aligned with games.ts)
// ============================================================================

type PhotoSwipeCard = {
  id: string;
  imageUrl: string;
  isCorrect: 'safe' | 'unsafe';  // ✅ Better than boolean - more explicit
  explanation: string;           // ✅ Required - always provide learning context
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
};

type PhotoSwipeEditorProps = {
  config: any;
  onChange: (newConfig: PhotoSwipeConfig) => void;
  isQuizQuestion: boolean;
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
  onDelete // <-- Added onDelete prop
}: { 
  card: PhotoSwipeCard; 
  index: number;
  isSelected: boolean; 
  onSelect: () => void;
  isQuizQuestion: boolean;
  onDelete: (index: number) => void; // <-- Added onDelete prop type
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
    e.stopPropagation(); // Prevent card selection when clicking delete
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
        border-2 rounded-lg p-3 cursor-move transition-all relative // Added 'relative' for positioning the delete button
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
      {/* Delete Icon - Positioned top right */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 z-10" // z-10 to ensure it's above other content if needed
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
              <span className="font-bold text-red-600">Feedback on Wrong Answer:</span>
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
  const [isCorrect, setIsCorrect] = useState<'safe' | 'unsafe'>(card.isCorrect);
  const [explanation, setExplanation] = useState(card.explanation);
  const [reward, setReward] = useState(isQuizQuestion ? (card.points || 10) : (card.xp || 10));
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    if (!card.imageUrl) {
      toast.error('Card must have an image');
      return;
    }
    
    if (!explanation.trim()) {
      toast.error('Explanation is required to help learners understand');
      return;
    }
    
    onUpdate({ 
      isCorrect,
      explanation: explanation.trim(),
      ...(isQuizQuestion ? { points: reward } : { xp: reward })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Card #{index + 1}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Image Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Card Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {imageError ? (
                <div className="p-12 text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600">Failed to load image</p>
                </div>
              ) : (
                <img
                  src={card.imageUrl}
                  alt="Card preview"
                  className="w-full max-h-80 object-contain"
                  onError={() => setImageError(true)}
                />
              )}
            </div>
            <button
              onClick={onSelectImage}
              className="mt-2 w-full px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-md hover:bg-blue-100"
            >
              Change Image
            </button>
          </div>

          {/* Safety Classification */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Correct Classification <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsCorrect('safe')}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-left
                  ${isCorrect === 'safe'
                    ? 'bg-green-50 border-green-500 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-green-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isCorrect === 'safe' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {isCorrect === 'safe' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-green-700">Safe ✓</p>
                    <p className="text-xs text-gray-500">Correct safety practice</p>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setIsCorrect('unsafe')}
                className={`
                  px-4 py-3 rounded-lg border-2 transition-all text-left
                  ${isCorrect === 'unsafe'
                    ? 'bg-red-50 border-red-500 shadow-md' 
                    : 'bg-white border-gray-200 hover:border-red-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    isCorrect === 'unsafe' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                  }`}>
                    {isCorrect === 'unsafe' && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-red-700">Unsafe ✗</p>
                    <p className="text-xs text-gray-500">Safety hazard present</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Explanation/Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Explain why this scenario is safe or unsafe. This helps learners understand the correct answer."
            />
            <p className="text-xs text-gray-500 mt-1">
              ℹ️ Shown when user makes wrong choice (hidden in Time Attack mode)
            </p>
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={reward}
              onChange={(e) => setReward(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Reward for correct classification
            </p>
          </div>
        </div>
        
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this card?')) {
                onDelete();
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Delete Card
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
// MAIN EDITOR COMPONENT
// ============================================================================

export default function PhotoSwipeEditor({
  config,
  onChange,
  isQuizQuestion
}: PhotoSwipeEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Initialize config
  const initializedConfig: PhotoSwipeConfig = {
    instruction: config.instruction || 'Swipe right for Safe ✓ or left for Unsafe ✗',
    cards: config.cards || [],
    timeAttackMode: config.timeAttackMode || false,
    timeLimitSeconds: config.timeLimitSeconds || 30,
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  };
  
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageSelectorForIndex, setShowImageSelectorForIndex] = useState<number | null>(null);
  
  const activeCard = activeId 
    ? initializedConfig.cards.find(card => card.id === activeId)
    : null;
  
  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================
  
  useEffect(() => {
    const total = initializedConfig.cards.reduce((sum, card) => {
      return sum + (isQuizQuestion ? (card.points || 10) : (card.xp || 10));
    }, 0);
    
    const updatedConfig = {
      ...initializedConfig,
      ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
    };
    
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      onChange(updatedConfig);
    }
  }, [initializedConfig.cards, isQuizQuestion]);
  
  // ============================================================================
  // VALIDATION
  // ============================================================================
  
  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    
    if (!initializedConfig.instruction.trim()) {
      errors.push('Instruction is required');
    }
    
    if (initializedConfig.cards.length === 0) {
      errors.push('At least one card is required');
    }
    
    if (initializedConfig.cards.length < 3) {
      errors.push('Recommended: Add at least 3 cards for a good game experience');
    }
    
    initializedConfig.cards.forEach((card, index) => {
      if (!card.imageUrl) {
        errors.push(`Card ${index + 1}: Missing image`);
      }
      if (!card.explanation?.trim()) {
        errors.push(`Card ${index + 1}: Explanation is required to help learners`);
      }
      const reward = isQuizQuestion ? card.points : card.xp;
      if (!reward || reward < 1) {
        errors.push(`Card ${index + 1}: Invalid reward (must be at least 1)`);
      }
    });
    
    if (initializedConfig.timeAttackMode && (!initializedConfig.timeLimitSeconds || initializedConfig.timeLimitSeconds < 5)) {
      errors.push('Time Attack mode requires at least 5 seconds');
    }
    
    return errors;
  };
  
  const validationErrors = getValidationErrors();
  const totalReward = isQuizQuestion 
    ? initializedConfig.totalPoints || 0
    : initializedConfig.totalXp || 0;
  
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      instruction: e.target.value
    });
  };
  
  const addCard = () => {
    setShowImageSelectorForIndex(-1); // -1 = adding new card
  };
  
  const handleImageSelect = (url: string) => {
    if (showImageSelectorForIndex === -1) {
      // Add new card
      const newCard: PhotoSwipeCard = {
        id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl: url,
        isCorrect: 'safe',
        explanation: '',
        ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
      };
      
      onChange({
        ...initializedConfig,
        cards: [...initializedConfig.cards, newCard]
      });
      
      setSelectedCardIndex(initializedConfig.cards.length);
      toast.success('Card added! Click on it to configure safety classification.');
    } else if (showImageSelectorForIndex !== null && showImageSelectorForIndex >= 0) {
      // Update existing card image
      updateCard(showImageSelectorForIndex, { imageUrl: url });
      toast.success('Card image updated');
    }
    
    setShowImageSelectorForIndex(null);
  };
  
  const updateCard = (index: number, updates: Partial<PhotoSwipeCard>) => {
    if (index < 0 || index >= initializedConfig.cards.length) {
      console.warn('updateCard: invalid index', index);
      return;
    }
    
    const updatedCards = [...initializedConfig.cards];
    updatedCards[index] = { ...updatedCards[index], ...updates };
    
    onChange({
      ...initializedConfig,
      cards: updatedCards
    });
  };
  
  const deleteCard = (index: number) => {
    const updatedCards = initializedConfig.cards.filter((_, i) => i !== index);
    onChange({
      ...initializedConfig,
      cards: updatedCards
    });
    setSelectedCardIndex(null); // Deselect if the deleted card was selected
    toast.success('Card deleted');
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = initializedConfig.cards.findIndex(card => card.id === active.id);
      const newIndex = initializedConfig.cards.findIndex(card => card.id === over.id);
      
      const reorderedCards = arrayMove(initializedConfig.cards, oldIndex, newIndex);
      
      onChange({
        ...initializedConfig,
        cards: reorderedCards
      });
      
      toast.success('Card order updated');
    }
    
    setActiveId(null);
  };
  
  const handleTimeAttackToggle = () => {
    onChange({
      ...initializedConfig,
      timeAttackMode: !initializedConfig.timeAttackMode
    });
  };
  
  const handleTimeLimitChange = (seconds: number) => {
    onChange({
      ...initializedConfig,
      timeLimitSeconds: Math.max(5, seconds)
    });
  };
  
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
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="e.g., Swipe right for Safe ✓ or left for Unsafe ✗"
        />
      </div>
      
      {/* Time Attack Settings */}
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
        
        {initializedConfig.timeAttackMode && (
          <div className="mt-3 pl-6 border-l-2 border-blue-200">
            <label className="block text-sm font-medium mb-1">
              Time Limit (seconds) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={initializedConfig.timeLimitSeconds || 30}
              onChange={(e) => handleTimeLimitChange(parseInt(e.target.value) || 30)}
              className="w-32 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Total time to complete all {initializedConfig.cards.length} card{initializedConfig.cards.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
      
      {/* Cards Section Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            Cards ({initializedConfig.cards.length})
          </h3>
          <p className="text-sm text-gray-600">
            {totalReward > 0 && `Total: ${totalReward} ${isQuizQuestion ? 'points' : 'XP'}`}
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
                  onDelete={deleteCard} // <-- Pass the deleteCard function as the onDelete prop
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

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 mb-2">💡 Tips:</p>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Click on a card to edit its properties (safety classification, explanation, reward)</li>
          <li>• Drag cards to reorder them</li>
          <li>• Mix safe and unsafe scenarios for variety</li>
          <li>• Explanations are required - they help learners understand mistakes</li>
          <li>• Time Attack mode hides explanations for speed challenge. Timer runs for the entire set of cards.</li>
        </ul>
      </div>
      
      {/* Game Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-900 mb-2">Game Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Total Cards</p>
            <p className="text-2xl font-bold text-blue-700">{initializedConfig.cards.length}</p>
          </div>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <p className="text-sm text-gray-600">Total {isQuizQuestion ? 'Points' : 'XP'}</p>
            <p className="text-2xl font-bold text-blue-700">{totalReward}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ℹ️ Summary of game configuration.
        </p>
      </div>
      
      {/* Image Selector Modal */}
      {showImageSelectorForIndex !== null && (
        <ImageSelector
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelectorForIndex(null)}
          accept="image/*"
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