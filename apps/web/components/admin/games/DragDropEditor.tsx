// apps/web/components/admin/games/DragDropEditor.tsx
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
import ImageSelector from '../ImageSelector';

// ============================================================================
// TYPES (Aligned with games.ts)
// ============================================================================

type DragDropItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
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
  totalXp?: number;
  totalPoints?: number;
};

type DragDropEditorProps = {
  config: any;
  onChange: (newConfig: DragDropConfig) => void;
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
  const [localContent, setLocalContent] = useState(item.content);
  const [localReward, setLocalReward] = useState(isQuizQuestion ? item.points : item.xp);
  const [localTargetId, setLocalTargetId] = useState(item.correctTargetId);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!item.imageUrl); // Start as true only if there's an image

  const handleSave = () => {
    const updates: Partial<DragDropItem> = {
      content: localContent,
      correctTargetId: localTargetId,
      ...(isQuizQuestion ? { points: localReward } : { xp: localReward })
    };
    onUpdate(updates);
    onClose();
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
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
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Spilled oil on floor"
              autoFocus
            />
          </div>

          {/* Reward */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={localReward}
              onChange={(e) => setLocalReward(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Reward for correctly placing this item
            </p>
          </div>

          {/* Target Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Correct Target <span className="text-red-500">*</span>
            </label>
            <select
              value={localTargetId}
              onChange={(e) => setLocalTargetId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Select Target --</option>
              {targets.map(target => (
                <option key={target.id} value={target.id}>
                  {target.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Or drag the item to a target zone
            </p>
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image (Optional)
            </label>
            {item.imageUrl ? (
              <div className="space-y-2">
                <div className="w-full rounded-lg border border-gray-300 overflow-hidden bg-gray-50 flex items-center justify-center relative" style={{ minHeight: '200px' }}>
                  {/* Loading overlay */}
                  {imageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-sm text-gray-500">Loading image...</p>
                    </div>
                  )}
                  
                  {/* Error overlay */}
                  {imageError && !imageLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50 z-10">
                      <svg className="w-16 h-16 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <p className="text-sm font-medium text-gray-700 mb-1">Failed to load image</p>
                      <p className="text-xs text-gray-500 mb-3">The image may be deleted or unavailable</p>
                      <button
                        onClick={() => {
                          setImageError(false);
                          setImageLoading(true);
                          // Force reload by adding timestamp
                          const img = new Image();
                          img.src = item.imageUrl + '?retry=' + Date.now();
                          img.onload = handleImageLoad;
                          img.onerror = handleImageError;
                        }}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors font-medium"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  
                  {/* Actual image - always rendered */}
                  <img
                    src={item.imageUrl}
                    alt="Item preview"
                    className="max-w-full max-h-[300px] object-contain"
                    style={{ opacity: imageLoading || imageError ? 0 : 1 }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSelectImage}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors font-medium"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-lg hover:bg-red-100 transition-colors font-medium"
                  >
                    Remove
                  </button>
                </div>
                {imageError && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Consider uploading a new image
                  </p>
                )}
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-sm text-gray-600 hover:text-blue-600 font-medium"
              >
                <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Image
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t flex justify-between items-center">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Item
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
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
  const [localLabel, setLocalLabel] = useState(target.label);

  const handleSave = () => {
    onUpdate({ label: localLabel });
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
          <div className="flex justify-between items-center">
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
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Label <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={localLabel}
              onChange={(e) => setLocalLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Slip Prevention Measures"
              autoFocus
            />
          </div>

          {/* Assigned Items Display */}
          <div className="pt-3 border-t">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Assigned Items ({assignedItems.length})
            </p>
            {assignedItems.length === 0 ? (
              <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                No items assigned yet
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {assignedItems.map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded-lg border border-green-200">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {item.imageUrl && (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <img 
                          src={item.imageUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = `
                              <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            `;
                          }}
                        />
                      </div>
                    )}
                    <span className="text-gray-700 flex-1 truncate">{item.content}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t flex justify-between items-center">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Target
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
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
// MAIN EDITOR COMPONENT
// ============================================================================

export default function DragDropEditor({
  config,
  onChange,
  isQuizQuestion
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

  // Initialize config
  const initializedConfig: DragDropConfig = {
    instruction: config.instruction || 'Drag each item to its correct target zone',
    items: config.items || [],
    targets: config.targets || [],
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  };

  // State
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingTargetIndex, setEditingTargetIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);

  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================
  
  useEffect(() => {
    const total = initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);
    
    const updatedConfig = {
      ...initializedConfig,
      ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
    };
    
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      onChange(updatedConfig);
    }
  }, [initializedConfig.items, isQuizQuestion]);

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
    // Auto-open edit modal for new item
    setEditingItemIndex(newConfig.items.length - 1);
  };
  
  const updateItem = (index: number, updates: Partial<DragDropItem>) => {
    if (index < 0 || index >= initializedConfig.items.length) {
      console.warn('updateItem: invalid index', index);
      return;
    }
    
    const currentItem = initializedConfig.items[index];
    const newItem = { ...currentItem, ...updates };
    
    // Check for duplicates if content is being updated
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
    
    // If this is the first target, assign all unassigned items to it
    if (initializedConfig.targets.length === 0 && initializedConfig.items.length > 0) {
      const updatedItems = initializedConfig.items.map(item => ({
        ...item,
        correctTargetId: item.correctTargetId || newTarget.id
      }));
      onChange({
        ...newConfig,
        items: updatedItems
      });
    }
    
    // Auto-open edit modal for new target
    setEditingTargetIndex(newConfig.targets.length - 1);
  };
  
  const updateTarget = (index: number, updates: Partial<DragDropTarget>) => {
    if (index < 0 || index >= initializedConfig.targets.length) {
      console.warn('updateTarget: invalid index', index);
      return;
    }
    
    const currentTarget = initializedConfig.targets[index];
    const newTarget = { ...currentTarget, ...updates };
    
    // Check for duplicates if label is being updated
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
    const newTargets = initializedConfig.targets.filter((_, i) => i !== index);
    
    // Reassign orphaned items to first remaining target or clear
    const newItems = initializedConfig.items.map(item => 
      item.correctTargetId === targetId 
        ? { ...item, correctTargetId: newTargets[0]?.id || '' }
        : item
    );
    
    onChange({
      ...initializedConfig,
      targets: newTargets,
      items: newItems
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

    // Check if dragging an item over a target
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
  };

  // ============================================================================
  // KEYBOARD SHORTCUTS
  // ============================================================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in modal
      if (editingItemIndex === null && editingTargetIndex === null) {
        if (e.key === 'Escape') {
          // Clear any selections
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
    onChange({
      ...initializedConfig,
      instruction: e.target.value
    });
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

  const getTargetForItem = (item: DragDropItem) => {
    return initializedConfig.targets.find(t => t.id === item.correctTargetId);
  };

  const getAssignedItemsForTarget = (targetId: string) => {
    return initializedConfig.items.filter(item => item.correctTargetId === targetId);
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  const totalReward = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
  const unassignedCount = getUnassignedItemsCount();
  const activeItem = activeId ? initializedConfig.items.find(i => i.id === activeId) : null;

  return (
    <div>
      {/* Instruction */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
          placeholder="e.g., Drag each safety hazard to its appropriate control measure"
        />
      </div>

      {/* Total Reward Display */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-blue-900">
            Total {isQuizQuestion ? 'Points' : 'XP'} for this game:
          </span>
          <span className="text-lg font-bold text-blue-600">
            {totalReward || 0}
          </span>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Automatically calculated from all item rewards
        </p>
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
                Click items to edit and assign them to targets
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
                      {/* Show current assignment */}
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

            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 font-medium mb-1">💡 Tips:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Drag</strong> items to targets to assign them</li>
                <li>• <strong>Click</strong> an item to edit its properties</li>
                <li>• Add images to make items more visual</li>
              </ul>
            </div>
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

            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 font-medium mb-1">💡 Tips:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <strong>Drop zone</strong> - items can be dragged here</li>
                <li>• <strong>Click</strong> a target to edit its label</li>
                <li>• Multiple items can have the same target</li>
              </ul>
            </div>
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
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Game Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Items</p>
            <p className="font-semibold text-lg">{initializedConfig.items.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Targets</p>
            <p className="font-semibold text-lg">{initializedConfig.targets.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Assigned</p>
            <p className="font-semibold text-lg">
              {initializedConfig.items.length - unassignedCount} / {initializedConfig.items.length}
            </p>
          </div>
        </div>
      </div>

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
        <ImageSelector
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
          accept="image/*"
        />
      )}
    </div>
  );
}