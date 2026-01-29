// apps/web/components/admin/games/DragDropEditor.tsx
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

type DragDropItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
  explanation?: string;  // ✅ NEW: Per-item explanation
  xp?: number;
  points?: number;
};

type DragDropTarget = {
  id: string;
  label: string;
};

type DragDropConfig = {
  instruction: string;
  items: DragDropItem[];
  targets: DragDropTarget[];
  generalFeedback?: string;  // ✅ NEW: General feedback
  totalXp?: number;
  totalPoints?: number;
};

type DragDropEditorProps = {
  config: any;
  onChange: (newConfig: DragDropConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// HELPER FUNCTION FOR CHARACTER COUNTING
// ============================================================================

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim().length;
};

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

function SortableItem({ 
  item, 
  isSelected, 
  onSelect,
  isQuizQuestion 
}: { 
  item: DragDropItem; 
  isSelected: boolean; 
  onSelect: () => void;
  isQuizQuestion: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

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
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={`
        border-2 rounded-lg p-3 cursor-move transition-all
        ${isSelected 
          ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200' 
          : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
        ${isDragging ? 'scale-105 shadow-lg' : ''}
      `}
    >
      <div className="flex items-start gap-3">
        {item.imageUrl && !imageError ? (
          <img 
            src={item.imageUrl} 
            alt={item.content}
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
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm break-words">{item.content}</p>
          <p className="text-xs text-gray-500 mt-1">
            {isQuizQuestion ? item.points : item.xp} {isQuizQuestion ? 'pts' : 'XP'}
            {item.imageUrl && !imageError && ' • Has image'}
            {imageError && ' • Image failed'}
            {item.explanation && ' • Has explanation'}
          </p>
        </div>
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// DROPPABLE TARGET COMPONENT
// ============================================================================

function DroppableTarget({
  target,
  itemCount,
  isSelected,
  onSelect,
  isDragActive
}: {
  target: DragDropTarget;
  itemCount: number;
  isSelected: boolean;
  onSelect: () => void;
  isDragActive: boolean;
}) {
  const { setNodeRef, isOver } = useSortable({ 
    id: target.id,
    data: { type: 'target' }
  });

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`
        relative border-2 rounded-lg p-4 min-h-[100px] cursor-pointer transition-all
        ${isSelected 
          ? 'border-green-500 bg-green-50 shadow-md ring-2 ring-green-200' 
          : 'border-gray-200 bg-white hover:border-green-300 hover:shadow-sm'}
        ${isOver && isDragActive ? 'border-blue-500 bg-blue-50 scale-105' : ''}
      `}
    >
      <div className="font-medium text-gray-900 mb-2">{target.label}</div>
      
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''} assigned</span>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Drop indicator during drag */}
      {isDragActive && (
        <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none bg-blue-50/50 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-700">Drop here</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MODAL EDIT PANEL FOR ITEMS
// ============================================================================

function ItemEditModal({
  item,
  index,
  isQuizQuestion,
  targets,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage
}: {
  item: DragDropItem;
  index: number;
  isQuizQuestion: boolean;
  targets: DragDropTarget[];
  onUpdate: (updates: Partial<DragDropItem>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
}) {
  // ✅ Local state for explanation (follows HotspotEditor pattern)
  const [editingExplanation, setEditingExplanation] = useState<string>(item.explanation || '');

  // ✅ Sync explanation when item changes
  useEffect(() => {
    setEditingExplanation(item.explanation || '');
  }, [item.explanation, index]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Item {index + 1}
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

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Content Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Item Content <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={item.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Hard Hat"
            />
          </div>

          {/* Correct Target Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Correct Target <span className="text-red-500">*</span>
            </label>
            <select
              value={item.correctTargetId}
              onChange={(e) => onUpdate({ correctTargetId: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Target --</option>
              {targets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-600 mt-1">
              Where should this item be dragged?
            </p>
          </div>

          {/* Reward Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={isQuizQuestion ? item.points : item.xp}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onUpdate(isQuizQuestion ? { points: value } : { xp: value });
              }}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Reward for correctly placing this item
            </p>
          </div>

          {/* Image Section */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Image (Optional)
            </label>
            
            {item.imageUrl ? (
              <div className="relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.content}
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={onSelectImage}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                  >
                    Change
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 hover:bg-blue-50 transition-colors text-center"
              >
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-600">Click to add image</p>
              </button>
            )}
          </div>

          {/* ✅ NEW: Explanation Field */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium">
                Explanation (Optional)
              </label>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help" title="Explain why this item belongs to its target. Shown after submission.">?</span>
            </div>
            <GameRichTextEditor
              key={`item-explanation-${index}`}
              content={editingExplanation}
              onChange={(html) => {
                setEditingExplanation(html);
                onUpdate({ explanation: html });
              }}
              height={120}
              placeholder="Explain why this item belongs to its target..."
            />
            <div className="flex justify-end mt-1">
              <span className={
                getPlainTextLength(editingExplanation) > 300 
                  ? 'text-red-600 font-medium text-xs' 
                  : getPlainTextLength(editingExplanation) > 240 
                  ? 'text-yellow-600 text-xs' 
                  : 'text-gray-500 text-xs'
              }>
                {getPlainTextLength(editingExplanation)}/300 characters
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
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
// MODAL EDIT PANEL FOR TARGETS
// ============================================================================

function TargetEditModal({
  target,
  index,
  assignedItems,
  onUpdate,
  onDelete,
  onClose
}: {
  target: DragDropTarget;
  index: number;
  assignedItems: DragDropItem[];
  onUpdate: (updates: Partial<DragDropTarget>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Edit Target {index + 1}
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

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Label Field */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Target Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={target.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PPE Equipment"
            />
          </div>

          {/* Assigned Items List */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Assigned Items ({assignedItems.length})
            </label>
            {assignedItems.length === 0 ? (
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">No items assigned yet</p>
              </div>
            ) : (
              <ul className="border rounded-lg divide-y">
                {assignedItems.map((item, idx) => (
                  <li key={idx} className="p-3 flex items-center gap-3">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.content}
                        className="w-10 h-10 rounded border object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.content}</p>
                    </div>
                    <span className="text-sm text-blue-600">
                      {item.xp || item.points} {item.xp ? 'XP' : 'pts'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-between items-center">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition-colors"
          >
            Delete Target
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
// MAIN EDITOR COMPONENT
// ============================================================================

export default function DragDropEditor({
  config,
  onChange,
  isQuizQuestion,
}: DragDropEditorProps) {
  // DnD Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 5 } 
    }),
    useSensor(KeyboardSensor, { 
      coordinateGetter: sortableKeyboardCoordinates 
    })
  );

  // Initialize config with useMemo to prevent recreation
  const initializedConfig: DragDropConfig = useMemo(() => ({
    instruction: config.instruction || 'Drag each item to its correct target zone',
    items: config.items || [],
    targets: config.targets || [],
    generalFeedback: config.generalFeedback || '',  // ✅ NEW
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  }), [config, isQuizQuestion]);

  // Local state for instruction to prevent re-render on every keystroke
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Drag each item to its correct target zone');
  
  // ✅ NEW: Local state for general feedback
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState<string>(config.generalFeedback || '');

  // State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingTargetIndex, setEditingTargetIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Sync local instruction with config when config changes externally
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Drag each item to its correct target zone');
  }, [config.instruction]);

  // ✅ NEW: Sync general feedback
  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);

  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================
  
  useEffect(() => {
    const total = initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);
    
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      const updatedConfig = {
        ...initializedConfig,
        ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
      };
      onChange(updatedConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initializedConfig.items.length,
    JSON.stringify(initializedConfig.items.map(i => 
      isQuizQuestion ? i.points : i.xp
    )),
    isQuizQuestion
  ]);

  // ============================================================================
  // DUPLICATE DETECTION
  // ============================================================================
  
  const checkDuplicateItemContent = (content: string, excludeIndex?: number): boolean => {
    return initializedConfig.items.some((item, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) {
        return false;
      }
      return item.content.toLowerCase().trim() === content.toLowerCase().trim();
    });
  };
  
  const checkDuplicateTargetLabel = (label: string, excludeIndex?: number): boolean => {
    return initializedConfig.targets.some((target, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) {
        return false;
      }
      return target.label.toLowerCase().trim() === label.toLowerCase().trim();
    });
  };

  // ============================================================================
  // ITEM MANAGEMENT
  // ============================================================================
  
  const addItem = () => {
    const defaultReward = isQuizQuestion ? { points: 10 } : { xp: 10 };
    
    const newItem: DragDropItem = {
      id: `item_${Date.now()}`,
      content: `Item ${initializedConfig.items.length + 1}`,
      correctTargetId: initializedConfig.targets.length > 0 ? initializedConfig.targets[0].id : '',
      ...defaultReward
    };
    
    const newConfig = {
      ...initializedConfig,
      items: [...initializedConfig.items, newItem]
    };
    
    onChange(newConfig);
    setEditingItemIndex(newConfig.items.length - 1);
  };
  
  const updateItem = (index: number, updates: Partial<DragDropItem>) => {
    if (index < 0 || index >= initializedConfig.items.length) {
      console.warn('updateItem: invalid index', index);
      return;
    }
    
    const currentItem = initializedConfig.items[index];
    const newItem = { ...currentItem, ...updates };
    
    if (updates.content !== undefined && updates.content.trim() !== '') {
      if (checkDuplicateItemContent(updates.content, index)) {
        toast.error('An item with this content already exists', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }
    }
    
    const newItems = [...initializedConfig.items];
    newItems[index] = newItem;
    
    onChange({
      ...initializedConfig,
      items: newItems
    });
  };
  
  const deleteItem = (index: number) => {
    const newItems = initializedConfig.items.filter((_, i) => i !== index);
    
    onChange({
      ...initializedConfig,
      items: newItems
    });
    
    setEditingItemIndex(null);
    toast.success('Item deleted', { duration: 2000 });
  };

  // ============================================================================
  // TARGET MANAGEMENT
  // ============================================================================
  
  const addTarget = () => {
    const newTarget: DragDropTarget = {
      id: `target_${Date.now()}`,
      label: `Target ${initializedConfig.targets.length + 1}`
    };
    
    const newConfig = {
      ...initializedConfig,
      targets: [...initializedConfig.targets, newTarget]
    };
    
    onChange(newConfig);
    setEditingTargetIndex(newConfig.targets.length - 1);
  };
  
  const updateTarget = (index: number, updates: Partial<DragDropTarget>) => {
    if (index < 0 || index >= initializedConfig.targets.length) {
      console.warn('updateTarget: invalid index', index);
      return;
    }
    
    const currentTarget = initializedConfig.targets[index];
    const newTarget = { ...currentTarget, ...updates };
    
    if (updates.label !== undefined && updates.label.trim() !== '') {
      if (checkDuplicateTargetLabel(updates.label, index)) {
        toast.error('A target with this label already exists', {
          duration: 3000,
          position: 'top-center',
        });
        return;
      }
    }
    
    const newTargets = [...initializedConfig.targets];
    newTargets[index] = newTarget;
    
    onChange({
      ...initializedConfig,
      targets: newTargets
    });
  };
  
  const deleteTarget = (index: number) => {
    const targetId = initializedConfig.targets[index].id;
    
    // Unassign items that were assigned to this target
    const updatedItems = initializedConfig.items.map(item => {
      if (item.correctTargetId === targetId) {
        return { ...item, correctTargetId: '' };
      }
      return item;
    });
    
    const newTargets = initializedConfig.targets.filter((_, i) => i !== index);
    
    onChange({
      ...initializedConfig,
      targets: newTargets,
      items: updatedItems
    });
    
    setEditingTargetIndex(null);
    toast.success('Target deleted', { duration: 2000 });
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // ✅ FIXED: Handle reordering items within the same list
    if (active.id.toString().startsWith('item_') && over.id.toString().startsWith('item_')) {
      const oldIndex = initializedConfig.items.findIndex(i => i.id === active.id);
      const newIndex = initializedConfig.items.findIndex(i => i.id === over.id);

      if (oldIndex !== newIndex) {
        const reorderedItems = arrayMove(initializedConfig.items, oldIndex, newIndex);
        onChange({
          ...initializedConfig,
          items: reorderedItems
        });
        toast.success('Item reordered', { duration: 1500 });
      }
      return;
    }

    // Handle dragging item to target
    if (active.id.toString().startsWith('item_') && over.id.toString().startsWith('target_')) {
      const itemIndex = initializedConfig.items.findIndex(i => i.id === active.id);
      const targetId = over.id.toString();

      if (itemIndex !== -1) {
        updateItem(itemIndex, { correctTargetId: targetId });
        const targetLabel = initializedConfig.targets.find(t => t.id === targetId)?.label;
        toast.success(`✅ Assigned to "${targetLabel}"`, { 
          duration: 2000,
          icon: '🎯'
        });
      }
    }

    // ✅ FIXED: Handle reordering targets
    if (active.id.toString().startsWith('target_') && over.id.toString().startsWith('target_')) {
      const oldIndex = initializedConfig.targets.findIndex(t => t.id === active.id);
      const newIndex = initializedConfig.targets.findIndex(t => t.id === over.id);

      if (oldIndex !== newIndex) {
        const reorderedTargets = arrayMove(initializedConfig.targets, oldIndex, newIndex);
        onChange({
          ...initializedConfig,
          targets: reorderedTargets
        });
        toast.success('Target reordered', { duration: 1500 });
      }
    }
  };

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingItemIndex === null && editingTargetIndex === null) {
        if (e.key === 'Escape') {
          // Clear selections
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingItemIndex, editingTargetIndex]);

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================
  
  const handleImageSelect = (url: string, fileInfo: any) => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, { imageUrl: url });
      setShowImageSelector(false);
      toast.success('Image added');
    }
  };
  
  const handleSelectImage = () => {
    setShowImageSelector(true);
  };
  
  const handleRemoveImage = () => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, { imageUrl: '' });
      toast.success('Image removed');
    }
  };

  // ============================================================================
  // OTHER HANDLERS
  // ============================================================================
  
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newInstruction = e.target.value;
    setLocalInstruction(newInstruction);
  };

  const handleInstructionBlur = () => {
    if (localInstruction !== initializedConfig.instruction) {
      onChange({
        ...initializedConfig,
        instruction: localInstruction
      });
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================
  
  const getItemCountForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId).length;
  };
  
  const getUnassignedItemsCount = () => {
    return initializedConfig.items.filter(item => !item.correctTargetId || item.correctTargetId === '').length;
  };
  
  const getAssignedItemsForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId);
  };
  
  const getTargetForItem = (item: DragDropItem) => {
    return initializedConfig.targets.find(t => t.id === item.correctTargetId);
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  const totalReward = useMemo(() => {
    return initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);
  }, [initializedConfig.items, isQuizQuestion]);
  
  const unassignedCount = useMemo(() => getUnassignedItemsCount(), [initializedConfig.items]);
  
  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return initializedConfig.items.find(item => item.id === activeId) || null;
  }, [activeId, initializedConfig.items]);

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div>
      {/* Instruction */}
      <div className="mb-4 relative">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="e.g., Drag each safety hazard to its appropriate control measure"
        />

        {/* Tips Tooltip */}
        <InfoTooltip title="💡 Drag & Drop Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Drag</strong> items from the left panel to target zones on the right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Click</strong> an item or target to edit its properties</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Multiple items</strong> can be assigned to the same target</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Add images</strong> to items for better visual recognition</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>All items</strong> must be assigned to targets before saving</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>

      {/* Warning for unassigned items */}
      {unassignedCount > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-900">
                {unassignedCount} item{unassignedCount !== 1 ? 's' : ''} not assigned to any target
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Click items to edit and assign them to targets, or drag them to target zones
              </p>
            </div>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ===== LEFT PANEL: DRAGGABLE ITEMS ===== */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                Draggable Items ({initializedConfig.items.length})
              </label>
              <button
                onClick={addItem}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + Add Item
              </button>
            </div>

            {initializedConfig.items.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 text-sm mb-3">No items added yet</p>
                <button
                  onClick={addItem}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add First Item
                </button>
              </div>
            ) : (
              <SortableContext
                items={initializedConfig.items.map(i => i.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {initializedConfig.items.map((item, index) => (
                    <div key={item.id}>
                      <SortableItem
                        item={item}
                        isSelected={editingItemIndex === index}
                        onSelect={() => setEditingItemIndex(index)}
                        isQuizQuestion={isQuizQuestion}
                      />
                      {item.correctTargetId && (
                        <div className="ml-4 mt-1 text-xs text-gray-600 flex items-center gap-1">
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>→ {getTargetForItem(item)?.label || 'Unknown target'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          {/* ===== RIGHT PANEL: TARGET ZONES ===== */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                Target Zones ({initializedConfig.targets.length})
              </label>
              <button
                onClick={addTarget}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                + Add Target
              </button>
            </div>

            {initializedConfig.targets.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 text-sm mb-3">No targets added yet</p>
                <button
                  onClick={addTarget}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Add First Target
                </button>
              </div>
            ) : (
              <SortableContext
                items={initializedConfig.targets.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {initializedConfig.targets.map((target, index) => (
                    <DroppableTarget
                      key={target.id}
                      target={target}
                      itemCount={getItemCountForTarget(target.id)}
                      isSelected={editingTargetIndex === index}
                      onSelect={() => setEditingTargetIndex(index)}
                      isDragActive={!!activeId}
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
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img 
                      src={activeItem.imageUrl} 
                      alt=""
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <svg class="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        `;
                      }}
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{activeItem.content}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Drop on target zone
                  </p>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ✅ NEW: General Feedback Section */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <label className="block text-sm font-medium text-gray-700">General Feedback (Optional)</label>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help" title="This feedback will be shown to learners after they submit, regardless of their score. Use it to provide context, hints, or learning points.">?</span>
        </div>
        <GameRichTextEditor
          key="general-feedback-editor"
          content={localGeneralFeedback}
          onChange={(content: string) => {
            setLocalGeneralFeedback(content);
            onChange({ ...initializedConfig, generalFeedback: content });
          }}
          height={150}
          placeholder="Provide context or hints about the drag-and-drop activity..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-gray-500">Provide context or hints about the drag-and-drop activity</span>
          <span className={
            getPlainTextLength(localGeneralFeedback) > 500 
              ? 'text-red-600 font-medium' 
              : getPlainTextLength(localGeneralFeedback) > 400 
              ? 'text-yellow-600' 
              : 'text-gray-500'
          }>
            {getPlainTextLength(localGeneralFeedback)}/500 characters
          </span>
        </div>
      </div>

      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.items.length === 0}
        emptyMessage="⚠️ Add items and targets to calculate total rewards."
        items={[
          {
            label: 'Draggable Items',
            value: initializedConfig.items.length
          },
          {
            label: 'Target Zones',
            value: initializedConfig.targets.length
          },
          {
            label: 'Items Assigned',
            value: `${initializedConfig.items.length - unassignedCount} / ${initializedConfig.items.length}`
          },
          {
            label: `Total ${isQuizQuestion ? 'Points' : 'XP'}`,
            value: totalReward,
            highlight: true
          }
        ]}
      />

      {/* Item Edit Modal */}
      {editingItemIndex !== null && (
        <ItemEditModal
          item={initializedConfig.items[editingItemIndex]}
          index={editingItemIndex}
          isQuizQuestion={isQuizQuestion}
          targets={initializedConfig.targets}
          onUpdate={(updates) => updateItem(editingItemIndex, updates)}
          onDelete={() => deleteItem(editingItemIndex)}
          onClose={() => setEditingItemIndex(null)}
          onSelectImage={handleSelectImage}
          onRemoveImage={handleRemoveImage}
        />
      )}

      {/* Target Edit Modal */}
      {editingTargetIndex !== null && (
        <TargetEditModal
          target={initializedConfig.targets[editingTargetIndex]}
          index={editingTargetIndex}
          assignedItems={getAssignedItemsForTarget(initializedConfig.targets[editingTargetIndex].id)}
          onUpdate={(updates) => updateTarget(editingTargetIndex, updates)}
          onDelete={() => deleteTarget(editingTargetIndex)}
          onClose={() => setEditingTargetIndex(null)}
        />
      )}

      {/* Image Selector Modal */}
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}