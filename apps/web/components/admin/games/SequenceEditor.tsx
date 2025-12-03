// apps/web/components/admin/games/SequenceEditor.tsx
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
// TYPES (Aligned with games.ts)
// ============================================================================

type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type SequenceConfig = {
  instruction: string;
  items: SequenceItem[];
  correctOrder: string[];
  totalXp?: number;
  totalPoints?: number;
};

type SequenceEditorProps = {
  config: any;
  onChange: (newConfig: SequenceConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// SORTABLE ITEM COMPONENT
// ============================================================================

function SortableItem({ 
  item, 
  index,
  isSelected, 
  onSelect,
  isQuizQuestion,
  isCorrectOrder = false
}: { 
  item: SequenceItem; 
  index: number;
  isSelected: boolean; 
  onSelect: () => void;
  isQuizQuestion: boolean;
  isCorrectOrder?: boolean;
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
          ? isCorrectOrder 
            ? 'bg-green-50 border-green-500 shadow-md ring-2 ring-green-200'
            : 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200'
          : isCorrectOrder
            ? 'bg-white border-green-200 hover:border-green-300 hover:shadow-sm'
            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
        ${isDragging ? 'scale-105 shadow-lg' : ''}
      `}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Numbered badge */}
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 font-bold text-sm
            ${isCorrectOrder 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'}
          `}>
            {index + 1}
          </div>
          
          {/* Image (optional) */}
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
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm break-words">{item.content}</p>
            <p className="text-xs text-gray-500 mt-1">
              {isQuizQuestion ? (item.points || 10) : (item.xp || 10)} {isQuizQuestion ? 'pts' : 'XP'}
              {item.imageUrl && !imageError && ' • Has image'}
              {imageError && ' • Image failed'}
            </p>
          </div>
        </div>
        
        {isSelected && (
          <div className="flex-shrink-0">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              isCorrectOrder ? 'bg-green-600' : 'bg-blue-600'
            }`}></div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ITEM EDIT MODAL
// ============================================================================

function ItemEditModal({
  item,
  index,
  isQuizQuestion,
  onUpdate,
  onDelete,
  onClose,
  onSelectImage,
  onRemoveImage
}: {
  item: SequenceItem;
  index: number;
  isQuizQuestion: boolean;
  onUpdate: (updates: Partial<SequenceItem>) => void;
  onDelete: () => void;
  onClose: () => void;
  onSelectImage: () => void;
  onRemoveImage: () => void;
}) {
  const [content, setContent] = useState(item.content);
  const [reward, setReward] = useState(isQuizQuestion ? (item.points || 10) : (item.xp || 10));
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    if (!content?.trim()) {
      toast.error('Item content cannot be empty');
      return;
    }
    onUpdate({ 
      content: content.trim(),
      ...(isQuizQuestion ? { points: reward } : { xp: reward })
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Edit Item #{index + 1}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Put on safety goggles"
              rows={3}
            />
          </div>

          {/* Image */}
          <div>
            <label className="block text-sm font-medium mb-2">Image (Optional)</label>
            {item.imageUrl && !imageError ? (
              <div className="relative inline-block">
                <img 
                  src={item.imageUrl} 
                  alt="Preview"
                  className="w-32 h-32 rounded border object-cover"
                  onError={() => setImageError(true)}
                />
                <button
                  onClick={onRemoveImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                + Add Image
              </button>
            )}
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
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
          >
            Delete Item
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
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

export default function SequenceEditor({
  config,
  onChange,
  isQuizQuestion
}: SequenceEditorProps) {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [activeItem, setActiveItem] = useState<SequenceItem | null>(null);
  
  // Initialize config with proper structure
  const initializedConfig: SequenceConfig = {
    instruction: config.instruction || 'Arrange the following items in the correct order',
    items: config.items || [],
    correctOrder: config.correctOrder || [],
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  };

  // Local state for instruction
  const [localInstruction, setLocalInstruction] = useState(
    config.instruction || 'Arrange the following items in the correct order'
  );

  // Sync local instruction with config
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Arrange the following items in the correct order');
  }, [config.instruction]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================

  useEffect(() => {
    const total = initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 10) : (item.xp || 10));
    }, 0);
    
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      onChange({
        ...initializedConfig,
        ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initializedConfig.items.length,
    JSON.stringify(initializedConfig.items.map(item => 
      isQuizQuestion ? item.points : item.xp
    )),
    isQuizQuestion
  ]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getItemById = (id: string): SequenceItem | undefined => {
    return initializedConfig.items.find(item => item.id === id);
  };

  const totalReward = initializedConfig.items.reduce((sum, item) => {
    return sum + (isQuizQuestion ? (item.points || 10) : (item.xp || 10));
  }, 0);

  const missingCount = initializedConfig.items.length - initializedConfig.correctOrder.length;

  // ============================================================================
  // INSTRUCTION HANDLING
  // ============================================================================

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalInstruction(e.target.value);
  };

  const handleInstructionBlur = () => {
    const trimmed = localInstruction.trim();
    if (trimmed !== initializedConfig.instruction) {
      onChange({
        ...initializedConfig,
        instruction: trimmed || 'Arrange the following items in the correct order'
      });
    }
  };

  // ============================================================================
  // ITEM MANAGEMENT
  // ============================================================================

  const addItem = () => {
    const newItem: SequenceItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      content: 'New step',
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };

    const updatedConfig = {
      ...initializedConfig,
      items: [...initializedConfig.items, newItem],
      correctOrder: [...initializedConfig.correctOrder, newItem.id]
    };

    onChange(updatedConfig);
    setEditingItemIndex(initializedConfig.items.length);
    toast.success('Item added');
  };

  const updateItem = (index: number, updates: Partial<SequenceItem>) => {
    const updatedItems = [...initializedConfig.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };

    onChange({
      ...initializedConfig,
      items: updatedItems
    });
    toast.success('Item updated');
  };

  const deleteItem = (index: number) => {
    const itemId = initializedConfig.items[index].id;
    
    const updatedConfig = {
      ...initializedConfig,
      items: initializedConfig.items.filter((_, i) => i !== index),
      correctOrder: initializedConfig.correctOrder.filter(id => id !== itemId)
    };

    onChange(updatedConfig);
    setEditingItemIndex(null);
    toast.success('Item deleted');
  };

  // ============================================================================
  // IMAGE HANDLING
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
  // CORRECT ORDER DRAG AND DROP
  // ============================================================================

  const handleCorrectOrderDragStart = (event: DragStartEvent) => {
    const item = getItemById(event.active.id as string);
    setActiveItem(item || null);
  };

  const handleCorrectOrderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);

    if (over && active.id !== over.id) {
      const oldIndex = initializedConfig.correctOrder.indexOf(active.id as string);
      const newIndex = initializedConfig.correctOrder.indexOf(over.id as string);

      const newOrder = [...initializedConfig.correctOrder];
      const [movedItem] = newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, movedItem);

      onChange({
        ...initializedConfig,
        correctOrder: newOrder
      });
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Instruction */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Instruction <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="e.g., Arrange the safety procedures in the correct order"
        />
      </div>

      {/* InfoTooltip */}
      <InfoTooltip title="💡 Sequence Game Tips" position="right" width="lg">
        <ul className="space-y-2">
          <li>
            <strong>How it works:</strong> Players drag items to arrange them in the correct sequence.
          </li>
          <li>
            <strong>Creating items:</strong> Add sequence items in the left panel. Each item can have text, an optional image, and a reward value.
          </li>
          <li>
            <strong>Setting the solution:</strong> Drag items in the right panel to define the correct order. This is what players must match.
          </li>
          <li>
            <strong>Best practices:</strong>
            <ul className="ml-4 mt-1 space-y-1">
              <li>• Use 3-7 items for optimal difficulty</li>
              <li>• Make each step clear and distinct</li>
              <li>• Add images to make steps more memorable</li>
              <li>• Use consistent reward values across items</li>
            </ul>
          </li>
          <li>
            <strong>Common use cases:</strong> Safety procedures, manufacturing steps, emergency protocols, process workflows
          </li>
        </ul>
      </InfoTooltip>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* ===== LEFT: ALL ITEMS ===== */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              Sequence Items ({initializedConfig.items.length})
            </label>
            <button
              onClick={addItem}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              + Add Item
            </button>
          </div>

          {initializedConfig.items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
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
            <div className="space-y-2">
              {initializedConfig.items.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => setEditingItemIndex(index)}
                  className={`
                    border-2 rounded-lg p-3 cursor-pointer transition-all
                    ${editingItemIndex === index
                      ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200'
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}
                  `}
                >
                  <div className="flex items-center justify-between gap-3">
                    {item.imageUrl && (
                      <img 
                        src={item.imageUrl} 
                        alt={item.content}
                        className="w-12 h-12 rounded border object-cover flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm break-words">{item.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {isQuizQuestion ? (item.points || 10) : (item.xp || 10)} {isQuizQuestion ? 'pts' : 'XP'}
                        {item.imageUrl && ' • Has image'}
                      </p>
                    </div>
                    {editingItemIndex === index && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ===== RIGHT: CORRECT ORDER ===== */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Correct Sequence (Answer)
          </label>
          
          {initializedConfig.correctOrder.length === 0 ? (
            <div className="border-2 border-dashed border-green-300 rounded-lg p-8 bg-green-50 text-center">
              <svg className="mx-auto h-12 w-12 text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 text-sm mb-1 font-medium">Add items first</p>
              <p className="text-xs text-green-600">Then arrange them in the correct order</p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleCorrectOrderDragStart}
              onDragEnd={handleCorrectOrderDragEnd}
            >
              <div className="border-2 border-green-200 rounded-lg bg-green-50 overflow-hidden">
                <div className="p-2 bg-green-100 border-b border-green-200">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-green-800 text-sm">Solution Order</span>
                  </div>
                </div>
                
                <SortableContext
                  items={initializedConfig.correctOrder}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="p-2 space-y-2">
                    {initializedConfig.correctOrder.map((itemId, index) => {
                      const item = getItemById(itemId);
                      if (!item) return null;
                      return (
                        <SortableItem
                          key={itemId}
                          item={item}
                          index={index}
                          isSelected={editingItemIndex !== null && initializedConfig.items[editingItemIndex]?.id === itemId}
                          onSelect={() => {
                            const idx = initializedConfig.items.findIndex(i => i.id === itemId);
                            if (idx !== -1) setEditingItemIndex(idx);
                          }}
                          isQuizQuestion={isQuizQuestion}
                          isCorrectOrder={true}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeItem && (
                    <div className="bg-white border-2 border-green-500 rounded-lg p-3 shadow-2xl max-w-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full flex-shrink-0 font-bold text-sm">
                          {initializedConfig.correctOrder.indexOf(activeItem.id) + 1}
                        </div>
                        {activeItem.imageUrl && (
                          <img 
                            src={activeItem.imageUrl} 
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <p className="font-medium text-sm">{activeItem.content}</p>
                      </div>
                    </div>
                  )}
                </DragOverlay>
              </div>
            </DndContext>
          )}
        </div>
      </div>
      
      {/* Warning for missing items */}
      {missingCount > 0 && (
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-amber-700">
              {missingCount} item{missingCount !== 1 ? 's' : ''} missing from correct order
            </p>
          </div>
        </div>
      )}

      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={initializedConfig.items.length === 0}
        emptyMessage="⚠️ Add sequence items to calculate rewards and finalize the game."
        items={[
          {
            label: 'Total Items',
            value: initializedConfig.items.length
          },
          {
            label: 'In Sequence',
            value: initializedConfig.correctOrder.length,
            highlight: initializedConfig.correctOrder.length === initializedConfig.items.length
          },
          {
            label: 'Total Reward',
            value: `${totalReward} ${isQuizQuestion ? 'pts' : 'XP'}`,
            highlight: true
          }
        ]}
      />

      {/* Modals */}
      {editingItemIndex !== null && !showImageSelector && (
        <ItemEditModal
          item={initializedConfig.items[editingItemIndex]}
          index={editingItemIndex}
          isQuizQuestion={isQuizQuestion}
          onUpdate={(updates) => updateItem(editingItemIndex, updates)}
          onDelete={() => deleteItem(editingItemIndex)}
          onClose={() => setEditingItemIndex(null)}
          onSelectImage={handleSelectImage}
          onRemoveImage={handleRemoveImage}
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