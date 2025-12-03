// apps/web/components/admin/games/TrueFalseEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';

// ============================================================================
// TYPES (Strict typing for single-statement True/False game)
// ============================================================================

type TrueFalseGameConfig = {
  instruction: string;
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
  imageUrl?: string;
  points?: number;
  xp?: number;
};

type TrueFalseEditorProps = {
  config: Partial<TrueFalseGameConfig>;
  onChange: (newConfig: TrueFalseGameConfig) => void;
  isQuizQuestion: boolean;
};

// ============================================================================
// MAIN EDITOR COMPONENT
// ============================================================================

export default function TrueFalseEditor({
  config,
  onChange,
  isQuizQuestion
}: TrueFalseEditorProps) {
  // ============================================================================
  // STATE INITIALIZATION (Strict defaults)
  // ============================================================================

  const initializedConfig: TrueFalseGameConfig = {
    instruction: config.instruction || 'Determine if the following statement is true or false.',
    statement: config.statement || '',
    correctAnswer: config.correctAnswer !== undefined ? config.correctAnswer : true,
    explanation: config.explanation || '',
    imageUrl: config.imageUrl || '',
    ...(isQuizQuestion 
      ? { points: config.points || 10 }
      : { xp: config.xp || 10 }
    )
  };

  // ============================================================================
  // STATE
  // ============================================================================

  const [hasInteracted, setHasInteracted] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Local state for text fields to prevent re-render on every keystroke
  const [localInstruction, setLocalInstruction] = useState(config.instruction || 'Determine if the following statement is true or false.');
  const [localStatement, setLocalStatement] = useState(config.statement || '');
  const [localExplanation, setLocalExplanation] = useState(config.explanation || '');

  // Sync local state with config when config changes externally
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Determine if the following statement is true or false.');
  }, [config.instruction]);
  
  useEffect(() => {
    setLocalStatement(config.statement || '');
  }, [config.statement]);
  
  useEffect(() => {
    setLocalExplanation(config.explanation || '');
  }, [config.explanation]);

  useEffect(() => {
    if (initializedConfig.statement || initializedConfig.explanation) {
      setHasInteracted(true);
    }
  }, []);

  // Validation helpers
  const isStatementEmpty = !localStatement.trim();
  const isInstructionEmpty = !localInstruction.trim();
  const reward = isQuizQuestion ? initializedConfig.points : initializedConfig.xp;
  const isRewardInvalid = !reward || reward <= 0;
  const hasExplanation = !!(localExplanation?.trim());
  const hasImage = !!(initializedConfig.imageUrl?.trim());

  // Completion status
  const isComplete = !isStatementEmpty && !isInstructionEmpty && !isRewardInvalid;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasInteracted(true);
    setLocalInstruction(e.target.value);
  };
  
  const handleInstructionBlur = () => {
    if (localInstruction !== initializedConfig.instruction) {
      onChange({
        ...initializedConfig,
        instruction: localInstruction
      });
    }
  };

  const handleStatementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasInteracted(true);
    setLocalStatement(e.target.value);
  };
  
  const handleStatementBlur = () => {
    if (localStatement !== initializedConfig.statement) {
      onChange({
        ...initializedConfig,
        statement: localStatement
      });
    }
  };

  const handleCorrectAnswerChange = (value: boolean) => {
    onChange({
      ...initializedConfig,
      correctAnswer: value
    });
  };

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalExplanation(e.target.value);
  };
  
  const handleExplanationBlur = () => {
    if (localExplanation !== initializedConfig.explanation) {
      onChange({
        ...initializedConfig,
        explanation: localExplanation
      });
    }
  };

  const handleRewardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    const updatedConfig = { ...initializedConfig };
    
    if (isQuizQuestion) {
      updatedConfig.points = value;
      delete updatedConfig.xp;
    } else {
      updatedConfig.xp = value;
      delete updatedConfig.points;
    }
    
    onChange(updatedConfig);
  };

  const handleRewardBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value < 1) {
      const updatedConfig = { ...initializedConfig };
      if (isQuizQuestion) {
        updatedConfig.points = 1;
      } else {
        updatedConfig.xp = 1;
      }
      onChange(updatedConfig);
      toast.error('Reward must be at least 1', { duration: 2000 });
    }
  };

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================

  const handleImageSelect = (url: string) => {
    onChange({
      ...initializedConfig,
      imageUrl: url
    });
    setShowImageSelector(false);
    setImageError(false);
    toast.success('Image added');
  };

  const handleRemoveImage = () => {
    onChange({
      ...initializedConfig,
      imageUrl: ''
    });
    setImageError(false);
    toast.success('Image removed');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Instruction */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instruction / Question <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
          rows={2}
          placeholder="e.g., Read the statement and decide if it's true or false"
          tabIndex={0}
        />
        {hasInteracted && isInstructionEmpty && (
          <p className="mt-1 text-xs text-red-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Instruction is required
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          This will be displayed to the user before they see the statement
        </p>
        
        {/* InfoTooltip below the field */}
        <InfoTooltip 
          title="💡 Tips & Best Practices"
          position="right"
          width="lg"
        >
          <div className="space-y-2">
            <p className="font-medium">Creating Effective True/False Questions:</p>
            <ul className="space-y-1.5 ml-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Keep statements clear and unambiguous</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Avoid double negatives or complex wording</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Add explanations to reinforce learning after answers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Use images to show scenarios requiring visual assessment</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Balance the number of true and false statements in your training</span>
              </li>
            </ul>
          </div>
        </InfoTooltip>
      </div>

      {/* Statement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          value={localStatement}
          onChange={handleStatementChange}
          onBlur={handleStatementBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
          rows={3}
          placeholder="e.g., Wearing safety glasses is mandatory when working with chemicals"
          tabIndex={0}
        />
        {hasInteracted && isStatementEmpty && (
          <p className="mt-1 text-xs text-red-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Statement is required
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          The statement users will evaluate as true or false
        </p>
      </div>

      {/* Image and Explanation Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image (Optional)
          </label>
          
          {hasImage && !imageError ? (
            <div className="space-y-2">
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={initializedConfig.imageUrl}
                  alt="Statement visual"
                  className="w-full h-48 object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageSelector(true)}
                  className="flex-1 px-3 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex-1 px-3 py-2 text-sm bg-red-50 border border-red-200 text-red-600 rounded-md hover:bg-red-100"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-sm mb-3">No image selected</p>
              <button
                type="button"
                onClick={() => setShowImageSelector(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add Image
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Add a visual aid to support the statement
          </p>
        </div>

        {/* Explanation Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Explanation (Optional)
          </label>
          <textarea
            value={localExplanation}
            onChange={handleExplanationChange}
            onBlur={handleExplanationBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
            rows={6}
            placeholder="Provide additional context or explanation that will be shown after the user answers..."
            tabIndex={0}
          />
          <p className="mt-2 text-xs text-gray-500">
            Shown to users after they answer to reinforce learning
          </p>
        </div>
      </div>

      {/* Correct Answer and XP Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Correct Answer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Correct Answer <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => handleCorrectAnswerChange(true)}
              className={`
                flex-1 px-5 py-3 rounded-lg font-medium transition-all border-2
                ${initializedConfig.correctAnswer === true 
                  ? 'bg-green-100 text-green-700 border-green-400 shadow-md' 
                  : 'bg-white text-green-600 border-green-200 hover:bg-green-50'}
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                True
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleCorrectAnswerChange(false)}
              className={`
                flex-1 px-5 py-3 rounded-lg font-medium transition-all border-2
                ${initializedConfig.correctAnswer === false 
                  ? 'bg-red-100 text-red-700 border-red-400 shadow-md' 
                  : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}
              `}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                False
              </span>
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Select whether the statement is true or false
          </p>
        </div>

        {/* XP/Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isQuizQuestion ? 'Points' : 'XP'} <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            value={reward}
            onChange={handleRewardChange}
            onBlur={handleRewardBlur}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
            placeholder="10"
            tabIndex={0}
          />
          {hasInteracted && isRewardInvalid && (
            <p className="mt-1 text-xs text-red-500 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {isQuizQuestion ? 'Points' : 'XP'} must be at least 1
            </p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Reward for answering correctly (minimum 1)
          </p>
        </div>
      </div>

      {/* Game Summary */}
      <GameSummary
        title="Game Summary"
        showEmpty={!isComplete}
        emptyMessage="⚠️ Complete all required fields to finalize the game."
        items={[
          {
            label: 'Correct Answer',
            value: initializedConfig.correctAnswer ? 'True' : 'False',
            icon: initializedConfig.correctAnswer ? (
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: 'Reward',
            value: `${reward || 0} ${isQuizQuestion ? 'pts' : 'XP'}`,
            highlight: true
          },
          {
            label: 'Has Image',
            value: hasImage ? 'Yes' : 'No',
            icon: hasImage ? (
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: 'Has Explanation',
            value: hasExplanation ? 'Yes' : 'No',
            icon: hasExplanation ? (
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )
          }
        ]}
      />

      {/* Image Selector Modal */}
      {showImageSelector && (
        <MediaSelector
          accept="image/*"
          onSelect={handleImageSelect}
          onClose={() => setShowImageSelector(false)}
        />
      )}
    </div>
  );
}