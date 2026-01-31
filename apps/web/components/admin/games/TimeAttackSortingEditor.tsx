// apps/web/components/admin/games/TimeAttackSortingEditor.tsx
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
// HELPER FUNCTION FOR CHARACTER COUNTING
// ============================================================================

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim().length;
};

// ============================================================================
// TYPES — mirroring DragDrop but with time limit
// ============================================================================

type TimeAttackSortingItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
  explanation?: string;  // ✅ NEW: Per-item explanation
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
  timeLimitSeconds: number; // ⏱️ Time limit feature
  generalFeedback?: string;  // ✅ NEW: General feedback
  totalXp?: number;
  totalPoints?: number;
};

type TimeAttackSortingEditorProps = {
  config: any;
  onChange: (newConfig: TimeAttackSortingConfig) => void;
  isQuizQuestion: boolean;
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
          ? 'bg-primary-surface border-primary shadow-md ring-2 ring-primary-light'
          : 'bg-white border-border hover:border-primary-light hover:shadow-sm'}
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
          <div className="w-12 h-12 rounded border border-border bg-surface flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-text-primary break-words">{item.content}</p>
          <p className="text-xs text-text-secondary mt-1">
            {isQuizQuestion ? (item.points || 0) : (item.xp || 0)} {isQuizQuestion ? 'pts' : 'XP'}
            {item.imageUrl && !imageError && ' • Has image'}
            {imageError && ' • Image failed'}
            {item.explanation && ' • Has explanation'}
          </p>
        </div>
        {isSelected && (
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
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
          ? 'border-success bg-success-light shadow-md ring-2 ring-success'
          : 'border-border bg-white hover:border-success hover:shadow-sm'}
        ${isOver && isDragActive ? 'border-primary bg-primary-surface scale-105' : ''}
      `}
    >
      <div className="font-medium text-text-primary mb-2">{target.label}</div>
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <svg className="w-4 h-4 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <span>{itemCount} item{itemCount !== 1 ? 's' : ''} assigned</span>
      </div>
      {isSelected && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
        </div>
      )}
      {/* Drop indicator during drag */}
      {isDragActive && (
        <div className="absolute inset-0 border-2 border-dashed border-primary rounded-lg pointer-events-none bg-primary-surface/50 flex items-center justify-center">
          <span className="text-sm font-medium text-primary-dark">Drop here</span>
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
  const [editingExplanation, setEditingExplanation] = useState<string>(item.explanation || '');
  useEffect(() => {
    setEditingExplanation(item.explanation || '');
  }, [item.explanation, index]);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-heading-4 text-text-primary">
            Edit Item {index + 1}
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
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Content Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Item Content <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={item.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="w-full"
              placeholder="e.g., Hard Hat"
            />
          </div>
          {/* Correct Target Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Correct Target <span className="text-danger">*</span>
            </label>
            <select
              value={item.correctTargetId}
              onChange={(e) => onUpdate({ correctTargetId: e.target.value })}
              className="w-full"
            >
              <option value="">-- Select Target --</option>
              {targets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-text-muted mt-1.5">
              Where should this item be sorted?
            </p>
          </div>
          {/* Reward Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {isQuizQuestion ? 'Points' : 'XP'} <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={isQuizQuestion ? item.points : item.xp}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                onUpdate(isQuizQuestion ? { points: value } : { xp: value });
              }}
              className="w-full"
            />
            <p className="text-xs text-text-muted mt-1.5">
              Reward for correctly sorting this item
            </p>
          </div>
          {/* Image Section */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Image (Optional)
            </label>
            {item.imageUrl ? (
              <div className="relative">
                <img
                  src={item.imageUrl}
                  alt={item.content}
                  className="w-full h-48 object-cover rounded-lg border border-border"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={onSelectImage}
                    className="btn btn-primary text-sm px-3 py-1"
                  >
                    Change
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="btn btn-danger text-sm px-3 py-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full border-2 border-dashed border-border rounded-lg p-8 hover:bg-primary-surface hover:border-primary-light transition-colors text-center"
              >
                <svg className="mx-auto h-12 w-12 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-text-secondary">Click to add image</p>
              </button>
            )}
          </div>
          {/* ✅ NEW: Explanation Field */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="block text-sm font-medium text-text-secondary">
                Explanation (Optional)
              </label>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" title="Explain why this item belongs to its target. Shown after submission.">?</span>
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
                  ? 'text-danger font-medium text-xs'
                  : getPlainTextLength(editingExplanation) > 240
                    ? 'text-warning-dark text-xs'
                    : 'text-text-muted text-xs'
              }>
                {getPlainTextLength(editingExplanation)}/300 characters
              </span>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
          <button
            onClick={onDelete}
            className="btn btn-danger px-4 py-2"
          >
            Delete Item
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary px-4 py-2"
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
  target: TimeAttackSortingTarget;
  index: number;
  assignedItems: TimeAttackSortingItem[];
  onUpdate: (updates: Partial<TimeAttackSortingTarget>) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex justify-between items-center">
          <h3 className="text-heading-4 text-text-primary">
            Edit Target {index + 1}
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
        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Label Field */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Target Label <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={target.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="w-full"
              placeholder="e.g., PPE Equipment"
            />
          </div>
          {/* Assigned Items List */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Assigned Items ({assignedItems.length})
            </label>
            {assignedItems.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <p className="text-sm text-text-secondary">No items assigned yet</p>
              </div>
            ) : (
              <ul className="border border-border rounded-lg divide-y divide-border">
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
                      <p className="font-medium text-sm text-text-primary">{item.content}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="sticky bottom-0 bg-surface border-t border-border px-6 py-4 flex justify-between items-center">
          <button
            onClick={onDelete}
            className="btn btn-danger px-4 py-2"
          >
            Delete Target
          </button>
          <button
            onClick={onClose}
            className="btn btn-primary px-4 py-2"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN EDITOR COMPONENT - ZERO LOGIC CHANGES
// ============================================================================

export default function TimeAttackSortingEditor({
  config,
  onChange,
  isQuizQuestion,
}: TimeAttackSortingEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
  
  const initializedConfig: TimeAttackSortingConfig = useMemo(() => ({
    instruction: config.instruction || 'Sort each item into its correct category as fast as you can!',
    items: config.items || [],
    targets: config.targets || [],
    timeLimitSeconds: config.timeLimitSeconds || 60,
    generalFeedback: config.generalFeedback || '',
    ...(isQuizQuestion
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  }), [config, isQuizQuestion]);
  
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Sort each item into its correct category as fast as you can!');
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState<string>(config.generalFeedback || '');
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingTargetIndex, setEditingTargetIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Sort each item into its correct category as fast as you can!');
  }, [config.instruction]);
  
  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);
  
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
  }, [
    initializedConfig.items.length,
    JSON.stringify(initializedConfig.items.map(i => isQuizQuestion ? i.points : i.xp)),
    isQuizQuestion
  ]);
  
  const checkDuplicateItemContent = (content: string, excludeIndex?: number): boolean => {
    return initializedConfig.items.some((item, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) return false;
      return item.content.toLowerCase().trim() === content.toLowerCase().trim();
    });
  };
  
  const checkDuplicateTargetLabel = (label: string, excludeIndex?: number): boolean => {
    return initializedConfig.targets.some((target, index) => {
      if (excludeIndex !== undefined && index === excludeIndex) return false;
      return target.label.toLowerCase().trim() === label.toLowerCase().trim();
    });
  };
  
  const addItem = () => {
    const defaultReward = isQuizQuestion ? { points: 10 } : { xp: 10 };
    const newItem: TimeAttackSortingItem = {
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
  
  const updateItem = (index: number, updates: Partial<TimeAttackSortingItem>) => {
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
  
  const addTarget = () => {
    const newTarget: TimeAttackSortingTarget = {
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
  
  const updateTarget = (index: number, updates: Partial<TimeAttackSortingTarget>) => {
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
    const updatedItems = initializedConfig.items.map(item => {
      if (item.correctTargetId === targetId) {
        return { ...item, correctTargetId: '' };
      }
      return item;
    });
    const newTargets = initializedConfig.targets.filter((_, i) => i !== index);
    onChange({
      ...initializedConfig,
      items: updatedItems,
      targets: newTargets
    });
    setEditingTargetIndex(null);
    toast.success('Target deleted', { duration: 2000 });
  };
  
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
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const activeItemIndex = initializedConfig.items.findIndex(item => item.id === active.id);
    const overItemIndex = initializedConfig.items.findIndex(item => item.id === over.id);
    if (activeItemIndex !== -1 && overItemIndex !== -1 && activeItemIndex !== overItemIndex) {
      const reorderedItems = arrayMove(initializedConfig.items, activeItemIndex, overItemIndex);
      onChange({
        ...initializedConfig,
        items: reorderedItems
      });
      toast.success('Item reordered', { duration: 1500 });
      return;
    }
    const isTarget = initializedConfig.targets.some(t => t.id === over.id);
    if (isTarget) {
      const itemIndex = initializedConfig.items.findIndex(item => item.id === active.id);
      if (itemIndex !== -1) {
        updateItem(itemIndex, { correctTargetId: over.id as string });
        toast.success('Item assigned to target', { duration: 1500 });
      }
    }
  };
  
  const getTargetForItem = (item: TimeAttackSortingItem) => {
    return initializedConfig.targets.find(t => t.id === item.correctTargetId);
  };
  
  const getItemCountForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId).length;
  };
  
  const getAssignedItemsForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId);
  };
  
  const activeItem = activeId
    ? initializedConfig.items.find(item => item.id === activeId)
    : null;
  
  const totalReward = initializedConfig.items.reduce((sum, item) => {
    return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
  }, 0);
  
  const unassignedCount = initializedConfig.items.filter(item => !item.correctTargetId).length;
  
  return (
    <div className="space-y-6">
      {/* Instruction Field */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Game Instructions <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={localInstruction}
          onChange={(e) => setLocalInstruction(e.target.value)}
          onBlur={() => onChange({ ...initializedConfig, instruction: localInstruction })}
          className="w-full"
          placeholder="Sort each item into its correct category as fast as you can!"
        />
        <p className="text-xs text-text-muted mt-1.5">
          Tell learners what they need to do in this timed sorting challenge
        </p>
      </div>
      
      {/* Time Limit Field */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Time Limit (seconds) <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          min="10"
          max="300"
          value={initializedConfig.timeLimitSeconds}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 60;
            onChange({ ...initializedConfig, timeLimitSeconds: Math.max(10, Math.min(300, value)) });
          }}
          className="w-full"
        />
        <p className="text-xs text-text-muted mt-1.5">
          How much time learners have to sort all items (10-300 seconds)
        </p>
      </div>
      
      {/* Warning if items not assigned */}
      {unassignedCount > 0 && (
        <div className="bg-alert-light border border-alert rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-alert-dark mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-alert-dark">
                {unassignedCount} item{unassignedCount !== 1 ? 's' : ''} not assigned to any target
              </p>
              <p className="text-xs text-alert-dark mt-1">
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
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-text-primary">
                Items ({initializedConfig.items.length})
              </label>
              <button
                onClick={addItem}
                className="btn btn-primary text-sm px-3 py-1.5"
              >
                + Add Item
              </button>
            </div>
            {initializedConfig.items.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 bg-surface text-center">
                <svg className="mx-auto h-12 w-12 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-text-secondary text-sm mb-3">No items yet</p>
                <button onClick={addItem} className="btn btn-primary">
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
                        <div className="ml-4 mt-1 text-xs text-text-secondary flex items-center gap-1">
                          <svg className="w-3 h-3 text-success" fill="currentColor" viewBox="0 0 20 20">
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
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-text-primary">
                Target Zones ({initializedConfig.targets.length})
              </label>
              <button
                onClick={addTarget}
                className="btn btn-success text-sm px-3 py-1.5"
              >
                + Add Target
              </button>
            </div>
            {initializedConfig.targets.length === 0 ? (
              <div className="border-2 border-dashed border-border rounded-lg p-8 bg-surface text-center">
                <svg className="mx-auto h-12 w-12 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-text-secondary text-sm mb-3">No targets yet</p>
                <button onClick={addTarget} className="btn btn-success">
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
            <div className="bg-white border-2 border-primary rounded-lg p-4 shadow-xl max-w-xs">
              <div className="flex items-center gap-3">
                {activeItem.imageUrl && (
                  <div className="w-10 h-10 rounded bg-surface flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <img
                      src={activeItem.imageUrl}
                      alt=""
                      className="w-full h-full object-cover border border-border"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `
                          <svg class="w-6 h-6 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        `;
                      }}
                    />
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm text-text-primary">{activeItem.content}</p>
                  <p className="text-xs text-text-secondary mt-0.5">
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
          <label className="block text-sm font-medium text-text-secondary">General Feedback (Optional)</label>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" title="This feedback will be shown to learners after they complete the timed challenge, regardless of their score. Use it to provide context, hints, or learning points.">?</span>
        </div>
        <GameRichTextEditor
          key="general-feedback-editor"
          content={localGeneralFeedback}
          onChange={(content: string) => {
            setLocalGeneralFeedback(content);
            onChange({ ...initializedConfig, generalFeedback: content });
          }}
          height={150}
          placeholder="Provide context or hints about the sorting challenge..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Provide context or hints about the sorting challenge</span>
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
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
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