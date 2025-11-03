// apps/web/components/admin/games/MatchingEditor.tsx
'use client';

import { useState } from 'react';

type MatchingEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

type Pair = {
  id: string;
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
};

export default function MatchingEditor({
  config,
  onChange,
  isQuizQuestion
}: MatchingEditorProps) {
  // Initialize config
  const initializedConfig = {
    instruction: config.instruction || 'Match the items on the left with their corresponding items on the right',
    pairs: config.pairs || [],
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  const [selectedPairIndex, setSelectedPairIndex] = useState<number | null>(null);
  const [isAddingPair, setIsAddingPair] = useState(false);
  const [newPairLeft, setNewPairLeft] = useState('');
  const [newPairRight, setNewPairRight] = useState('');
  
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
  
  // Pair functions
  const addPair = () => {
    if (!newPairLeft.trim() || !newPairRight.trim()) return;
    
    const newPair: Pair = {
      id: `pair_${Date.now()}`,
      leftId: `left_${Date.now()}`,
      leftText: newPairLeft.trim(),
      rightId: `right_${Date.now()}`,
      rightText: newPairRight.trim()
    };
    
    onChange({
      ...initializedConfig,
      pairs: [...initializedConfig.pairs, newPair]
    });
    
    setNewPairLeft('');
    setNewPairRight('');
    setIsAddingPair(false);
  };
  
  const updatePair = (index: number, updates: Partial<Pair>) => {
    const newPairs = [...initializedConfig.pairs];
    newPairs[index] = { ...newPairs[index], ...updates };
    
    onChange({
      ...initializedConfig,
      pairs: newPairs
    });
  };
  
  const deletePair = (index: number) => {
    const newPairs = [...initializedConfig.pairs];
    newPairs.splice(index, 1);
    
    onChange({
      ...initializedConfig,
      pairs: newPairs
    });
    
    setSelectedPairIndex(null);
  };
  
  // Move pair up/down
  const movePair = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === initializedConfig.pairs.length - 1)
    ) {
      return;
    }
    
    const newPairs = [...initializedConfig.pairs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newPairs[index], newPairs[targetIndex]] = [newPairs[targetIndex], newPairs[index]];
    
    onChange({
      ...initializedConfig,
      pairs: newPairs
    });
    
    setSelectedPairIndex(targetIndex);
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
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Matching Pairs</h3>
          <button
            onClick={() => setIsAddingPair(true)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
          >
            + Add Pair
          </button>
        </div>
        
        {isAddingPair ? (
          <div className="border rounded-md p-3 bg-gray-50 mb-3">
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-sm mb-1">Left Item</label>
                <input
                  type="text"
                  placeholder="Item on left side"
                  value={newPairLeft}
                  onChange={(e) => setNewPairLeft(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Right Item</label>
                <input
                  type="text"
                  placeholder="Matching item on right"
                  value={newPairRight}
                  onChange={(e) => setNewPairRight(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingPair(false)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addPair}
                disabled={!newPairLeft.trim() || !newPairRight.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Add Pair
              </button>
            </div>
          </div>
        ) : null}
        
        {initializedConfig.pairs.length === 0 ? (
          <div className="border border-dashed rounded-md p-4 text-center text-gray-500">
            No matching pairs added yet
          </div>
        ) : (
          <div className="space-y-2">
            {initializedConfig.pairs.map((pair: Pair, index: number) => (
              <div
                key={pair.id}
                className={`border rounded-md p-3 cursor-pointer ${
                  selectedPairIndex === index ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPairIndex(index)}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div className="border-r pr-3">
                    <div className="font-medium text-sm text-gray-500">Left</div>
                    <div>{pair.leftText}</div>
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-500">Right</div>
                    <div>{pair.rightText}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedPairIndex !== null && (
          <div className="mt-4 border rounded-md p-3 bg-gray-50">
            <h4 className="font-medium mb-2">Edit Pair</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm mb-1">Left Item</label>
                <input
                  type="text"
                  value={initializedConfig.pairs[selectedPairIndex].leftText}
                  onChange={(e) => updatePair(selectedPairIndex, { leftText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Right Item</label>
                <input
                  type="text"
                  value={initializedConfig.pairs[selectedPairIndex].rightText}
                  onChange={(e) => updatePair(selectedPairIndex, { rightText: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>
            <div className="flex justify-between">
              <div>
                <button
                  onClick={() => deletePair(selectedPairIndex)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                >
                  Delete Pair
                </button>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => movePair(selectedPairIndex, 'up')}
                  disabled={selectedPairIndex === 0}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
                >
                  Move Up
                </button>
                <button
                  onClick={() => movePair(selectedPairIndex, 'down')}
                  disabled={selectedPairIndex === initializedConfig.pairs.length - 1}
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
                >
                  Move Down
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
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
          Pairs: {initializedConfig.pairs.length}
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          Users will see two columns and need to match the corresponding items.
          {initializedConfig.pairs.length < 3 && 
            " Tip: Add at least 3-5 pairs for a good challenge."}
        </p>
      </div>
    </div>
  );
}