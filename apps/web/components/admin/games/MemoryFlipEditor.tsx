// apps/web/components/admin/games/MemoryFlipEditor.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';

type MemoryFlipCard = {
  id: string;
  text?: string;
  imageUrl?: string;
};

type MemoryFlipPair = {
  leftId: string;
  rightId: string;
  xp: number;
  points?: number;
};

type MemoryFlipConfig = {
  instruction: string;
  cards: MemoryFlipCard[];
  pairs: MemoryFlipPair[];
  timeLimitSeconds: number;
  perfectGameMultiplier: number;
  totalXp?: number;
  totalPoints?: number;
};

type MemoryFlipEditorProps = {
  config: any;
  onChange: (newConfig: MemoryFlipConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// CONSTANTS
// ============================================================================

const MIN_TIME_LIMIT = 10;
const MAX_TIME_LIMIT = 180;
const DEFAULT_TIME_LIMIT = 60;
const DEFAULT_XP_PER_PAIR = 10;
const DEFAULT_MULTIPLIER = 2;
const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 5;

// ============================================================================
// CARD PREVIEW - Enhanced with better error handling and styling
// ============================================================================

function CardPreview({ card, size = 'md' }: { card: MemoryFlipCard; size?: 'sm' | 'md' | 'lg' }) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const hasContent = card.text || card.imageUrl;
  const hasImage = card.imageUrl && !imageError;
  const isTextOnly = card.text && !hasImage;
  
  if (!hasContent) {
    return (
      <div className={`${sizeClasses[size]} rounded border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center`}>
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center w-full ${isTextOnly ? 'justify-center min-h-[3rem]' : 'gap-1'}`}>
      {card.imageUrl && (
        <div className={`${sizeClasses[size]} rounded border bg-white flex items-center justify-center overflow-hidden`}>
          {imageError ? (
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) : (
            <img
              src={card.imageUrl}
              alt={card.text || 'Card'}
              className="w-full h-full object-contain"
              onError={() => setImageError(true)}
            />
          )}
        </div>
      )}

      {card.text && (
        <span className="text-xs text-center font-medium text-gray-800 w-full line-clamp-2">
          {card.text}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// PAIR ITEM - Enhanced with better visual feedback
// ============================================================================

function PairItem({
  pair,
  index,
  isSelected,
  onSelect,
  cards,
  isQuizQuestion,
  hasValidationError
}: {
  pair: MemoryFlipPair;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  cards: MemoryFlipCard[];
  isQuizQuestion: boolean;
  hasValidationError?: boolean;
}) {
  const leftCard = cards.find(c => c.id === pair.leftId) || { id: '' };
  const rightCard = cards.find(c => c.id === pair.rightId) || { id: '' };

  // Check if cards have content
  const leftEmpty = !leftCard.text?.trim() && !leftCard.imageUrl;
  const rightEmpty = !rightCard.text?.trim() && !rightCard.imageUrl;
  const hasError = leftEmpty || rightEmpty || hasValidationError;

  return (
    <div
      onClick={onSelect}
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected
          ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200'
          : hasError
            ? 'bg-red-50 border-red-300 hover:border-red-400'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-gray-900">Pair {index + 1}</h4>
          {hasError && (
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
          {pair.xp} {isQuizQuestion ? 'pts' : 'XP'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded text-center min-h-[80px] flex items-center justify-center ${leftEmpty ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <CardPreview card={leftCard} />
        </div>
        <div className={`p-4 rounded text-center min-h-[80px] flex items-center justify-center ${rightEmpty ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
          <CardPreview card={rightCard} />
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 flex justify-end">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAIR EDIT MODAL - Enhanced with inline validation
// ============================================================================

function PairEditModal({
  pair,
  index,
  cards,
  isQuizQuestion,
  perfectGameMultiplier,
  onUpdate,
  onDelete,
  onClose,
  onEditCard
}: {
  pair: MemoryFlipPair;
  index: number;
  cards: MemoryFlipCard[];
  isQuizQuestion: boolean;
  perfectGameMultiplier: number;
  onUpdate: (updates: Partial<MemoryFlipPair>) => void;
  onDelete: () => void;
  onClose: () => void;
  onEditCard: (cardId: string) => void;
}) {
  const leftCard = cards.find(c => c.id === pair.leftId) || { id: '' };
  const rightCard = cards.find(c => c.id === pair.rightId) || { id: '' };
  const [localXp, setLocalXp] = useState(pair.xp);

  // Inline validation
  const errors = useMemo(() => {
    const errs: string[] = [];
    if (pair.leftId === pair.rightId) errs.push('Cannot pair a card with itself');
    if (!leftCard.text?.trim() && !leftCard.imageUrl) errs.push('Left card needs text or image');
    if (!rightCard.text?.trim() && !rightCard.imageUrl) errs.push('Right card needs text or image');
    if (localXp <= 0) errs.push('XP must be greater than 0');
    return errs;
  }, [pair.leftId, pair.rightId, leftCard, rightCard, localXp]);

  const handleSave = () => {
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }
    onUpdate({ xp: localXp });
    onClose();
    toast.success('Pair updated');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Pair #{index + 1}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800 mb-1">Please fix these issues:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Pair preview */}
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => onEditCard(pair.leftId)}
              className="border rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-2">Left Card</h4>
              <div className="flex flex-col items-center">
                <CardPreview card={leftCard} size="lg" />
              </div>
            </div>
            <div 
              onClick={() => onEditCard(pair.rightId)}
              className="border rounded-lg p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-colors"
            >
              <h4 className="font-medium text-gray-900 mb-2">Right Card</h4>
              <div className="flex flex-col items-center">
                <CardPreview card={rightCard} size="lg" />
              </div>
            </div>
          </div>

          {/* XP */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {isQuizQuestion ? 'Points' : 'XP'} per correct match <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={localXp}
              onChange={(e) => setLocalXp(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              ✅ Matching these two cards awards <strong>{localXp} {isQuizQuestion ? 'pts' : 'XP'}</strong><br />
              ✅ Perfect game (zero mistakes): <strong>
                {localXp * perfectGameMultiplier} {isQuizQuestion ? 'pts' : 'XP'}
              </strong>
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <button
            onClick={() => {
              if (confirm('Delete this pair? Both cards will be removed.')) {
                onDelete();
                onClose();
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Delete Pair
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={errors.length > 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
// CARD EDIT MODAL - Enhanced with better validation feedback
// ============================================================================

function CardEditModal({
  card,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage
}: {
  card: MemoryFlipCard;
  onUpdate: (updates: Partial<MemoryFlipCard>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
}) {
  const [localText, setLocalText] = useState(card.text || '');
  const [imageError, setImageError] = useState(false);

  const isEmpty = !localText.trim() && !card.imageUrl;

  const handleSave = () => {
    if (isEmpty) {
      toast.error('Card must have text or image');
      return;
    }
    onUpdate({ text: localText.trim() || undefined });
    onClose();
    toast.success('Card updated');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10001]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Card</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warning if empty */}
        {isEmpty && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-amber-700">Card must have either text or an image</p>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Text */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Card Text
            </label>
            <input
              type="text"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Fire Extinguisher"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">
              {card.imageUrl ? 'Optional if image is present' : 'Required if no image'}
            </p>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Image
            </label>
            {card.imageUrl ? (
              <div className="space-y-2">
                <div className="border rounded-md overflow-hidden bg-gray-50">
                  {imageError ? (
                    <div className="p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">Image failed to load</p>
                    </div>
                  ) : (
                    <img
                      src={card.imageUrl}
                      alt="Preview"
                      className="w-full max-h-40 object-contain"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={onSelectImage} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-md hover:bg-blue-100">
                    Change Image
                  </button>
                  <button 
                    onClick={() => {
                      if (localText.trim()) {
                        onRemoveImage();
                      } else {
                        toast.error('Cannot remove image - card must have text or image');
                      }
                    }}
                    className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-gray-600">Add Image</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <button 
            onClick={() => {
              if (confirm('Delete this card? The entire pair will be removed.')) {
                onDelete();
                onClose();
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Delete Card
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isEmpty}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
// MAIN EDITOR
// ============================================================================

export default function MemoryFlipEditor({
  config,
  onChange,
  isQuizQuestion
}: MemoryFlipEditorProps) {
  const initializedConfig: MemoryFlipConfig = {
    instruction: config.instruction || 'Match all the pairs',
    cards: config.cards || [],
    pairs: config.pairs || [],
    timeLimitSeconds: config.timeLimitSeconds || DEFAULT_TIME_LIMIT,
    perfectGameMultiplier: config.perfectGameMultiplier || DEFAULT_MULTIPLIER,
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  };

  const [editingPairIndex, setEditingPairIndex] = useState<number | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  // ============================================================================
  // AUTO-CALC TOTAL XP with proper dependency tracking
  // ============================================================================
  useEffect(() => {
    const total = initializedConfig.pairs.reduce((sum, p) => sum + p.xp, 0);
    const updated = {
      ...initializedConfig,
      ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
    };
    const current = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (current !== total) {
      onChange(updated);
    }
  }, [initializedConfig.pairs, isQuizQuestion]);

  // ============================================================================
  // VALIDATION - Real-time pair validation
  // ============================================================================
  const pairValidation = useMemo(() => {
    return initializedConfig.pairs.map(pair => {
      const leftCard = initializedConfig.cards.find(c => c.id === pair.leftId);
      const rightCard = initializedConfig.cards.find(c => c.id === pair.rightId);
      const leftEmpty = !leftCard?.text?.trim() && !leftCard?.imageUrl;
      const rightEmpty = !rightCard?.text?.trim() && !rightCard?.imageUrl;
      return leftEmpty || rightEmpty || pair.leftId === pair.rightId;
    });
  }, [initializedConfig.pairs, initializedConfig.cards]);

  const hasAnyValidationError = pairValidation.some(error => error);

  // ============================================================================
  // ACTIONS
  // ============================================================================

  const getCardById = (id: string) => initializedConfig.cards.find(c => c.id === id);

  const updateCard = (cardId: string, updates: Partial<MemoryFlipCard>) => {
    const newCards = initializedConfig.cards.map(c => c.id === cardId ? { ...c, ...updates } : c);
    onChange({ ...initializedConfig, cards: newCards });
  };

  const updatePair = (index: number, updates: Partial<MemoryFlipPair>) => {
    const newPairs = [...initializedConfig.pairs];
    newPairs[index] = { ...newPairs[index], ...updates };
    onChange({ ...initializedConfig, pairs: newPairs });
  };

  const addPair = () => {
    const timestamp = Date.now();
    const id1 = `card_${timestamp}_1`;
    const id2 = `card_${timestamp}_2`;
    
    const newCards = [
      ...initializedConfig.cards,
      { id: id1, text: '' },
      { id: id2, text: '' }
    ];
    
    const newPair: MemoryFlipPair = { 
      leftId: id1, 
      rightId: id2, 
      xp: DEFAULT_XP_PER_PAIR 
    };
    
    onChange({
      ...initializedConfig,
      cards: newCards,
      pairs: [...initializedConfig.pairs, newPair]
    });
    
    // Open modal immediately for editing
    setEditingPairIndex(initializedConfig.pairs.length);
    toast.success('New pair added - click Card to add content');
  };

  const deletePair = (index: number) => {
    const pair = initializedConfig.pairs[index];
    const newCards = initializedConfig.cards.filter(c => c.id !== pair.leftId && c.id !== pair.rightId);
    const newPairs = initializedConfig.pairs.filter((_, i) => i !== index);
    onChange({ ...initializedConfig, cards: newCards, pairs: newPairs });
    setEditingPairIndex(null);
    toast.success('Pair deleted');
  };

  const handleImageSelect = (url: string) => {
    if (pendingCardId) {
      updateCard(pendingCardId, { imageUrl: url });
      setPendingCardId(null);
    }
    setShowImageSelector(false);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const totalReward = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
  const multiplier = initializedConfig.perfectGameMultiplier;
  const perfectReward = totalReward ? totalReward * multiplier : 0;

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Instruction <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.instruction}
          onChange={(e) => onChange({ ...initializedConfig, instruction: e.target.value })}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="e.g., Match each hazard with its safety control"
        />
      </div>

      {/* Scoring & Timing Rules */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Scoring & Time Rules
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Time Limit (seconds) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={MIN_TIME_LIMIT}
              max={MAX_TIME_LIMIT}
              value={initializedConfig.timeLimitSeconds}
              onChange={(e) => onChange({
                ...initializedConfig,
                timeLimitSeconds: Math.max(MIN_TIME_LIMIT, Math.min(MAX_TIME_LIMIT, parseInt(e.target.value) || DEFAULT_TIME_LIMIT))
              })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-700 mt-2 flex items-start gap-1">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>Game ends automatically. Players earn 0 {isQuizQuestion ? 'pts' : 'XP'} if time runs out.</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Perfect Game Bonus Multiplier
            </label>
            <input
              type="number"
              min={MIN_MULTIPLIER}
              max={MAX_MULTIPLIER}
              step="0.5"
              value={multiplier}
              onChange={(e) => onChange({
                ...initializedConfig,
                perfectGameMultiplier: Math.max(MIN_MULTIPLIER, Math.min(MAX_MULTIPLIER, parseFloat(e.target.value) || DEFAULT_MULTIPLIER))
              })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-blue-700 mt-2 flex items-start gap-1">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span>Players get <strong>{multiplier}×</strong> {isQuizQuestion ? 'points' : 'XP'} for completing with zero mistakes</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reward Summary with visual emphasis */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700 mb-1">Base Reward</p>
          <p className="text-3xl font-bold text-blue-600">{totalReward || 0}</p>
          <p className="text-xs text-blue-600 mt-1">{isQuizQuestion ? 'points' : 'XP'} (with mistakes)</p>
        </div>
        <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 mb-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Perfect Game Reward
          </p>
          <p className="text-3xl font-bold text-orange-600">{perfectReward}</p>
          <p className="text-xs text-orange-600 mt-1">{isQuizQuestion ? 'points' : 'XP'} (zero mistakes)</p>
        </div>
      </div>

      {/* Pairs List */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium">
            Card Pairs ({initializedConfig.pairs.length})
          </label>
          <button onClick={addPair} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors shadow-sm">
            + Add Pair
          </button>
        </div>

        {/* Validation Warning */}
        {hasAnyValidationError && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-amber-800">Some pairs need attention</p>
                <p className="text-xs text-amber-700 mt-1">Make sure each card has either text or an image</p>
              </div>
            </div>
          </div>
        )}

        {initializedConfig.pairs.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 bg-gray-50 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 text-sm mb-4">No pairs added yet</p>
            <button onClick={addPair} className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-md">
              Add Your First Pair
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {initializedConfig.pairs.map((pair, idx) => (
              <PairItem
                key={idx}
                pair={pair}
                index={idx}
                isSelected={editingPairIndex === idx}
                onSelect={() => setEditingPairIndex(idx)}
                cards={initializedConfig.cards}
                isQuizQuestion={isQuizQuestion}
                hasValidationError={pairValidation[idx]}
              />
            ))}
          </div>
        )}

        {initializedConfig.pairs.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-sm text-gray-700 font-medium mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Tips
            </p>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span><strong>Click a pair</strong> to edit cards or change XP value</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Cards can have <strong>image only</strong>, <strong>text only</strong>, or <strong>both</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 mt-0.5">•</span>
                <span>Each pair must have two distinct cards with unique content</span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Enhanced Game Summary */}
      <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
          Game Summary
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Total Cards</p>
            <p className="text-2xl font-bold text-gray-900">{initializedConfig.cards.length}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Pairs</p>
            <p className="text-2xl font-bold text-gray-900">{initializedConfig.pairs.length}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Time Limit</p>
            <p className="text-2xl font-bold text-gray-900">{initializedConfig.timeLimitSeconds}s</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 mb-1">Max Reward</p>
            <p className="text-2xl font-bold text-blue-600">{perfectReward}</p>
            <p className="text-xs text-gray-500">×{multiplier} bonus</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {editingPairIndex !== null && (
        <PairEditModal
          pair={initializedConfig.pairs[editingPairIndex]}
          index={editingPairIndex}
          cards={initializedConfig.cards}
          isQuizQuestion={isQuizQuestion}
          perfectGameMultiplier={initializedConfig.perfectGameMultiplier}
          onUpdate={(u) => updatePair(editingPairIndex, u)}
          onDelete={() => deletePair(editingPairIndex)}
          onClose={() => setEditingPairIndex(null)}
          onEditCard={(cardId) => {
            setEditingPairIndex(null);
            setEditingCardId(cardId);
          }}
        />
      )}

      {editingCardId && (
        <CardEditModal
          card={getCardById(editingCardId) || { id: editingCardId }}
          onUpdate={(u) => updateCard(editingCardId, u)}
          onDelete={() => {
            const pairIndex = initializedConfig.pairs.findIndex(p => 
              p.leftId === editingCardId || p.rightId === editingCardId
            );
            if (pairIndex !== -1) deletePair(pairIndex);
            setEditingCardId(null);
          }}
          onClose={() => setEditingCardId(null)}
          onSelectImage={() => {
            setPendingCardId(editingCardId);
            setShowImageSelector(true);
          }}
          onRemoveImage={() => {
            updateCard(editingCardId, { imageUrl: undefined });
          }}
        />
      )}

      {showImageSelector && (
        <div className="fixed inset-0 z-[10002]">
          <MediaSelector
            accept="image/*"
            onSelect={handleImageSelect}
            onClose={() => {
              setShowImageSelector(false);
              setPendingCardId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}