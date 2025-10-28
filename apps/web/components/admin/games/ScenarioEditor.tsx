// apps/web/components/admin/games/ScenarioEditor.tsx
'use client';

import { useState } from 'react';

type ScenarioEditorProps = {
  config: any;
  onChange: (newConfig: any) => void;
  isQuizQuestion: boolean;
};

type Option = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
};

export default function ScenarioEditor({
  config,
  onChange,
  isQuizQuestion
}: ScenarioEditorProps) {
  // Initialize config
  const initializedConfig = {
    scenario: config.scenario || '',
    question: config.question || '',
    options: config.options || [],
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };
  
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState('');
  
  // Scenario update
  const handleScenarioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      scenario: e.target.value
    });
  };
  
  // Question update
  const handleQuestionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      question: e.target.value
    });
  };
  
  // Option functions
  const addOption = () => {
    if (!newOptionText.trim()) return;
    
    const newOption: Option = {
      id: `option_${Date.now()}`,
      text: newOptionText.trim(),
      correct: initializedConfig.options.length === 0, // First option is correct by default
      feedback: ''
    };
    
    onChange({
      ...initializedConfig,
      options: [...initializedConfig.options, newOption]
    });
    
    setNewOptionText('');
    setIsAddingOption(false);
  };
  
  const updateOption = (index: number, updates: Partial<Option>) => {
    const newOptions = [...initializedConfig.options];
    newOptions[index] = { ...newOptions[index], ...updates };
    
    // If setting this option as correct, set all others to incorrect
    if (updates.correct === true) {
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
  
  const deleteOption = (index: number) => {
    const newOptions = [...initializedConfig.options];
    newOptions.splice(index, 1);
    
    // If we deleted the correct option and there are still options, make the first one correct
    const hasCorrect = newOptions.some(opt => opt.correct);
    if (!hasCorrect && newOptions.length > 0) {
      newOptions[0].correct = true;
    }
    
    onChange({
      ...initializedConfig,
      options: newOptions
    });
    
    setSelectedOptionIndex(null);
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
          Scenario Description
        </label>
        <textarea
          value={initializedConfig.scenario}
          onChange={handleScenarioChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={4}
          placeholder="Describe the scenario or situation..."
        />
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Question
        </label>
        <textarea
          value={initializedConfig.question}
          onChange={handleQuestionChange}
          className="w-full px-3 py-2 border rounded-md"
          rows={2}
          placeholder="What should the learner decide or answer?"
        />
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medium">Answer Options</h3>
          <button
            onClick={() => setIsAddingOption(true)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
          >
            + Add Option
          </button>
        </div>
        
        {isAddingOption && (
          <div className="border rounded-md p-3 bg-gray-50 mb-3">
            <input
              type="text"
              placeholder="Option text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-2"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingOption(false)}
                className="px-3 py-1 text-gray-600 hover:text-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={addOption}
                disabled={!newOptionText.trim()}
                className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                Add Option
              </button>
            </div>
          </div>
        )}
        
        {initializedConfig.options.length === 0 ? (
          <div className="border border-dashed rounded-md p-4 text-center text-gray-500">
            No options added yet. Add at least 2-4 options.
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
                      type="radio"
                      checked={option.correct}
                      onChange={() => updateOption(index, { correct: true })}
                      className="mr-2"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{option.text}</span>
                  </div>
                </div>
                
                {option.feedback && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Feedback:</span> {option.feedback}
                  </div>
                )}
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
              <div>
                <label className="block text-sm mb-1">Feedback</label>
                <textarea
                  value={initializedConfig.options[selectedOptionIndex].feedback}
                  onChange={(e) => updateOption(selectedOptionIndex, { feedback: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                  placeholder="Feedback to show when this option is selected..."
                />
              </div>
              <div className="pt-2">
                <button
                  onClick={() => deleteOption(selectedOptionIndex)}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm"
                >
                  Delete Option
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
        <h3 className="font-medium text-yellow-800 mb-1">Scenario Preview</h3>
        <p className="text-sm text-yellow-700">
          Scenario: {initializedConfig.scenario.substring(0, 100)}
          {initializedConfig.scenario.length > 100 ? '...' : ''}
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          Question: {initializedConfig.question}
        </p>
        <p className="text-sm text-yellow-700 mt-2">
          {initializedConfig.options.length} options, 
          {initializedConfig.options.filter(o => o.correct).length > 0 
            ? ` with "${initializedConfig.options.find(o => o.correct)?.text}" as the correct answer.`
            : ' but no correct option is set.'}
        </p>
        
        {initializedConfig.options.length < 2 && (
          <p className="text-sm text-red-600 mt-2">
            Warning: Add at least 2 options for a meaningful scenario.
          </p>
        )}
        
        {!initializedConfig.options.some(o => o.correct) && initializedConfig.options.length > 0 && (
          <p className="text-sm text-red-600 mt-2">
            Warning: You must mark one option as correct.
          </p>
        )}
      </div>
    </div>
  );
}