// apps/web/components/admin/games/MemoryFlipEditor.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';

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
// CARD PREVIEW
// ============================================================================

function CardPreview({ card, size = 'md' }: { card: MemoryFlipCard; size?: 'sm' | 'md' | 'lg' }) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const hasContent = card.text || card.imageUrl;
  const hasImage = card.imageUrl && !imageError;
  const isTextOnly = card.text && !hasImage;
  
  if (!hasContent) {
    return (
      <div className={`${sizeClasses[size]} rounded border-2 border-dashed border-border bg-surface flex items-center justify-center`}>
        <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <svg className="w-5 h-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <span className="text-xs text-center font-medium text-text-primary w-full line-clamp-2">
          {card.text}
        </span>
      )}
    </div>
  );
}

// ============================================================================
// PAIR ITEM
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

  const leftEmpty = !leftCard.text?.trim() && !leftCard.imageUrl;
  const rightEmpty = !rightCard.text?.trim() && !rightCard.imageUrl;
  const hasError = leftEmpty || rightEmpty || hasValidationError;

  return (
    <div
      onClick={onSelect}
      className={`
        border-2 rounded-lg p-4 cursor-pointer transition-all
        ${isSelected
          ? 'bg-primary-surface border-primary shadow-md ring-2 ring-primary-light'
          : hasError
            ? 'bg-danger-light border-danger hover:border-danger-dark'
            : 'bg-white border-border hover:border-primary-light hover:shadow-sm'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-text-primary">Pair {index + 1}</h4>
          {hasError && (
            <svg className="w-4 h-4 text-danger" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className="px-2 py-1 bg-primary-light text-primary-dark text-xs rounded font-medium">
          {pair.xp} {isQuizQuestion ? 'pts' : 'XP'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={`p-4 rounded text-center min-h-[80px] flex items-center justify-center ${leftEmpty ? 'bg-danger-light border border-danger' : 'bg-surface'}`}>
          <CardPreview card={leftCard} />
        </div>
        <div className={`p-4 rounded text-center min-h-[80px] flex items-center justify-center ${rightEmpty ? 'bg-danger-light border border-danger' : 'bg-surface'}`}>
          <CardPreview card={rightCard} />
        </div>
      </div>

      {isSelected && (
        <div className="mt-3 flex justify-end">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PAIR EDIT MODAL
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
  const [showErrors, setShowErrors] = useState(false);

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
      setShowErrors(true);
      errors.forEach(err => toast.error(err));
      return;
    }
    onUpdate({ xp: localXp });
    onClose();
    toast.success('Pair updated');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-heading-4 text-text-primary">Edit Pair #{index + 1}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {showErrors && errors.length > 0 && (
          <div className="mb-4 p-3 bg-danger-light border border-danger rounded-lg mx-6 mt-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-danger-dark mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-danger-dark mb-1">Please fix these issues:</p>
                <ul className="text-sm text-danger mt-1 space-y-1">
                  {errors.map((err, idx) => (
                    <li key={idx}>• {err}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div 
              onClick={() => onEditCard(pair.leftId)}
              className="border rounded-lg p-3 bg-surface cursor-pointer hover:bg-primary-surface hover:border-primary-light transition-colors"
            >
              <h4 className="font-medium text-text-primary mb-2">Left Card</h4>
              <div className="flex flex-col items-center">
                <CardPreview card={leftCard} size="lg" />
              </div>
            </div>
            <div 
              onClick={() => onEditCard(pair.rightId)}
              className="border rounded-lg p-3 bg-surface cursor-pointer hover:bg-primary-surface hover:border-primary-light transition-colors"
            >
              <h4 className="font-medium text-text-primary mb-2">Right Card</h4>
              <div className="flex flex-col items-center">
                <CardPreview card={rightCard} size="lg" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {isQuizQuestion ? 'Points' : 'XP'} per correct match <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={localXp}
              onChange={(e) => setLocalXp(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full"
            />
          </div>

          <div className="p-3 bg-primary-surface border border-primary-light rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-text-secondary">Match reward:</span>
                <span className="font-semibold text-primary">{localXp} {isQuizQuestion ? 'pts' : 'XP'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-text-secondary">Perfect:</span>
                <span className="font-semibold text-warning">{localXp * perfectGameMultiplier} {isQuizQuestion ? 'pts' : 'XP'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => {
              if (confirm('Delete this pair? Both cards will be removed.')) {
                onDelete();
                onClose();
              }
            }}
            className="btn btn-danger px-4 py-2 text-sm"
          >
            Delete Pair
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary px-4 py-2">
              Cancel
            </button>
            <button 
              onClick={handleSave} 
              disabled={errors.length > 0}
              className="btn btn-primary px-4 py-2 disabled:opacity-50"
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
// CARD EDIT MODAL
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
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-heading-4 text-text-primary">Edit Card</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isEmpty && (
          <div className="mb-4 p-3 bg-alert-light border border-alert rounded-lg mx-6 mt-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-alert-dark mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-alert-dark">Card must have either text or an image</p>
            </div>
          </div>
        )}

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Card Text
            </label>
            <input
              type="text"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              className="w-full"
              placeholder="e.g., Fire Extinguisher"
              autoFocus
            />
            <p className="text-xs text-text-muted mt-1.5">
              {card.imageUrl ? 'Optional if image is present' : 'Required if no image'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Image
            </label>
            {card.imageUrl ? (
              <div className="space-y-2">
                <div className="border rounded-lg overflow-hidden bg-surface">
                  {imageError ? (
                    <div className="p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-text-secondary">Image failed to load</p>
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
                  <button onClick={onSelectImage} className="flex-1 btn btn-primary text-sm">
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
                    className="btn btn-danger text-sm px-3 py-2"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-primary-surface hover:border-primary-light transition-colors"
              >
                <svg className="mx-auto h-8 w-8 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-text-secondary">Add Image</span>
              </button>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => {
              if (confirm('Delete this card? The entire pair will be removed.')) {
                onDelete();
                onClose();
              }
            }}
            className="btn btn-danger px-4 py-2 text-sm"
          >
            Delete Card
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn btn-secondary px-4 py-2">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isEmpty}
              className="btn btn-primary px-4 py-2 disabled:opacity-50"
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

  const [localInstruction, setLocalInstruction] = useState(initializedConfig.instruction);
  const [localTimeLimit, setLocalTimeLimit] = useState(initializedConfig.timeLimitSeconds);
  const [localMultiplier, setLocalMultiplier] = useState(initializedConfig.perfectGameMultiplier);
  const [editingPairIndex, setEditingPairIndex] = useState<number | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);

  useEffect(() => {
    setLocalInstruction(config.instruction || 'Match all the pairs');
  }, [config.instruction]);

  useEffect(() => {
    setLocalTimeLimit(config.timeLimitSeconds || DEFAULT_TIME_LIMIT);
  }, [config.timeLimitSeconds]);

  useEffect(() => {
    setLocalMultiplier(config.perfectGameMultiplier || DEFAULT_MULTIPLIER);
  }, [config.perfectGameMultiplier]);

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

  const handleTimeLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalTimeLimit(Number(e.target.value));
  };

  const handleTimeLimitMouseUp = () => {
    if (localTimeLimit !== initializedConfig.timeLimitSeconds) {
      onChange({
        ...initializedConfig,
        timeLimitSeconds: localTimeLimit
      });
    }
  };

  const handleMultiplierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalMultiplier(Number(e.target.value));
  };

  const handleMultiplierMouseUp = () => {
    if (localMultiplier !== initializedConfig.perfectGameMultiplier) {
      onChange({
        ...initializedConfig,
        perfectGameMultiplier: localMultiplier
      });
    }
  };

  const totalReward = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
  const multiplier = initializedConfig.perfectGameMultiplier;
  const perfectReward = totalReward ? totalReward * multiplier : 0;

  return (
    <div className="space-y-6">
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
          placeholder="e.g., Match each hazard with its safety control"
        />

        <InfoTooltip title="💡 Memory Flip Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Click a pair</strong> to edit cards, change XP value, or delete</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Cards</strong> can have image only, text only, or both</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Perfect game bonus</strong> rewards players who match all pairs with zero mistakes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Time pressure</strong> adds challenge — players must complete before time expires</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold flex-shrink-0">•</span>
              <span><strong>Each pair</strong> must have two distinct cards with unique content</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Time Limit (seconds) <span className="text-danger">*</span>
          </label>
          <div className="p-4 bg-primary-surface border-2 border-primary-light rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-dark">Duration</span>
              <span className="text-2xl font-bold text-primary-dark">
                {localTimeLimit}s
              </span>
            </div>
            <input
              type="range"
              min={MIN_TIME_LIMIT}
              max={MAX_TIME_LIMIT}
              step="5"
              value={localTimeLimit}
              onChange={handleTimeLimitChange}
              onMouseUp={handleTimeLimitMouseUp}
              onTouchEnd={handleTimeLimitMouseUp}
              className="w-full h-2 bg-primary-light rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1.5">
              <span>{MIN_TIME_LIMIT}s</span>
              <span className="font-medium text-primary-dark">{localTimeLimit}s</span>
              <span>{MAX_TIME_LIMIT}s</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1.5">
            Perfect Game Bonus Multiplier
          </label>
          <div className="p-4 bg-primary-surface border-2 border-primary-light rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-primary-dark">Multiplier</span>
              <span className="text-2xl font-bold text-primary-dark">
                {localMultiplier}×
              </span>
            </div>
            <input
              type="range"
              min={MIN_MULTIPLIER}
              max={MAX_MULTIPLIER}
              step="0.5"
              value={localMultiplier}
              onChange={handleMultiplierChange}
              onMouseUp={handleMultiplierMouseUp}
              onTouchEnd={handleMultiplierMouseUp}
              className="w-full h-2 bg-primary-light rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1.5">
              <span>{MIN_MULTIPLIER}×</span>
              <span className="font-medium text-primary-dark">{localMultiplier}×</span>
              <span>{MAX_MULTIPLIER}×</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border-2 border-border rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-lg font-semibold text-text-primary">
            Card Pairs ({initializedConfig.pairs.length})
          </label>
          <button onClick={addPair} className="btn btn-primary text-sm px-4 py-2">
            + Add Pair
          </button>
        </div>

        {hasAnyValidationError && (
          <div className="mb-3 p-3 bg-alert-light border border-alert rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-alert-dark mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-alert-dark">Some pairs need attention</p>
                <p className="text-xs text-alert-dark mt-1">Make sure each card has either text or an image</p>
              </div>
            </div>
          </div>
        )}

        {initializedConfig.pairs.length === 0 ? (
          <div className="border-2 border-dashed border-border rounded-lg p-12 bg-surface text-center">
            <svg className="mx-auto h-12 w-12 text-text-muted mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-text-secondary text-sm mb-4">No pairs added yet</p>
            <button onClick={addPair} className="btn btn-primary px-6 py-3">
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
      </div>

      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.pairs.length === 0}
        emptyMessage="⚠️ Add card pairs to calculate rewards and finalize the game."
        items={[
          {
            label: 'Total Cards',
            value: initializedConfig.cards.length
          },
          {
            label: 'Card Pairs',
            value: initializedConfig.pairs.length
          },
          {
            label: 'Time Limit',
            value: `${initializedConfig.timeLimitSeconds}s`,
            icon: (
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: 'Bonus Multiplier',
            value: `${multiplier}×`
          },
          {
            label: `Base ${isQuizQuestion ? 'Points' : 'XP'}`,
            value: totalReward || 0
          },
          {
            label: `Perfect Game ${isQuizQuestion ? 'Points' : 'XP'}`,
            value: perfectReward,
            highlight: true
          }
        ]}
      />

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