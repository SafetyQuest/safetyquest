// apps/web/components/admin/games/SequenceEditor.tsx
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

type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
  explanation?: string;  // ✅ NEW: Per-item explanation (300 char limit)
  xp?: number;
  points?: number;
};

type SequenceConfig = {
  instruction: string;
  items: SequenceItem[];
  correctOrder: string[];
  generalFeedback?: string;  // ✅ NEW: General feedback (500 char limit)
  totalXp?: number;
  totalPoints?: number;
};

type SequenceEditorProps = {
  config: any;
  onChange: (newConfig: SequenceConfig) => void;
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
              {item.explanation && ' • Has explanation'}
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
// ITEM EDIT MODAL COMPONENT
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
  const [editingContent, setEditingContent] = useState<string>(item.content);
  const [editingExplanation, setEditingExplanation] = useState<string>(item.explanation || '');

  // Sync content and explanation when item changes
  useEffect(() => {
    setEditingContent(item.content);
    setEditingExplanation(item.explanation || '');
  }, [item.content, item.explanation]);

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
              Content <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              onBlur={() => {
                if (editingContent.trim() !== item.content) {
                  onUpdate({ content: editingContent.trim() });
                }
              }}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Put on safety goggles"
            />
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
                const value = parseInt(e.target.value) || 1;
                onUpdate(isQuizQuestion ? { points: value } : { xp: value });
              }}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-600 mt-1">
              Reward for this step in the sequence
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

          {/* Explanation Field */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium">
                Explanation (Optional)
              </label>
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 text-gray-600 text-xs cursor-help" title="Help learners understand why this step is important. Shown after submission.">?</span>
            </div>
            <GameRichTextEditor
              key={`item-explanation-${index}`}
              content={editingExplanation}
              onChange={(html) => {
                setEditingExplanation(html);
                onUpdate({ explanation: html });
              }}
              height={120}
              placeholder="Explain why this step comes at this point in the sequence..."
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
// MAIN EDITOR COMPONENT
// ============================================================================

export default function SequenceEditor({ config, onChange, isQuizQuestion }: SequenceEditorProps) {
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [activeItem, setActiveItem] = useState<SequenceItem | null>(null);
  const [dragContext, setDragContext] = useState<'items' | 'correctOrder' | null>(null);

  // Initialize config with proper defaults
  const initializedConfig: SequenceConfig = useMemo(() => ({
    instruction: config.instruction || 'Arrange these items in the correct order',
    items: (config.items || []).map((item: SequenceItem, idx: number) => ({
      ...item,
      id: item.id || `item-${Date.now()}-${idx}`,
      explanation: item.explanation || '',
    })),
    correctOrder: config.correctOrder || [],
    generalFeedback: config.generalFeedback || '',
    ...(isQuizQuestion 
      ? { totalPoints: config.totalPoints || 0 }
      : { totalXp: config.totalXp || 0 }
    )
  }), [config, isQuizQuestion]);

  // Local state for editing
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Arrange these items in the correct order');
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState(config.generalFeedback || '');

  // Sync local state when config changes
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Arrange these items in the correct order');
  }, [config.instruction]);

  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);

  // Auto-calculate total rewards
  useEffect(() => {
    const total = initializedConfig.items.reduce((sum, item) => {
      return sum + (isQuizQuestion ? (item.points || 0) : (item.xp || 0));
    }, 0);
    
    const currentTotal = isQuizQuestion ? initializedConfig.totalPoints : initializedConfig.totalXp;
    if (currentTotal !== total) {
      onChange({
        ...initializedConfig,
        ...(isQuizQuestion ? { totalPoints: total } : { totalXp: total })
      });
    }
  }, [
    initializedConfig.items.length,
    JSON.stringify(initializedConfig.items.map(i => isQuizQuestion ? i.points : i.xp)),
    isQuizQuestion
  ]);

  // Setup drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate totals
  const totalReward = initializedConfig.items.reduce((sum, item) => 
    sum + (isQuizQuestion ? (item.points || 10) : (item.xp || 10)), 0
  );

  const missingCount = initializedConfig.items.length - initializedConfig.correctOrder.length;

  const getItemById = (id: string) => initializedConfig.items.find(item => item.id === id);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const addItem = () => {
    const newItem: SequenceItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content: `Step ${initializedConfig.items.length + 1}`,
      ...(isQuizQuestion ? { points: 10 } : { xp: 10 })
    };
    
    const newItems = [...initializedConfig.items, newItem];
    const newCorrectOrder = [...initializedConfig.correctOrder, newItem.id];
    
    onChange({
      ...initializedConfig,
      items: newItems,
      correctOrder: newCorrectOrder
    });
    
    setSelectedItemIndex(newItems.length - 1);
  };

  const updateItem = (index: number, updates: Partial<SequenceItem>) => {
    if (index < 0 || index >= initializedConfig.items.length) return;
    
    const newItems = [...initializedConfig.items];
    newItems[index] = { ...newItems[index], ...updates };
    
    onChange({
      ...initializedConfig,
      items: newItems
    });
  };

  const deleteItem = (index: number) => {
    if (index < 0 || index >= initializedConfig.items.length) return;
    
    const itemToDelete = initializedConfig.items[index];
    const newItems = initializedConfig.items.filter((_, i) => i !== index);
    const newCorrectOrder = initializedConfig.correctOrder.filter(id => id !== itemToDelete.id);
    
    onChange({
      ...initializedConfig,
      items: newItems,
      correctOrder: newCorrectOrder
    });
    
    setSelectedItemIndex(null);
    toast.success('Item deleted');
  };

  // ============================================================================
  // IMAGE HANDLING
  // ============================================================================

  const handleSelectImage = () => {
    setShowImageSelector(true);
  };

  const handleImageSelect = (url: string) => {
    if (selectedItemIndex !== null) {
      updateItem(selectedItemIndex, { imageUrl: url });
      toast.success('Image added');
    }
    setShowImageSelector(false);
  };

  const handleRemoveImage = () => {
    if (selectedItemIndex !== null) {
      updateItem(selectedItemIndex, { imageUrl: undefined });
      toast.success('Image removed');
    }
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS - ITEMS LIST
  // ============================================================================

  const handleItemsDragStart = (event: DragStartEvent) => {
    setDragContext('items');
    const activeId = event.active.id as string;
    const item = initializedConfig.items.find(i => i.id === activeId);
    setActiveItem(item || null);
  };

  const handleItemsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDragContext(null);
    setActiveItem(null);
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = initializedConfig.items.findIndex(i => i.id === active.id);
    const newIndex = initializedConfig.items.findIndex(i => i.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedItems = arrayMove(initializedConfig.items, oldIndex, newIndex);
      
      onChange({
        ...initializedConfig,
        items: reorderedItems
      });
      
      // Update selected index if the selected item was moved
      if (selectedItemIndex === oldIndex) {
        setSelectedItemIndex(newIndex);
      } else if (selectedItemIndex !== null) {
        // Adjust selected index if another item was moved
        if (oldIndex < selectedItemIndex && newIndex >= selectedItemIndex) {
          setSelectedItemIndex(selectedItemIndex - 1);
        } else if (oldIndex > selectedItemIndex && newIndex <= selectedItemIndex) {
          setSelectedItemIndex(selectedItemIndex + 1);
        }
      }
      
      toast.success('Items reordered');
    }
  };

  // ============================================================================
  // DRAG AND DROP HANDLERS - CORRECT ORDER
  // ============================================================================

  const handleCorrectOrderDragStart = (event: DragStartEvent) => {
    setDragContext('correctOrder');
    const activeId = event.active.id as string;
    const item = getItemById(activeId);
    setActiveItem(item || null);
  };

  const handleCorrectOrderDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setDragContext(null);
    setActiveItem(null);
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = initializedConfig.correctOrder.indexOf(active.id as string);
    const newIndex = initializedConfig.correctOrder.indexOf(over.id as string);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const reorderedCorrectOrder = arrayMove(initializedConfig.correctOrder, oldIndex, newIndex);
      
      onChange({
        ...initializedConfig,
        correctOrder: reorderedCorrectOrder
      });
      
      toast.success('Sequence reordered');
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* Instruction */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Instructions <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={localInstruction}
          onChange={(e) => setLocalInstruction(e.target.value)}
          onBlur={() => {
            if (localInstruction.trim() !== config.instruction) {
              onChange({ ...initializedConfig, instruction: localInstruction.trim() });
            }
          }}
          className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Put these steps in the correct order"
        />
        
        <InfoTooltip title="💡 Sequence Game Tips">
          <ul className="space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Add items</strong> using the "+ Add Item" button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Drag items</strong> in the left list to reorder them</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Arrange correct order</strong> by dragging items in the right (green) panel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 font-bold flex-shrink-0">•</span>
              <span><strong>Click any item</strong> to edit its content, image, and explanation</span>
            </li>
          </ul>
        </InfoTooltip>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {/* ===== LEFT: ALL ITEMS (with drag-and-drop) ===== */}
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
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleItemsDragStart}
              onDragEnd={handleItemsDragEnd}
            >
              <SortableContext
                items={initializedConfig.items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {initializedConfig.items.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      isSelected={selectedItemIndex === index}
                      onSelect={() => setSelectedItemIndex(index)}
                      isQuizQuestion={isQuizQuestion}
                      isCorrectOrder={false}
                    />
                  ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeItem && dragContext === 'items' && (
                  <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-2xl max-w-xs">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex-shrink-0 font-bold text-sm">
                        {initializedConfig.items.findIndex(i => i.id === activeItem.id) + 1}
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
            </DndContext>
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
                          isSelected={selectedItemIndex !== null && initializedConfig.items[selectedItemIndex]?.id === itemId}
                          onSelect={() => {
                            const idx = initializedConfig.items.findIndex(i => i.id === itemId);
                            if (idx !== -1) setSelectedItemIndex(idx);
                          }}
                          isQuizQuestion={isQuizQuestion}
                          isCorrectOrder={true}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeItem && dragContext === 'correctOrder' && (
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

      {/* ✅ NEW: General Feedback */}
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
          placeholder="Provide context or hints about the correct sequence..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-gray-500">
            Provide context or hints about the correct sequence
          </span>
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

      {/* Item Edit Modal */}
      {selectedItemIndex !== null && (
        <ItemEditModal
          item={initializedConfig.items[selectedItemIndex]}
          index={selectedItemIndex}
          isQuizQuestion={isQuizQuestion}
          onUpdate={(updates) => updateItem(selectedItemIndex, updates)}
          onDelete={() => deleteItem(selectedItemIndex)}
          onClose={() => setSelectedItemIndex(null)}
          onSelectImage={handleSelectImage}
          onRemoveImage={handleRemoveImage}
        />
      )}

      {/* Image Selector Modal */}
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