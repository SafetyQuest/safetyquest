// apps/web/components/admin/games/MatchingEditor.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import ImageSelector from '../ImageSelector';

// ============================================================================
// TYPES (Aligned with games.ts v2)
// ============================================================================

type MatchingItem = {
  id: string;
  text: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type MatchingPair = {
  leftId: string;
  rightId: string;
};

type MatchingConfig = {
  instruction: string;
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  pairs: MatchingPair[];
  totalXp?: number;
  totalPoints?: number;
};

type MatchingEditorProps = {
  config: any;
  onChange: (newConfig: MatchingConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// LEGACY CONFIG UPGRADE
// ============================================================================

const upgradeLegacyConfig = (config: any): MatchingConfig => {
  if (
    config.pairs &&
    Array.isArray(config.pairs) &&
    config.pairs.length > 0 &&
    config.pairs[0]?.leftText !== undefined
  ) {
    const leftItems: MatchingItem[] = [];
    const rightItems: MatchingItem[] = [];
    const pairs: MatchingPair[] = [];
    
    const leftMap = new Map<string, MatchingItem>();
    const rightMap = new Map<string, MatchingItem>();
    
    config.pairs.forEach((pair: any) => {
      if (!leftMap.has(pair.leftText)) {
        const leftId = `left_${Date.now()}_${leftMap.size}`;
        leftMap.set(pair.leftText, {
          id: leftId,
          text: pair.leftText,
          imageUrl: pair.leftImageUrl,
          xp: Math.floor((config.xp || 0) / config.pairs.length),
          points: Math.floor((config.points || 0) / config.pairs.length),
        });
      }
      
      if (!rightMap.has(pair.rightText)) {
        const rightId = `right_${Date.now()}_${rightMap.size}`;
        rightMap.set(pair.rightText, {
          id: rightId,
          text: pair.rightText,
          imageUrl: pair.rightImageUrl,
          xp: 0,
          points: 0,
        });
      }
      
      const leftId = leftMap.get(pair.leftText)!.id;
      const rightId = rightMap.get(pair.rightText)!.id;
      pairs.push({ leftId, rightId });
    });
    
    return {
      instruction: config.instruction || 'Match the items on the left with their corresponding items on the right',
      leftItems: Array.from(leftMap.values()),
      rightItems: Array.from(rightMap.values()),
      pairs,
      totalXp: config.xp || config.totalXp,
      totalPoints: config.points || config.totalPoints,
    };
  }
  
  return {
    instruction: config.instruction || 'Match the items on the left with their corresponding items on the right',
    leftItems: config.leftItems || [],
    rightItems: config.rightItems || [],
    pairs: config.pairs || [],
    totalXp: config.totalXp,
    totalPoints: config.totalPoints,
  };
};

// ============================================================================
// SORTABLE LEFT ITEM
// ============================================================================

function SortableLeftItem({
  item,
  isEditing,
  onClick,
  isQuizQuestion,
  pairedRightItem,
}: {
  item: MatchingItem;
  isEditing: boolean;
  onClick: () => void;
  isQuizQuestion: boolean;
  pairedRightItem: MatchingItem | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id, data: { type: 'left' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [imageError, setImageError] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        border-2 rounded-lg p-3 cursor-pointer transition-all
        ${isEditing 
          ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
        ${isDragging ? 'scale-105 shadow-lg' : ''}
        ${pairedRightItem ? 'border-l-4 border-l-green-500' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Image */}
        {item.imageUrl && !imageError ? (
          <img 
            src={item.imageUrl} 
            alt={item.text}
            className="w-12 h-12 rounded border object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : item.imageUrl && imageError ? (
          <div className="w-12 h-12 rounded border border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm break-words">{item.text}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isQuizQuestion ? (item.points || 0) : (item.xp || 0)} {isQuizQuestion ? 'pts' : 'XP'}
            {item.imageUrl && !imageError && ' • Has image'}
          </p>
        </div>

        {/* Editing indicator */}
        {isEditing && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Pair indicator */}
      {pairedRightItem && (
        <div className="ml-4 mt-2 text-xs text-gray-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>→ {pairedRightItem.text}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SORTABLE RIGHT ITEM
// ============================================================================

function SortableRightItem({
  item,
  isEditing,
  onClick,
  isDragActive,
  pairedLeftItem,
}: {
  item: MatchingItem;
  isEditing: boolean;
  onClick: () => void;
  isDragActive: boolean;
  pairedLeftItem: MatchingItem | null;
}) {
  const {
    setNodeRef,
    isOver
  } = useSortable({ id: item.id, data: { type: 'right' } });

  const [imageError, setImageError] = useState(false);

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`
        relative border-2 rounded-lg p-3 min-h-[80px] cursor-pointer transition-all
        ${isEditing 
          ? 'bg-green-50 border-green-500 shadow-md ring-2 ring-green-200' 
          : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'}
        ${isOver && isDragActive ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg' : ''}
        ${pairedLeftItem ? 'border-l-4 border-l-green-500' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {/* Image */}
        {item.imageUrl && !imageError ? (
          <img
            src={item.imageUrl}
            alt={item.text}
            className="w-12 h-12 rounded border object-cover flex-shrink-0"
            onError={() => setImageError(true)}
          />
        ) : item.imageUrl && imageError ? (
          <div className="w-12 h-12 rounded border border-gray-300 bg-gray-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : null}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm break-words">{item.text}</p>
          {(isOver && isDragActive) && (
            <p className="text-xs text-blue-600 mt-1 font-medium">Drop to create pair</p>
          )}
        </div>

        {/* Editing indicator */}
        {isEditing && (
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse flex-shrink-0 mt-1"></div>
        )}
      </div>

      {/* Pair indicator */}
      {pairedLeftItem && (
        <div className="ml-4 mt-2 text-xs text-gray-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>← {pairedLeftItem.text}</span>
        </div>
      )}

      {/* Drop overlay */}
      {isDragActive && isOver && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none bg-blue-50/70 flex items-center justify-center">
          <div className="flex items-center gap-2 text-blue-700 font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Drop here</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ITEM EDIT MODAL (WITH PAIRING DROPDOWN)
// ============================================================================

function ItemEditModal({
  item,
  index,
  side,
  isQuizQuestion,
  availableItems,
  currentPairedId,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage,
  onPairChange
}: {
  item: MatchingItem;
  index: number;
  side: 'left' | 'right';
  isQuizQuestion: boolean;
  availableItems: MatchingItem[];
  currentPairedId: string | null;
  onUpdate: (updates: Partial<MatchingItem>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
  onPairChange: (targetId: string | null) => void;
}) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit {side === 'left' ? 'Left' : 'Right'} Item {index + 1}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Text */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Text <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={item.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder={side === 'left' ? 'e.g., Fire Hazard Sign' : 'e.g., Flammable Materials Present'}
              autoFocus
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Image (Optional)
            </label>
            {item.imageUrl && !imageError ? (
              <div className="relative inline-block">
                <img
                  src={item.imageUrl}
                  alt={item.text}
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  onError={() => setImageError(true)}
                />
                <button
                  onClick={onRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 shadow-lg"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
              >
                <svg className="mx-auto h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600">
                  {imageError ? 'Image failed to load. Click to select another' : 'Click to add an image'}
                </p>
              </button>
            )}
          </div>

          {/* Reward (only for left items) */}
          {side === 'left' && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={isQuizQuestion ? item.points : item.xp}
                onChange={(e) => onUpdate(
                  isQuizQuestion
                    ? { points: parseInt(e.target.value) || 0 }
                    : { xp: parseInt(e.target.value) || 0 }
                )}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* PAIRING DROPDOWN */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Pair with {side === 'left' ? 'Right' : 'Left'} Item
            </label>
            <select
              value={currentPairedId || ''}
              onChange={(e) => onPairChange(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="">-- Not paired --</option>
              {availableItems.map((availableItem) => (
                <option key={availableItem.id} value={availableItem.id}>
                  {availableItem.text}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a {side === 'left' ? 'right' : 'left'} item to create a pair, or select "Not paired" to remove the pair
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex justify-between border-t">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
          >
            Delete Item
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MatchingEditor({
  config,
  onChange,
  isQuizQuestion
}: MatchingEditorProps) {
  const initializedConfigRef = useRef(upgradeLegacyConfig(config));
  const [localConfig, setLocalConfig] = useState<MatchingConfig>(
    initializedConfigRef.current
  );

  const [editingItem, setEditingItem] = useState<{
    index: number;
    side: 'left' | 'right';
  } | null>(null);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [pendingImageUpdate, setPendingImageUpdate] = useState<{
    index: number;
    side: 'left' | 'right';
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================

  useEffect(() => {
    const total = localConfig.leftItems.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);

    const updatedConfig = {
      ...localConfig,
      ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
    };

    const currentTotal = isQuizQuestion ? localConfig.totalPoints : localConfig.totalXp;
    if (currentTotal !== total) {
      setLocalConfig(updatedConfig);
      onChange(updatedConfig);
    }
  }, [localConfig.leftItems, isQuizQuestion]);

  // ============================================================================
  // INSTRUCTION HANDLER
  // ============================================================================

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const updated = { ...localConfig, instruction: e.target.value };
    setLocalConfig(updated);
    onChange(updated);
  };

  // ============================================================================
  // ITEM MANAGEMENT
  // ============================================================================

  const addLeftItem = () => {
    const newItem: MatchingItem = {
      id: `left_${Date.now()}`,
      text: '',
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };

    const updated = {
      ...localConfig,
      leftItems: [...localConfig.leftItems, newItem]
    };

    setLocalConfig(updated);
    onChange(updated);

    setEditingItem({
      index: localConfig.leftItems.length,
      side: 'left'
    });
  };

  const addRightItem = () => {
    const newItem: MatchingItem = {
      id: `right_${Date.now()}`,
      text: '',
      ...(isQuizQuestion ? { points: 0 } : { xp: 0 })
    };

    const updated = {
      ...localConfig,
      rightItems: [...localConfig.rightItems, newItem]
    };

    setLocalConfig(updated);
    onChange(updated);

    setEditingItem({
      index: localConfig.rightItems.length,
      side: 'right'
    });
  };

  const updateItem = (side: 'left' | 'right', index: number, updates: Partial<MatchingItem>) => {
    const items = side === 'left' ? localConfig.leftItems : localConfig.rightItems;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };

    const updated = {
      ...localConfig,
      [side === 'left' ? 'leftItems' : 'rightItems']: newItems
    };

    setLocalConfig(updated);
    onChange(updated);
  };

  const deleteItem = (side: 'left' | 'right', index: number) => {
    const items = side === 'left' ? localConfig.leftItems : localConfig.rightItems;
    const itemId = items[index].id;
    const newItems = items.filter((_, i) => i !== index);

    const newPairs = localConfig.pairs.filter(p =>
      side === 'left' ? p.leftId !== itemId : p.rightId !== itemId
    );

    const updated = {
      ...localConfig,
      [side === 'left' ? 'leftItems' : 'rightItems']: newItems,
      pairs: newPairs
    };

    setLocalConfig(updated);
    onChange(updated);
    setEditingItem(null);

    toast.success('Item deleted and associated pairs removed');
  };

  // ============================================================================
  // PAIR MANAGEMENT
  // ============================================================================

  const handlePairChange = (itemId: string, side: 'left' | 'right', targetId: string | null) => {
    // Remove any existing pairs for this item
    let newPairs = localConfig.pairs.filter(p =>
      side === 'left' ? p.leftId !== itemId : p.rightId !== itemId
    );

    // If targetId is provided, add new pair
    if (targetId) {
      // Check if target is already paired
      const targetAlreadyPaired = newPairs.find(p =>
        side === 'left' ? p.rightId === targetId : p.leftId === targetId
      );

      if (targetAlreadyPaired) {
        toast.error('That item is already paired with another item. Remove its pair first.', {
          duration: 3000,
        });
        return;
      }

      const leftId = side === 'left' ? itemId : targetId;
      const rightId = side === 'right' ? itemId : targetId;
      newPairs = [...newPairs, { leftId, rightId }];
      
      toast.success('Pair created!', { duration: 1500 });
    } else {
      toast('Pair removed', { icon: '❌', duration: 1500 });
    }

    const updated = { ...localConfig, pairs: newPairs };
    setLocalConfig(updated);
    onChange(updated);
  };

  // ============================================================================
  // DRAG & DROP HANDLERS
  // ============================================================================

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;
    
    const leftId = active.id.toString();
    const rightId = over.id.toString();

    if (!leftId.startsWith('left_') || !rightId.startsWith('right_')) return;

    // Check if pair exists
    const existingPairIndex = localConfig.pairs.findIndex(
      p => p.leftId === leftId && p.rightId === rightId
    );

    if (existingPairIndex !== -1) {
      // Remove existing pair
      const newPairs = localConfig.pairs.filter((_, i) => i !== existingPairIndex);
      
      const updated = { ...localConfig, pairs: newPairs };
      setLocalConfig(updated);
      onChange(updated);
      
      toast('Pair removed', { icon: '❌', duration: 1500 });
    } else {
      // Check for conflicts
      const leftAlreadyPaired = localConfig.pairs.find(p => p.leftId === leftId);
      const rightAlreadyPaired = localConfig.pairs.find(p => p.rightId === rightId);

      if (leftAlreadyPaired) {
        toast.error('This left item is already paired. Remove existing pair first.', {
          duration: 3000,
        });
        return;
      }

      if (rightAlreadyPaired) {
        toast.error('This right item is already paired. Remove existing pair first.', {
          duration: 3000,
        });
        return;
      }

      // Add new pair
      const newPairs = [...localConfig.pairs, { leftId, rightId }];
      
      const updated = { ...localConfig, pairs: newPairs };
      setLocalConfig(updated);
      onChange(updated);

      const leftItem = localConfig.leftItems.find(i => i.id === leftId);
      const rightItem = localConfig.rightItems.find(i => i.id === rightId);
      
      toast.success(`Paired: ${leftItem?.text} ↔ ${rightItem?.text}`, {
        duration: 2000,
      });
    }
  };

  // ============================================================================
  // IMAGE HANDLING
  // ============================================================================

  const handleSelectImage = (index: number, side: 'left' | 'right') => {
    setPendingImageUpdate({ index, side });
    setShowImageSelector(true);
  };

  const handleImageSelect = (url: string) => {
    if (!pendingImageUpdate) return;

    const { index, side } = pendingImageUpdate;
    updateItem(side, index, { imageUrl: url });

    setShowImageSelector(false);
    setPendingImageUpdate(null);
    toast.success('Image added successfully');
  };

  const handleRemoveImage = (index: number, side: 'left' | 'right') => {
    updateItem(side, index, { imageUrl: undefined });
    toast.success('Image removed');
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getPairedItem = (itemId: string, sourceSide: 'left' | 'right'): MatchingItem | null => {
    const pair = localConfig.pairs.find(p =>
      sourceSide === 'left' ? p.leftId === itemId : p.rightId === itemId
    );

    if (!pair) return null;

    const targetId = sourceSide === 'left' ? pair.rightId : pair.leftId;
    const targetItems = sourceSide === 'left' ? localConfig.rightItems : localConfig.leftItems;

    return targetItems.find(item => item.id === targetId) || null;
  };

  const getCurrentPairedId = (itemId: string, side: 'left' | 'right'): string | null => {
    const pair = localConfig.pairs.find(p =>
      side === 'left' ? p.leftId === itemId : p.rightId === itemId
    );
    return pair ? (side === 'left' ? pair.rightId : pair.leftId) : null;
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const totalReward = isQuizQuestion
    ? localConfig.totalPoints || 0
    : localConfig.totalXp || 0;

  const unpairedLeft = localConfig.leftItems.filter(
    item => !localConfig.pairs.some(p => p.leftId === item.id)
  ).length;

  const unpairedRight = localConfig.rightItems.filter(
    item => !localConfig.pairs.some(p => p.rightId === item.id)
  ).length;

  const activeItem = localConfig.leftItems.find(i => i.id === activeId);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Instruction */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Instruction / Question
        </label>
        <textarea
          value={localConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="e.g., Match each safety sign with its meaning"
        />
      </div>

      {/* Instructions banner */}
      <div className="mb-4 p-3 bg-blue-50 rounded-md border border-blue-200">
        <p className="text-sm text-blue-900 font-medium mb-1">💡 How to pair items:</p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• <strong>Click item</strong> → Edit modal opens → Select from dropdown</li>
          <li>• <strong>Drag & drop:</strong> Drag a left item and drop on a right item</li>
          <li>• <strong>To unpair:</strong> Drag & drop again on same item, or select "Not paired" in dropdown</li>
        </ul>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                Left Items ({localConfig.leftItems.length})
                {totalReward > 0 && (
                  <span className="ml-2 text-xs text-gray-500">
                    • {totalReward} {isQuizQuestion ? 'pts' : 'XP'} total
                  </span>
                )}
              </label>
              <button
                onClick={addLeftItem}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Left
              </button>
            </div>

            {localConfig.leftItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm mb-3">No left items added yet</p>
                <button
                  onClick={addLeftItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First Left Item
                </button>
              </div>
            ) : (
              <SortableContext
                items={localConfig.leftItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localConfig.leftItems.map((item, index) => (
                    <SortableLeftItem
                      key={item.id}
                      item={item}
                      isEditing={editingItem?.side === 'left' && editingItem.index === index}
                      onClick={() => setEditingItem({ index, side: 'left' })}
                      isQuizQuestion={isQuizQuestion}
                      pairedRightItem={getPairedItem(item.id, 'left')}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          {/* Right Items */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                Right Items ({localConfig.rightItems.length})
              </label>
              <button
                onClick={addRightItem}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                + Add Right
              </button>
            </div>

            {localConfig.rightItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm mb-3">No right items added yet</p>
                <button
                  onClick={addRightItem}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add First Right Item
                </button>
              </div>
            ) : (
              <SortableContext
                items={localConfig.rightItems.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localConfig.rightItems.map((item, index) => (
                    <SortableRightItem
                      key={item.id}
                      item={item}
                      isEditing={editingItem?.side === 'right' && editingItem.index === index}
                      onClick={() => setEditingItem({ index, side: 'right' })}
                      isDragActive={!!activeId}
                      pairedLeftItem={getPairedItem(item.id, 'right')}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem && (
            <div className="bg-white border-2 border-blue-500 rounded-lg p-4 shadow-2xl max-w-xs">
              <div className="flex items-center gap-3">
                {activeItem.imageUrl && (
                  <div className="w-10 h-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img 
                      src={activeItem.imageUrl} 
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{activeItem.text}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Drop on right item to pair
                  </p>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Unpaired warning */}
      {(unpairedLeft > 0 || unpairedRight > 0) && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-900">
                {unpairedLeft + unpairedRight} unpaired item{unpairedLeft + unpairedRight !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                {unpairedLeft > 0 && `${unpairedLeft} left item${unpairedLeft !== 1 ? 's' : ''}`}
                {unpairedLeft > 0 && unpairedRight > 0 && ' and '}
                {unpairedRight > 0 && `${unpairedRight} right item${unpairedRight !== 1 ? 's' : ''}`}
                {' '}need to be paired
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Game Summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Game Summary</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Left Items</p>
            <p className="font-semibold text-lg">{localConfig.leftItems.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Right Items</p>
            <p className="font-semibold text-lg">{localConfig.rightItems.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Pairs</p>
            <p className="font-semibold text-lg text-green-600">{localConfig.pairs.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Reward</p>
            <p className="font-semibold text-lg text-blue-600">
              {totalReward} {isQuizQuestion ? 'pts' : 'XP'}
            </p>
          </div>
        </div>
      </div>

      {/* Item Edit Modal */}
      {editingItem && (
        <ItemEditModal
          item={
            editingItem.side === 'left'
              ? localConfig.leftItems[editingItem.index]
              : localConfig.rightItems[editingItem.index]
          }
          index={editingItem.index}
          side={editingItem.side}
          isQuizQuestion={isQuizQuestion}
          availableItems={editingItem.side === 'left' ? localConfig.rightItems : localConfig.leftItems}
          currentPairedId={getCurrentPairedId(
            editingItem.side === 'left'
              ? localConfig.leftItems[editingItem.index].id
              : localConfig.rightItems[editingItem.index].id,
            editingItem.side
          )}
          onUpdate={(updates) => updateItem(editingItem.side, editingItem.index, updates)}
          onDelete={() => deleteItem(editingItem.side, editingItem.index)}
          onClose={() => setEditingItem(null)}
          onSelectImage={() => handleSelectImage(editingItem.index, editingItem.side)}
          onRemoveImage={() => handleRemoveImage(editingItem.index, editingItem.side)}
          onPairChange={(targetId) => {
            const itemId = editingItem.side === 'left'
              ? localConfig.leftItems[editingItem.index].id
              : localConfig.rightItems[editingItem.index].id;
            handlePairChange(itemId, editingItem.side, targetId);
          }}
        />
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <div className="fixed inset-0 z-[10001]">
          <ImageSelector
            onSelect={handleImageSelect}
            onClose={() => {
              setShowImageSelector(false);
              setPendingImageUpdate(null);
            }}
            accept="image/*"
          />
        </div>
      )}
    </div>
  );
}