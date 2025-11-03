// apps/web/components/admin/GameEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import HotspotEditor from './games/HotspotEditor';
import DragDropEditor from './games/DragDropEditor';
import MatchingEditor from './games/MatchingEditor';
import SequenceEditor from './games/SequenceEditor';
import TrueFalseEditor from './games/TrueFalseEditor';
import MultipleChoiceEditor from './games/MultipleChoiceEditor';
import FillBlankEditor from './games/FillBlankEditor';
import ScenarioEditor from './games/ScenarioEditor';

type GameEditorProps = {
  gameType: string;
  initialConfig: any;
  onSave: (config: any) => void;
  onClose: () => void;
  isQuizQuestion?: boolean; // Determines if we show points or XP
};

export default function GameEditor({
  gameType,
  initialConfig,
  onSave,
  onClose,
  isQuizQuestion = false
}: GameEditorProps) {
  const [config, setConfig] = useState<any>(initialConfig || {});
  
  // Common handlers
  const handleChange = (newConfig: any) => {
    setConfig(newConfig);
  };
  
  const handleSave = () => {
    onSave(config);
    onClose();
  };

  // Render appropriate editor based on gameType
  const renderEditor = () => {
    switch (gameType) {
      case 'hotspot':
        return (
          <HotspotEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'drag-drop':
        return (
          <DragDropEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'matching':
        return (
          <MatchingEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'sequence':
        return (
          <SequenceEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'true-false':
        return (
          <TrueFalseEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'multiple-choice':
        return (
          <MultipleChoiceEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'fill-blank':
        return (
          <FillBlankEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'scenario':
        return (
          <ScenarioEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      default:
        return <div>Unsupported game type: {gameType}</div>;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Configure {gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game
        </h2>
        
        {renderEditor()}
        
        <div className="flex justify-end gap-3 mt-6">
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
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}