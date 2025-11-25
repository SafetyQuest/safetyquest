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
import ImageSelector from '../ImageSelector';

// ============================================================================
// TYPES (Aligned with games.ts)
// ============================================================================

type SequenceItem = {
  id: string;
  content: string;        // ✅ 'content' (not 'text') — matches games.ts
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
            <p className="font-medium text-sm break-words">{item.content}</p> {/* ✅ 'content' */}
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
  const [content, setContent] = useState(item.content);        // ✅ 'content'
  const [reward, setReward] = useState(isQuizQuestion ? (item.points || 10) : (item.xp || 10));
  const [imageError, setImageError] = useState(false);

  const handleSave = () => {
    if (!content?.trim()) {
      toast.error('Item content cannot be empty');
      return;
    }
    onUpdate({ 
      content: content.trim(),     // ✅ 'content'
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
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Item Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Enter the step or item..."
              autoFocus
            />
          </div>

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
              Reward for correct placement in sequence
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Image (Optional)
            </label>
            {item.imageUrl ? (
              <div className="space-y-2">
                <div className="border rounded-md overflow-hidden bg-gray-50">
                  {imageError ? (
                    <div className="p-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-600">Failed to load image</p>
                    </div>
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt="Item preview"
                      className="w-full max-h-64 object-contain"
                      onError={() => setImageError(true)}
                    />
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSelectImage}
                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-md hover:bg-blue-100"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={onRemoveImage}
                    className="px-3 py-2 bg-red-50 text-red-600 text-sm rounded-md hover:bg-red-100"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onSelectImage}
                className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 transition-all"
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
              if (confirm('Are you sure you want to delete this item?')) {
                onDelete();
              }
            }}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 text-sm"
          >
            Delete Item
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

export default function SequenceEditor({
  config,
  onChange,
  isQuizQuestion
}: SequenceEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Initialize config — use 'content', not 'text'
  const initializedConfig: SequenceConfig = {
    instruction: config.instruction || 'Arrange the items in the correct order',
    items: (config.items || []).map((item: any) => ({
      ...item,
      content: item.content || item.text || '', // ✅ backward compatibility
    })),
    correctOrder: config.correctOrder || [],
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  };
  
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  
  const activeItem = activeId 
    ? initializedConfig.items.find(item => item.id === activeId)
    : null;
  
  // ============================================================================
  // AUTO-CALCULATE TOTAL REWARD
  // ============================================================================
  
  useEffect(() => {
    const total = initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 10) : (item.xp || 10));
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
  // HANDLERS
  // ============================================================================
  
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      instruction: e.target.value
    });
  };
  
  const addItem = () => {
    const newItem: SequenceItem = {
      id: `item_${Date.now()}`,
      content: `Step ${initializedConfig.items.length + 1}`, // ✅ 'content'
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };
    
    const newItems = [...initializedConfig.items, newItem];
    const newCorrectOrder = [...initializedConfig.correctOrder, newItem.id];
    
    onChange({
      ...initializedConfig,
      items: newItems,
      correctOrder: newCorrectOrder
    });
    
    setEditingItemIndex(newItems.length - 1);
    toast.success('Item added! Edit content & reward.', { duration: 2000 });
  };
  
  const updateItem = (index: number, updates: Partial<SequenceItem>) => {
    const newItems = [...initializedConfig.items];
    newItems[index] = { ...newItems[index], ...updates };
    
    onChange({
      ...initializedConfig,
      items: newItems
    });
    
    toast.success('Item updated', { duration: 1500 });
  };
  
  const deleteItem = (index: number) => {
    const newItems = [...initializedConfig.items];
    const removedItemId = newItems[index].id;
    newItems.splice(index, 1);
    
    const newCorrectOrder = initializedConfig.correctOrder.filter(id => id !== removedItemId);
    
    onChange({
      ...initializedConfig,
      items: newItems,
      correctOrder: newCorrectOrder
    });
    
    setEditingItemIndex(null);
    toast.success('Item deleted', { duration: 1500 });
  };
  
  const handleCorrectOrderDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleCorrectOrderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = initializedConfig.correctOrder.indexOf(active.id as string);
      const newIndex = initializedConfig.correctOrder.indexOf(over.id as string);
      
      const newCorrectOrder = [...initializedConfig.correctOrder];
      const [movedItemId] = newCorrectOrder.splice(oldIndex, 1);
      newCorrectOrder.splice(newIndex, 0, movedItemId);
      
      onChange({
        ...initializedConfig,
        correctOrder: newCorrectOrder
      });
      
      toast.success(`✅ Repositioned to #${newIndex + 1}`, { 
        duration: 1500,
        icon: '↕️' 
      });
    }
    
    setActiveId(null);
  };
  
  const handleSelectImage = () => setShowImageSelector(true);
  
  const handleImageSelect = (url: string) => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, { imageUrl: url });
      setShowImageSelector(false);
      toast.success('Image added');
    }
  };
  
  const handleRemoveImage = () => {
    if (editingItemIndex !== null) {
      updateItem(editingItemIndex, { imageUrl: '' });
      toast.success('Image removed');
    }
  };
  
  const getItemById = (id: string) => initializedConfig.items.find(item => item.id === id);
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  const totalReward = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
  const missingCount = initializedConfig.items.length - initializedConfig.correctOrder.length;

  return (
    <div>
      {/* Instruction */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          rows={2}
          placeholder="e.g., Arrange the lockout/tagout steps in order"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== LEFT: ITEM LIBRARY ===== */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">
              Item Library ({initializedConfig.items.length})
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
                      <p className="font-medium text-sm break-words">{item.content}</p> {/* ✅ */}
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

          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 font-medium mb-1">💡 Tips:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Click</strong> to edit (content, reward, image)</li>
              <li>• Items here are unordered</li>
              <li>• Arrange sequence in the panel on the right →</li>
            </ul>
          </div>
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
                          {initializedConfig.correctOrder.indexOf(activeItem.id) + 1}  {/* ✅ Find position in correctOrder */}
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

          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 font-medium mb-1">💡 Tips:</p>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• <strong>Drag</strong> to reorder steps</li>
              <li>• Numbers show correct position</li>
              <li>• All items must be used</li>
            </ul>
          </div>
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
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Game Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Items</p>
            <p className="font-semibold text-lg">{initializedConfig.items.length}</p>
          </div>
          <div>
            <p className="text-gray-600">In Sequence</p>
            <p className="font-semibold text-lg">{initializedConfig.correctOrder.length}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Reward</p>
            <p className="font-semibold text-lg">
              {totalReward || 0} {isQuizQuestion ? 'pts' : 'XP'}
            </p>
          </div>
        </div>
      </div>

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
        <ImageSelector
          onSelect={(url) => handleImageSelect(url)}
          onClose={() => setShowImageSelector(false)}
          accept="image/*"
        />
      )}
    </div>
  );
}