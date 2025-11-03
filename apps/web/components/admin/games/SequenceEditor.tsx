// apps/web/components/admin/games/SequenceEditor.tsx
'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SequenceEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

type Item = {
  id: string;
  text: string;
};

function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

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
  
  // Initialize config
  const initializedConfig = {
    instruction: config.instruction || 'Arrange the items in the correct order',
    items: config.items || [],
    correctOrder: config.correctOrder || [],
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  
  // Instruction update
  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      instruction: e.target.value
    });
  };
  
  // Points/XP update
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion ? { points: value } : { xp: value })
    });
  };
  
  // Item functions
  const addItem = () => {
    if (!newItemText.trim()) return;
    
    const newItem: Item = {
      id: `item_${Date.now()}`,
      text: newItemText.trim()
    };
    
    const newItems = [...initializedConfig.items, newItem];
    
    // Also update correctOrder to match current item order
    onChange({
      ...initializedConfig,
      items: newItems,
      correctOrder: newItems.map(item => item.id)
    });
    
    setNewItemText('');
    setIsAddingItem(false);
  };
  
  const updateItem = (index: number, updates: Partial<Item>) => {
    const newItems = [...initializedConfig.items];
    newItems[index] = { ...newItems[index], ...updates };
    
    // Update the ID in correctOrder as well if it changed
    const oldId = initializedConfig.items[index].id;
    if (updates.id && updates.id !== oldId) {
      const newCorrectOrder = [...initializedConfig.correctOrder];
      const orderIndex = newCorrectOrder.indexOf(oldId);
      if (orderIndex >= 0) {
        newCorrectOrder[orderIndex] = updates.id;
        onChange({
          ...initializedConfig,
          items: newItems,
          correctOrder: newCorrectOrder
        });
        return;
      }
    }
    
    onChange({
      ...initializedConfig,
      items: newItems
    });
  };
  
  const deleteItem = (index: number) => {
    const newItems = [...initializedConfig.items];
    const removedItemId = newItems[index].id;
    newItems.splice(index, 1);
    
    // Remove from correctOrder as well
    const newCorrectOrder = initializedConfig.correctOrder.filter(id => id !== removedItemId);
    
    onChange({
      ...initializedConfig,
      items: newItems,
      correctOrder: newCorrectOrder
    });
    
    setSelectedItemIndex(null);
  };
  
  // Reorder items
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = initializedConfig.items.findIndex(item => item.id === active.id);
      const newIndex = initializedConfig.items.findIndex(item => item.id === over.id);
      
      const newItems = [...initializedConfig.items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);
      
      onChange({
        ...initializedConfig,
        items: newItems
      });
    }
  };
  
  // Update correct order
  const handleCorrectOrderDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = initializedConfig.correctOrder.indexOf(active.id);
      const newIndex = initializedConfig.correctOrder.indexOf(over.id);
      
      const newCorrectOrder = [...initializedConfig.correctOrder];
      const [movedItemId] = newCorrectOrder.splice(oldIndex, 1);
      newCorrectOrder.splice(newIndex, 0, movedItemId);
      
      onChange({
        ...initializedConfig,
        correctOrder: newCorrectOrder
      });
    }
  };
  
  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Instruction / Question
        </label>
        <textarea
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Items</h3>
            <button
              onClick={() => setIsAddingItem(true)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
            >
              + Add Item
            </button>
          </div>
          
          {isAddingItem ? (
            <div className="border rounded-md p-3 bg-gray-50 mb-3">
              <input
                type="text"
                placeholder="Item text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-2"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingItem(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addItem}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Item
                </button>
              </div>
            </div>
          ) : null}
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={initializedConfig.items.map((item: Item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {initializedConfig.items.length === 0 ? (
                <div className="border border-dashed rounded-md p-4 text-center text-gray-500">
                  No items added yet
                </div>
              ) : (
                <div className="space-y-2">
                  {initializedConfig.items.map((item: Item, index: number) => (
                    <SortableItem key={item.id} id={item.id}>
                      <div
                        className={`border rounded-md p-3 cursor-grab ${
                          selectedItemIndex === index ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedItemIndex(index)}
                      >
                        <div className="flex justify-between">
                          <span>{item.text}</span>
                          <span className="text-gray-400">{index + 1}</span>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              )}
            </SortableContext>
          </DndContext>
          
          {selectedItemIndex !== null && (
            <div className="mt-4 border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium mb-2">Edit Item</h4>
              <div>
                <label className="block text-sm mb-1">Text</label>
                <input
                  type="text"
                  value={initializedConfig.items[selectedItemIndex].text}
                  onChange={(e) => updateItem(selectedItemIndex, { text: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md mb-3"
                />
                <button
                  onClick={() => deleteItem(selectedItemIndex)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                >
                  Delete Item
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Correct Order</h3>
          <p className="text-sm text-gray-600 mb-3">
            Drag to rearrange items in the correct order. This is the solution.
          </p>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCorrectOrderDragEnd}
          >
            <SortableContext
              items={initializedConfig.correctOrder}
              strategy={verticalListSortingStrategy}
            >
              {initializedConfig.correctOrder.length === 0 ? (
                <div className="border border-dashed rounded-md p-4 text-center text-gray-500">
                  Add items first to set the correct order
                </div>
              ) : (
                <div className="border rounded-md bg-green-50">
                  <div className="p-2 bg-green-100 border-b font-medium text-green-800">
                    Correct Sequence (Answer)
                  </div>
                  <div className="p-2 space-y-2">
                    {initializedConfig.correctOrder.map((itemId: string, index: number) => {
                      const item = initializedConfig.items.find(i => i.id === itemId);
                      if (!item) return null;
                      
                      return (
                        <SortableItem key={itemId} id={itemId}>
                          <div className="border border-green-200 rounded-md p-3 bg-white cursor-grab hover:bg-gray-50">
                            <div className="flex justify-between">
                              <span>{item.text}</span>
                              <span className="text-green-600 font-medium">{index + 1}</span>
                            </div>
                          </div>
                        </SortableItem>
                      );
                    })}
                  </div>
                </div>
              )}
            </SortableContext>
          </DndContext>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {isQuizQuestion ? 'Points' : 'XP'} for this game
          </label>
          <input
            type="number"
            min="0"
            value={isQuizQuestion ? initializedConfig.points : initializedConfig.xp}
            onChange={handlePointsChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        
        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200">
          <h3 className="font-medium text-yellow-800 mb-1">Game Preview</h3>
          <p className="text-sm text-yellow-700">
            Items: {initializedConfig.items.length}
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Users will see these items in a scrambled order and need to arrange them correctly.
            {initializedConfig.items.length < 3 && 
              " Tip: Add at least 3-5 items for a good challenge."}
          </p>
        </div>
      </div>
    </div>
  );
}