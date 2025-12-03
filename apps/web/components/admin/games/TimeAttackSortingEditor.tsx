// apps/web/components/admin/games/TimeAttackSortingEditor.tsx
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
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';

// ============================================================================
// TYPES — mirroring DragDrop but with time limit
// ============================================================================

type TimeAttackSortingItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
  xp?: number;
  points?: number;
};

type TimeAttackSortingTarget = {
  id: string;
  label: string;
};

type TimeAttackSortingConfig = {
  instruction: string;
  items: TimeAttackSortingItem[];
  targets: TimeAttackSortingTarget[];
  timeLimitSeconds: number; // ⏱️ NEW
  totalXp?: number;
  totalPoints?: number;
};

type TimeAttackSortingEditorProps = {
  config: any;
  onChange: (newConfig: TimeAttackSortingConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// SORTABLE ITEM COMPONENT (same as DragDropEditor)
// ============================================================================

function SortableItem({ 
  item, 
  isSelected, 
  onSelect,
  isQuizQuestion 
}: { 
  item: TimeAttackSortingItem; 
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
            {isQuizQuestion ? (item.points || 0) : (item.xp || 0)} {isQuizQuestion ? 'pts' : 'XP'}
            {item.imageUrl && !imageError && ' • Has image'}
            {imageError && ' • Image failed'}
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
// DROPPABLE TARGET COMPONENT (same as DragDropEditor)
// ============================================================================

function DroppableTarget({
  target,
  itemCount,
  isSelected,
  onSelect,
  isDragActive
}: {
  target: TimeAttackSortingTarget;
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
// MODAL EDIT PANEL FOR ITEMS (same as DragDropEditor)
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
  item: TimeAttackSortingItem;
  index: number;
  isQuizQuestion: boolean;
  targets: TimeAttackSortingTarget[];
  onUpdate: (updates: Partial<TimeAttackSortingItem>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
}) {
  const [localContent, setLocalContent] = useState(item.content);
  const [localReward, setLocalReward] = useState(
    isQuizQuestion ? (item.points ?? 10) : (item.xp ?? 10)
  );
  const [localTarget, setLocalTarget] = useState(item.correctTargetId);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    if (!localContent.trim()) {
      toast.error('Item content cannot be empty');
      return;
    }
    onUpdate({
      content: localContent,
      ...(isQuizQuestion ? { points: localReward } : { xp: localReward }),
      correctTargetId: localTarget
    });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Item #{index + 1}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Fire Extinguisher"
              autoFocus
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image (Optional)
            </label>
            {item.imageUrl ? (
              <div className="relative">
                <img 
                  src={item.imageUrl} 
                  alt={item.content}
                  className="w-full h-32 object-cover rounded-md border"
                />
                <button
                  onClick={onRemoveImage}
                  className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                  title="Remove image"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                + Add Image
              </button>
            )}
          </div>

          {/* Target Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correct Target <span className="text-red-500">*</span>
            </label>
            <select
              value={localTarget}
              onChange={(e) => setLocalTarget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Target --</option>
              {targets.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isQuizQuestion ? 'Points' : 'XP'} per Item <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              value={localReward}
              onChange={(e) => setLocalReward(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between sticky bottom-0 bg-white">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </div>
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
  target: TimeAttackSortingTarget;
  index: number;
  assignedItems: TimeAttackSortingItem[];
  onUpdate: (updates: Partial<TimeAttackSortingTarget>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [localLabel, setLocalLabel] = useState(target.label);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSave = () => {
    if (!localLabel.trim()) {
      toast.error('Target label cannot be empty');
      return;
    }
    onUpdate({ label: localLabel });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">
            Edit Target #{index + 1}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Personal Protective Equipment"
              autoFocus
            />
          </div>

          {/* Assigned Items */}
          {assignedItems.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned Items ({assignedItems.length})
              </label>
              <ul className="border border-gray-200 rounded-md divide-y max-h-32 overflow-y-auto">
                {assignedItems.map((item, idx) => (
                  <li key={idx} className="px-3 py-2 text-sm text-gray-700">
                    {item.content}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Save
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

export default function TimeAttackSortingEditor({
  config,
  onChange,
  isQuizQuestion
}: TimeAttackSortingEditorProps) {
  // Initialize config
  const initializedConfig: TimeAttackSortingConfig = {
    instruction: config.instruction || 'Drag each item to its correct category within the time limit',
    items: config.items || [],
    targets: config.targets || [],
    timeLimitSeconds: config.timeLimitSeconds || 60,
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  };

  // Local state for instruction to prevent re-render on every keystroke
  const [localInstruction, setLocalInstruction] = useState(initializedConfig.instruction);
  
  // Local state for time limit to allow smooth slider dragging
  const [localTimeLimit, setLocalTimeLimit] = useState(initializedConfig.timeLimitSeconds);

  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingTargetIndex, setEditingTargetIndex] = useState<number | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync local instruction when config changes externally
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Drag each item to its correct category within the time limit');
  }, [config.instruction]);

  // Sync local time limit when config changes externally
  useEffect(() => {
    setLocalTimeLimit(config.timeLimitSeconds || 60);
  }, [config.timeLimitSeconds]);

  // Recalculate total rewards whenever items change
  useEffect(() => {
    const totalReward = initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);
    
    const newConfig = {
      ...initializedConfig,
      ...(isQuizQuestion 
        ? { totalPoints: totalReward }
        : { totalXp: totalReward }
      )
    };
    
    // Only call onChange if the total actually changed
    const currentTotal = isQuizQuestion ? config.totalPoints : config.totalXp;
    if (currentTotal !== totalReward) {
      onChange(newConfig);
    }
  }, [initializedConfig.items, isQuizQuestion]);

  // ============================================================================
  // DRAG AND DROP HANDLERS
  // ============================================================================

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeItem = initializedConfig.items.find(i => i.id === active.id);
    const overTarget = initializedConfig.targets.find(t => t.id === over.id);

    if (activeItem && overTarget) {
      // Assign item to target
      const updatedItems = initializedConfig.items.map(item =>
        item.id === activeItem.id
          ? { ...item, correctTargetId: overTarget.id }
          : item
      );
      onChange({
        ...initializedConfig,
        items: updatedItems
      });
      toast.success(`Assigned "${activeItem.content}" to "${overTarget.label}"`);
    }
  };

  // ============================================================================
  // ITEM HANDLERS
  // ============================================================================

  const addItem = () => {
    const defaultReward = isQuizQuestion ? 10 : 10;
    const newItem: TimeAttackSortingItem = {
      id: `item-${Date.now()}`,
      content: `Item ${initializedConfig.items.length + 1}`,
      correctTargetId: '',
      ...(isQuizQuestion ? { points: defaultReward } : { xp: defaultReward })
    };
    
    onChange({
      ...initializedConfig,
      items: [...initializedConfig.items, newItem]
    });
    
    setEditingItemIndex(initializedConfig.items.length);
  };

  const updateItem = (index: number, updates: Partial<TimeAttackSortingItem>) => {
    const updatedItems = [...initializedConfig.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    onChange({
      ...initializedConfig,
      items: updatedItems
    });
  };

  const deleteItem = (index: number) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const updatedItems = initializedConfig.items.filter((_, i) => i !== index);
      onChange({
        ...initializedConfig,
        items: updatedItems
      });
      setEditingItemIndex(null);
      toast.success('Item deleted');
    }
  };

  // ============================================================================
  // TARGET HANDLERS
  // ============================================================================

  const addTarget = () => {
    const newTarget: TimeAttackSortingTarget = {
      id: `target-${Date.now()}`,
      label: `Category ${initializedConfig.targets.length + 1}`
    };
    
    onChange({
      ...initializedConfig,
      targets: [...initializedConfig.targets, newTarget]
    });
    
    setEditingTargetIndex(initializedConfig.targets.length);
  };

  const updateTarget = (index: number, updates: Partial<TimeAttackSortingTarget>) => {
    const updatedTargets = [...initializedConfig.targets];
    updatedTargets[index] = { ...updatedTargets[index], ...updates };
    onChange({
      ...initializedConfig,
      targets: updatedTargets
    });
  };

  const deleteTarget = (index: number) => {
    const targetId = initializedConfig.targets[index].id;
    const assignedItemsCount = initializedConfig.items.filter(
      item => item.correctTargetId === targetId
    ).length;

    if (assignedItemsCount > 0) {
      if (!confirm(`This target has ${assignedItemsCount} assigned item(s). Deleting it will unassign these items. Continue?`)) {
        return;
      }
    }

    const updatedTargets = initializedConfig.targets.filter((_, i) => i !== index);
    const updatedItems = initializedConfig.items.map(item =>
      item.correctTargetId === targetId
        ? { ...item, correctTargetId: '' }
        : item
    );

    onChange({
      ...initializedConfig,
      targets: updatedTargets,
      items: updatedItems
    });
    
    setEditingTargetIndex(null);
    toast.success('Target deleted');
  };

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================

  const handleSelectImage = () => {
    setShowImageSelector(true);
  };

  const handleImageSelect = (url: string) => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, { imageUrl: url });
    }
    setShowImageSelector(false);
  };

  const handleRemoveImage = () => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, { imageUrl: undefined });
    }
  };

  // ============================================================================
  // INSTRUCTION & TIME LIMIT HANDLERS (Fixed focus issues)
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

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getItemCountForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId).length;
  };

  const getUnassignedItemsCount = () => {
    return initializedConfig.items.filter(item => !item.correctTargetId).length;
  };

  const getTargetForItem = (item: TimeAttackSortingItem) => {
    return initializedConfig.targets.find(t => t.id === item.correctTargetId);
  };

  const getAssignedItemsForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId);
  };

  // ============================================================================
  // CALCULATED VALUES
  // ============================================================================

  const totalReward = (isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp) ?? 0;
  const unassignedCount = getUnassignedItemsCount();
  const activeItem = activeId ? initializedConfig.items.find(i => i.id === activeId) : null;

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
          placeholder="e.g., Sort each hazard into its correct safety category before time runs out"
        />

        {/* Tips Tooltip */}
        <InfoTooltip title="💡 Time Attack Sorting Best Practices">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Time pressure</strong> adds urgency — players must sort all items before time expires</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Drag</strong> items from the left panel to target zones on the right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Click</strong> items or targets to edit their properties in the modal</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Set time wisely</strong> — test to ensure it's challenging but achievable</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Multiple items</strong> can be assigned to the same target category</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>All items</strong> must be assigned to targets before saving</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>

      {/* Time Limit Control */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Time Limit <span className="text-red-500">*</span>
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
            max="180"
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
            <span>180s (Extended)</span>
          </div>
        </div>
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
          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">
                Items ({initializedConfig.items.length})
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
                <p className="text-gray-500 text-sm mb-3">No items yet</p>
                <button onClick={addItem} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Add First Item
                </button>
              </div>
            ) : (
              <SortableContext items={initializedConfig.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
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
                          <span>→ {getTargetForItem(item)?.label || 'Unknown'}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            )}
          </div>

          {/* Targets */}
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
                <p className="text-gray-500 text-sm mb-3">No targets yet</p>
                <button onClick={addTarget} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Add First Target
                </button>
              </div>
            ) : (
              <SortableContext items={initializedConfig.targets.map(t => t.id)} strategy={verticalListSortingStrategy}>
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

      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.items.length === 0}
        emptyMessage="⚠️ Add items and targets to calculate total rewards."
        items={[
          {
            label: 'Sortable Items',
            value: initializedConfig.items.length
          },
          {
            label: 'Target Categories',
            value: initializedConfig.targets.length
          },
          {
            label: 'Items Assigned',
            value: `${initializedConfig.items.length - unassignedCount} / ${initializedConfig.items.length}`
          },
          {
            label: 'Time Limit',
            value: `${initializedConfig.timeLimitSeconds}s`,
            icon: (
              <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: `Total ${isQuizQuestion ? 'Points' : 'XP'}`,
            value: totalReward,
            highlight: true
          }
        ]}
      />

      {/* Modals */}
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
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={(url) => handleImageSelect(url)}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}