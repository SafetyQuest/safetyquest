// apps/web/components/admin/games/MultipleChoiceEditor.tsx
'use client';

import { useState } from 'react';

type MultipleChoiceEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

type Option = {
  id: string;
  text: string;
  correct: boolean;
};

export default function MultipleChoiceEditor({
  config,
  onChange,
  isQuizQuestion
}: MultipleChoiceEditorProps) {
  // Initialize config
  const initializedConfig = {
    question: config.question || '',
    options: config.options || [],
    allowMultipleCorrect: config.allowMultipleCorrect === undefined ? false : config.allowMultipleCorrect,
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  const [newOptionText, setNewOptionText] = useState('');
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  
  // Question update
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      question: e.target.value
    });
  };
  
  // Multiple correct update
  const handleAllowMultipleCorrectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...initializedConfig,
      allowMultipleCorrect: e.target.checked
    });
  };
  
  // Add option
  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption: Option = {
      id: `option_${Date.now()}`,
      text: newOptionText.trim(),
      correct: false
    };
    
    onChange({
      ...initializedConfig,
      options: [...initializedConfig.options, newOption]
    });
    
    setNewOptionText('');
  };
  
  // Update option
  const updateOption = (index: number, updates: Partial<Option>) => {
    const newOptions = [...initializedConfig.options];
    newOptions[index] = { ...newOptions[index], ...updates };
    
    // If setting this option as correct and not allowing multiple correct,
    // set all other options to incorrect
    if (updates.correct === true && !initializedConfig.allowMultipleCorrect) {
      newOptions.forEach((option, i) => {
        if (i !== index) {
          newOptions[i] = { ...option, correct: false };
        }
      });
    }
    
    onChange({
      ...initializedConfig,
      options: newOptions
    });
  };
  
  // Delete option
  const deleteOption = (index: number) => {
    const newOptions = [...initializedConfig.options];
    newOptions.splice(index, 1);
    
    onChange({
      ...initializedConfig,
      options: newOptions
    });
    
    setSelectedOptionIndex(null);
  };
  
  // Move option up/down
  const moveOption = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === initializedConfig.options.length - 1)
    ) {
      return;
    }
    
    const newOptions = [...initializedConfig.options];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newOptions[index], newOptions[targetIndex]] = [newOptions[targetIndex], newOptions[index]];
    
    onChange({
      ...initializedConfig,
      options: newOptions
    });
    
    setSelectedOptionIndex(targetIndex);
  };
  
  // Points/XP update
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onChange({
      ...initializedConfig,
      ...(isQuizQuestion ? { points: value } : { xp: value })
    });
  };
  
  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Question
        </label>
        <textarea
          value={initializedConfig.question}
          onChange={handleQuestionChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
          placeholder="Enter your multiple choice question here"
        />
      </div>
      
      <div className="mb-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={initializedConfig.allowMultipleCorrect}
            onChange={handleAllowMultipleCorrectChange}
            className="mr-2"
          />
          <span className="text-sm">Allow multiple correct answers</span>
        </label>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Answer Options</h3>
        </div>
        
        <div className="border rounded-md p-3 bg-gray-50 mb-3">
          <input
            type="text"
            placeholder="New option text"
            value={newOptionText}
            onChange={(e) => setNewOptionText(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-2"
          />
          <div className="flex justify-end">
            <button
              onClick={handleAddOption}
              disabled={!newOptionText.trim()}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              Add Option
            </button>
          </div>
        </div>
        
        {initializedConfig.options.length === 0 ? (
          <div className="border border-dashed rounded-md p-4 text-center text-gray-500">
            No answer options added yet
          </div>
        ) : (
          <div className="space-y-2">
            {initializedConfig.options.map((option: Option, index: number) => (
              <div
                key={option.id}
                className={`border rounded-md p-3 cursor-pointer ${
                  option.correct ? 'bg-green-50 border-green-300' : 'bg-white'
                } ${
                  selectedOptionIndex === index ? 'ring-2 ring-blue-300' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedOptionIndex(index)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <input
                      type={initializedConfig.allowMultipleCorrect ? 'checkbox' : 'radio'}
                      checked={option.correct}
                      onChange={() => updateOption(index, { correct: !option.correct })}
                      className="mr-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{option.text}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {String.fromCharCode(65 + index)} {/* A, B, C, etc. */}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {selectedOptionIndex !== null && (
          <div className="mt-4 border rounded-md p-3 bg-gray-50">
            <h4 className="font-medium mb-2">Edit Option</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm mb-1">Text</label>
                <input
                  type="text"
                  value={initializedConfig.options[selectedOptionIndex].text}
                  onChange={(e) => updateOption(selectedOptionIndex, { text: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex justify-between">
                <button
                  onClick={() => deleteOption(selectedOptionIndex)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                >
                  Delete Option
                </button>
                <div className="space-x-2">
                  <button
                    onClick={() => moveOption(selectedOptionIndex, 'up')}
                    disabled={selectedOptionIndex === 0}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
                  >
                    Move Up
                  </button>
                  <button
                    onClick={() => moveOption(selectedOptionIndex, 'down')}
                    disabled={selectedOptionIndex === initializedConfig.options.length - 1}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 disabled:opacity-50 text-sm"
                  >
                    Move Down
                  </button>
                </div>
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
        <p className="text-sm text-yellow-700 mb-2">
          Options: {initializedConfig.options.length} | 
          Correct: {initializedConfig.options.filter(o => o.correct).length}
        </p>
        {initializedConfig.options.filter(o => o.correct).length === 0 && (
          <p className="text-sm text-red-600 mb-2">
            Warning: No correct option selected!
          </p>
        )}
        <p className="text-sm text-yellow-700">
          Users will select {initializedConfig.allowMultipleCorrect ? 'one or more options' : 'a single option'}.
          {initializedConfig.options.length < 2 && 
            " Add at least 3-4 options for a good question."}
        </p>
      </div>
    </div>
  );
}