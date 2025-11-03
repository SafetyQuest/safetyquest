// apps/web/components/admin/games/DragDropEditor.tsx
'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type DragDropEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

type Item = {
  id: string;
  text: string;
  imageUrl?: string;
};

type Target = {
  id: string;
  text: string;
  correctItemId: string;
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

export default function DragDropEditor({
  config,
  onChange,
  isQuizQuestion
}: DragDropEditorProps) {
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
    instruction: config.instruction || 'Drag items to their correct targets',
    items: config.items || [],
    targets: config.targets || [],
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [selectedTargetIndex, setSelectedTargetIndex] = useState<number | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingTarget, setIsAddingTarget] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newTargetText, setNewTargetText] = useState('');
  
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
    
    onChange({
      ...initializedConfig,
      items: [...initializedConfig.items, newItem]
    });
    
    setNewItemText('');
    setIsAddingItem(false);
  };
  
  const updateItem = (index: number, updates: Partial<Item>) => {
    const newItems = [...initializedConfig.items];
    newItems[index] = { ...newItems[index], ...updates };
    
    onChange({
      ...initializedConfig,
      items: newItems
    });
  };
  
  const deleteItem = (index: number) => {
    const newItems = [...initializedConfig.items];
    const removedItemId = newItems[index].id;
    newItems.splice(index, 1);
    
    // Also update targets that used this item
    const newTargets = initializedConfig.targets.map(target => {
      if (target.correctItemId === removedItemId) {
        return { ...target, correctItemId: '' };
      }
      return target;
    });
    
    onChange({
      ...initializedConfig,
      items: newItems,
      targets: newTargets
    });
    
    setSelectedItemIndex(null);
  };
  
  // Target functions
  const addTarget = () => {
    if (!newTargetText.trim()) return;
    
    const newTarget: Target = {
      id: `target_${Date.now()}`,
      text: newTargetText.trim(),
      correctItemId: ''
    };
    
    onChange({
      ...initializedConfig,
      targets: [...initializedConfig.targets, newTarget]
    });
    
    setNewTargetText('');
    setIsAddingTarget(false);
  };
  
  const updateTarget = (index: number, updates: Partial<Target>) => {
    const newTargets = [...initializedConfig.targets];
    newTargets[index] = { ...newTargets[index], ...updates };
    
    onChange({
      ...initializedConfig,
      targets: newTargets
    });
  };
  
  const deleteTarget = (index: number) => {
    const newTargets = [...initializedConfig.targets];
    newTargets.splice(index, 1);
    
    onChange({
      ...initializedConfig,
      targets: newTargets
    });
    
    setSelectedTargetIndex(null);
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
        {/* Items Column */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Draggable Items</h3>
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
                        className={`border rounded-md p-3 cursor-pointer ${
                          selectedItemIndex === index ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedItemIndex(index)}
                      >
                        {item.text}
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
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Text</label>
                  <input
                    type="text"
                    value={initializedConfig.items[selectedItemIndex].text}
                    onChange={(e) => updateItem(selectedItemIndex, { text: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    value={initializedConfig.items[selectedItemIndex].imageUrl || ''}
                    onChange={(e) => updateItem(selectedItemIndex, { imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="https://..."
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => deleteItem(selectedItemIndex)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  >
                    Delete Item
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Targets Column */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Target Zones</h3>
            <button
              onClick={() => setIsAddingTarget(true)}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
            >
              + Add Target
            </button>
          </div>
          
          {isAddingTarget ? (
            <div className="border rounded-md p-3 bg-gray-50 mb-3">
              <input
                type="text"
                placeholder="Target text"
                value={newTargetText}
                onChange={(e) => setNewTargetText(e.target.value)}
                className="w-full px-3 py-2 border rounded-md mb-2"
                autoFocus
              />
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsAddingTarget(false)}
                  className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={addTarget}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  Add Target
                </button>
              </div>
            </div>
          ) : null}
          
          {initializedConfig.targets.length === 0 ? (
            <div className="border border-dashed rounded-md p-4 text-center text-gray-500">
              No targets added yet
            </div>
          ) : (
            <div className="space-y-2">
              {initializedConfig.targets.map((target: Target, index: number) => (
                <div
                  key={target.id}
                  className={`border rounded-md p-3 cursor-pointer ${
                    selectedTargetIndex === index ? 'bg-green-50 border-green-300' : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTargetIndex(index)}
                >
                  <div className="mb-1">{target.text}</div>
                  {target.correctItemId && (
                    <div className="text-sm text-gray-600">
                      Matches with: {
                        initializedConfig.items.find((item: Item) => 
                          item.id === target.correctItemId
                        )?.text || 'Unknown item'
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {selectedTargetIndex !== null && (
            <div className="mt-4 border rounded-md p-3 bg-gray-50">
              <h4 className="font-medium mb-2">Edit Target</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Text</label>
                  <input
                    type="text"
                    value={initializedConfig.targets[selectedTargetIndex].text}
                    onChange={(e) => updateTarget(selectedTargetIndex, { text: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Correct Item</label>
                  <select
                    value={initializedConfig.targets[selectedTargetIndex].correctItemId}
                    onChange={(e) => updateTarget(selectedTargetIndex, { correctItemId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">-- Select Item --</option>
                    {initializedConfig.items.map((item: Item) => (
                      <option key={item.id} value={item.id}>
                        {item.text}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => deleteTarget(selectedTargetIndex)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                  >
                    Delete Target
                  </button>
                </div>
              </div>
            </div>
          )}
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
            Items: {initializedConfig.items.length} | 
            Targets: {initializedConfig.targets.length} | 
            Matches: {initializedConfig.targets.filter(t => t.correctItemId).length}
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            Users will drag each item to its matching target. 
            {initializedConfig.items.length !== initializedConfig.targets.length && 
              " Warning: Number of items and targets should match for best experience."}
          </p>
        </div>
      </div>
    </div>
  );
}