// apps/web/components/admin/games/MatchingEditor.tsx
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';

// ============================================================================
// TYPES
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

        {/* Content with XP/Points on same line */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <p className="font-medium text-sm break-words flex-1">{item.text}</p>
          <span className="text-sm font-medium text-blue-600 whitespace-nowrap flex-shrink-0">
            {isQuizQuestion ? (item.points || 0) : (item.xp || 0)} {isQuizQuestion ? 'pts' : 'XP'}
          </span>
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
          <span>Paired with: {pairedRightItem.text}</span>
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
  } = useSortable({ 
    id: item.id, 
    data: { type: 'right' } 
  });

  const [imageError, setImageError] = useState(false);

  return (
    <div
      ref={setNodeRef}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`
        border-2 rounded-lg p-3 cursor-pointer transition-all
        ${isEditing 
          ? 'bg-green-50 border-green-500 shadow-md ring-2 ring-green-200' 
          : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'}
        ${isOver && isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : ''}
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
          {item.imageUrl && !imageError && (
            <p className="text-xs text-gray-500 mt-1">Has image</p>
          )}
        </div>

        {/* Editing indicator */}
        {isEditing && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Pair indicator */}
      {pairedLeftItem && (
        <div className="ml-4 mt-2 text-xs text-gray-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded">
          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Paired with: {pairedLeftItem.text}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ITEM EDIT MODAL
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
  onPairChange,
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
  const [localText, setLocalText] = useState(item.text);
  const [imageError, setImageError] = useState(false);

  const handleTextBlur = () => {
    if (localText.trim() !== item.text) {
      onUpdate({ text: localText.trim() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className={`p-4 border-b ${side === 'left' ? 'bg-blue-50' : 'bg-green-50'}`}>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Edit {side === 'left' ? 'Left' : 'Right'} Item {index + 1}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Text */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Item Text <span className="text-red-500">*</span>
            </label>
            <textarea
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={handleTextBlur}
              rows={3}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item text..."
            />
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
                value={isQuizQuestion ? (item.points || 0) : (item.xp || 0)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  onUpdate(isQuizQuestion ? { points: value } : { xp: value });
                }}
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-600 mt-1">
                Reward for matching this item correctly
              </p>
            </div>
          )}

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Image (Optional)
            </label>
            
            {item.imageUrl && !imageError ? (
              <div className="space-y-2">
                <img 
                  src={item.imageUrl} 
                  alt="Preview"
                  className="w-32 h-32 rounded border object-cover"
                  onError={() => setImageError(true)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={onSelectImage}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 border-2 border-dashed border-gray-300"
              >
                + Add Image
              </button>
            )}
          </div>

          {/* Pairing */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Pair with {side === 'left' ? 'Right' : 'Left'} Item
            </label>
            <select
              value={currentPairedId || ''}
              onChange={(e) => onPairChange(e.target.value || null)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- No pairing --</option>
              {availableItems.map((availableItem) => (
                <option key={availableItem.id} value={availableItem.id}>
                  {availableItem.text}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Select the corresponding item to create a match
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-between">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
          >
            Delete Item
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
  isQuizQuestion,
}: MatchingEditorProps) {
  const [localConfig, setLocalConfig] = useState<MatchingConfig>(() => 
    upgradeLegacyConfig(config)
  );
  
  const [editingItem, setEditingItem] = useState<{ index: number; side: 'left' | 'right' } | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [pendingImageUpdate, setPendingImageUpdate] = useState<{ index: number; side: 'left' | 'right' } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Local state for instruction to prevent re-render on every keystroke
  const [localInstruction, setLocalInstruction] = useState(
    config.instruction || 'Match the items on the left with their corresponding items on the right'
  );

  // Sync local instruction with config when config changes externally
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Match the items on the left with their corresponding items on the right');
  }, [config.instruction]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================

  useEffect(() => {
    const total = localConfig.leftItems.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);

    const currentTotal = isQuizQuestion ? localConfig.totalPoints : localConfig.totalXp;
    if (currentTotal !== total) {
      const updatedConfig = {
        ...localConfig,
        ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
      };
      setLocalConfig(updatedConfig);
      onChange(updatedConfig);
    }
  }, [localConfig.leftItems, isQuizQuestion]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const totalReward = useMemo(() => {
    return localConfig.leftItems.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);
  }, [localConfig.leftItems, isQuizQuestion]);

  const unpairedLeft = useMemo(() => {
    return localConfig.leftItems.filter(
      item => !localConfig.pairs.some(p => p.leftId === item.id)
    ).length;
  }, [localConfig.leftItems, localConfig.pairs]);

  const unpairedRight = useMemo(() => {
    return localConfig.rightItems.filter(
      item => !localConfig.pairs.some(p => p.rightId === item.id)
    ).length;
  }, [localConfig.rightItems, localConfig.pairs]);

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return localConfig.leftItems.find(i => i.id === activeId) || null;
  }, [activeId, localConfig.leftItems]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalInstruction(e.target.value);
  };

  const handleInstructionBlur = () => {
    if (localInstruction.trim() !== localConfig.instruction) {
      const updatedConfig = { ...localConfig, instruction: localInstruction.trim() };
      setLocalConfig(updatedConfig);
      onChange(updatedConfig);
    }
  };

  const addLeftItem = () => {
    const newItem: MatchingItem = {
      id: `left_${Date.now()}`,
      text: `Left Item ${localConfig.leftItems.length + 1}`,
      xp: isQuizQuestion ? undefined : 10,
      points: isQuizQuestion ? 10 : undefined,
    };
    
    const updatedConfig = {
      ...localConfig,
      leftItems: [...localConfig.leftItems, newItem]
    };
    
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
    setEditingItem({ index: localConfig.leftItems.length, side: 'left' });
    toast.success('Left item added');
  };

  const addRightItem = () => {
    const newItem: MatchingItem = {
      id: `right_${Date.now()}`,
      text: `Right Item ${localConfig.rightItems.length + 1}`,
    };
    
    const updatedConfig = {
      ...localConfig,
      rightItems: [...localConfig.rightItems, newItem]
    };
    
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
    setEditingItem({ index: localConfig.rightItems.length, side: 'right' });
    toast.success('Right item added');
  };

  const updateItem = (side: 'left' | 'right', index: number, updates: Partial<MatchingItem>) => {
    const items = side === 'left' ? [...localConfig.leftItems] : [...localConfig.rightItems];
    items[index] = { ...items[index], ...updates };
    
    const updatedConfig = {
      ...localConfig,
      ...(side === 'left' ? { leftItems: items } : { rightItems: items })
    };
    
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
  };

  const deleteItem = (side: 'left' | 'right', index: number) => {
    const items = side === 'left' ? [...localConfig.leftItems] : [...localConfig.rightItems];
    const deletedItemId = items[index].id;
    items.splice(index, 1);
    
    // Remove any pairs involving this item
    const updatedPairs = localConfig.pairs.filter(pair => 
      side === 'left' ? pair.leftId !== deletedItemId : pair.rightId !== deletedItemId
    );
    
    const updatedConfig = {
      ...localConfig,
      ...(side === 'left' ? { leftItems: items } : { rightItems: items }),
      pairs: updatedPairs
    };
    
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
    setEditingItem(null);
    toast.success('Item deleted and associated pairs removed');
  };

  const handleSelectImage = (index: number, side: 'left' | 'right') => {
    setPendingImageUpdate({ index, side });
    setShowImageSelector(true);
  };

  const handleRemoveImage = (index: number, side: 'left' | 'right') => {
    updateItem(side, index, { imageUrl: undefined });
    toast.success('Image removed');
  };

  const handleImageSelect = (url: string) => {
    if (pendingImageUpdate) {
      updateItem(pendingImageUpdate.side, pendingImageUpdate.index, { imageUrl: url });
      toast.success('Image added successfully');
    }
    setShowImageSelector(false);
    setPendingImageUpdate(null);
  };

  const getPairedItem = (itemId: string, side: 'left' | 'right'): MatchingItem | null => {
    const pair = localConfig.pairs.find(p => 
      side === 'left' ? p.leftId === itemId : p.rightId === itemId
    );
    
    if (!pair) return null;
    
    const targetId = side === 'left' ? pair.rightId : pair.leftId;
    const targetItems = side === 'left' ? localConfig.rightItems : localConfig.leftItems;
    return targetItems.find(item => item.id === targetId) || null;
  };

  const getCurrentPairedId = (itemId: string, side: 'left' | 'right'): string | null => {
    const pair = localConfig.pairs.find(p => 
      side === 'left' ? p.leftId === itemId : p.rightId === itemId
    );
    return pair ? (side === 'left' ? pair.rightId : pair.leftId) : null;
  };

  const handlePairChange = (itemId: string, side: 'left' | 'right', targetId: string | null) => {
    let updatedPairs = localConfig.pairs.filter(pair => 
      side === 'left' ? pair.leftId !== itemId : pair.rightId !== itemId
    );
    
    if (targetId) {
      // Check if target is already paired
      const targetAlreadyPaired = updatedPairs.find(pair =>
        side === 'left' ? pair.rightId === targetId : pair.leftId === targetId
      );

      if (targetAlreadyPaired) {
        toast.error('That item is already paired with another item. Remove its pair first.', {
          duration: 3000,
        });
        return;
      }
      
      // Add new pair
      updatedPairs.push(
        side === 'left'
          ? { leftId: itemId, rightId: targetId }
          : { leftId: targetId, rightId: itemId }
      );
    }
    
    const updatedConfig = { ...localConfig, pairs: updatedPairs };
    setLocalConfig(updatedConfig);
    onChange(updatedConfig);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Only handle left item dropped on right item
    if (activeData?.type === 'left' && overData?.type === 'right') {
      const leftId = active.id as string;
      const rightId = over.id as string;
      
      // Check if this exact pair already exists
      const existingPairIndex = localConfig.pairs.findIndex(
        p => p.leftId === leftId && p.rightId === rightId
      );

      if (existingPairIndex !== -1) {
        // Unpair: Remove the existing pair
        const updatedPairs = localConfig.pairs.filter((_, i) => i !== existingPairIndex);
        
        const updatedConfig = { ...localConfig, pairs: updatedPairs };
        setLocalConfig(updatedConfig);
        onChange(updatedConfig);
        
        const leftItem = localConfig.leftItems.find(i => i.id === leftId);
        const rightItem = localConfig.rightItems.find(i => i.id === rightId);
        
        toast('Pair removed', { 
          icon: '❌',
          duration: 2000,
        });
        return;
      }

      // Check if either item is already paired with something else
      const leftAlreadyPaired = localConfig.pairs.find(p => p.leftId === leftId);
      const rightAlreadyPaired = localConfig.pairs.find(p => p.rightId === rightId);

      if (leftAlreadyPaired) {
        toast.error('This left item is already paired. Drag it to its current pair to unpair first.', {
          duration: 3000,
        });
        return;
      }

      if (rightAlreadyPaired) {
        toast.error('This right item is already paired. Remove its existing pair first.', {
          duration: 3000,
        });
        return;
      }

      // Pair: Add new pair
      const updatedPairs = [...localConfig.pairs, { leftId, rightId }];
      
      const updatedConfig = { ...localConfig, pairs: updatedPairs };
      setLocalConfig(updatedConfig);
      onChange(updatedConfig);

      const leftItem = localConfig.leftItems.find(i => i.id === leftId);
      const rightItem = localConfig.rightItems.find(i => i.id === rightId);
      
      toast.success(`Paired: ${leftItem?.text} ↔ ${rightItem?.text}`, {
        duration: 2000,
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Instruction */}
      <div className="mb-3 relative">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="e.g., Match the safety equipment with its correct use case"
        />
        
        {/* Tips Tooltip */}
        <InfoTooltip title="💡 Matching Game Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Pairing:</strong> Drag a left item onto a right item to create a pair</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Unpairing:</strong> Drag the left item onto its paired right item again to remove the pair</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>One-to-One:</strong> Each left item can only pair with one right item at a time</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Balanced Pairs:</strong> Ensure each left item has a corresponding right item for complete matching gameplay</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Clear Labels:</strong> Use concise, distinct text for each item to avoid confusion during matching</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Visual Aids:</strong> Add images to items when possible to make matching more intuitive and engaging</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Reward Balance:</strong> Distribute {isQuizQuestion ? 'points' : 'XP'} evenly across left items based on difficulty</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Reordering:</strong> Drag items within their own column to reorder them for better organization</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Optimal Count:</strong> Aim for 4-8 pairs for the best player experience</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>

      {/* Unpaired warning */}
      {(unpairedLeft > 0 || unpairedRight > 0) && (
        <div className="mb-6">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
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
        </div>
      )}

      {/* Main Matching Area */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Items */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                Left Items ({localConfig.leftItems.length})
              </label>
              <button
                onClick={addLeftItem}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Left
              </button>
            </div>

            {localConfig.leftItems.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center min-h-[300px] flex flex-col items-center justify-center">
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
                <div className="space-y-2 min-h-[300px]">
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
          <div className="flex flex-col">
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center min-h-[300px] flex flex-col items-center justify-center">
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
                <div className="space-y-2 min-h-[300px]">
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

      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={localConfig.leftItems.length === 0 && localConfig.rightItems.length === 0}
        emptyMessage="⚠️ Add items to both columns and create pairs to finalize the game."
        items={[
          {
            label: 'Left Items',
            value: localConfig.leftItems.length
          },
          {
            label: 'Right Items',
            value: localConfig.rightItems.length
          },
          {
            label: 'Pairs Created',
            value: localConfig.pairs.length,
            highlight: localConfig.pairs.length > 0
          },
          {
            label: 'Total Reward',
            value: `${totalReward} ${isQuizQuestion ? 'pts' : 'XP'}`,
            highlight: true
          }
        ]}
      />

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
          <MediaSelector
            accept="image/*"
            onSelect={handleImageSelect}
            onClose={() => {
              setShowImageSelector(false);
              setPendingImageUpdate(null);
            }}
          />
        </div>
      )}
    </div>
  );
}