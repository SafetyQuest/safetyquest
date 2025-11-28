// apps/web/components/admin/games/TrueFalseEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import ImageSelector from '../ImageSelector';
import MediaSelector from '../MediaSelector';

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

  useEffect(() => {
    if (initializedConfig.statement || initializedConfig.explanation) {
      setHasInteracted(true);
    }
  }, []);

  // Validation helpers
  const isStatementEmpty = !initializedConfig.statement.trim();
  const isInstructionEmpty = !initializedConfig.instruction.trim();
  const reward = isQuizQuestion ? initializedConfig.points : initializedConfig.xp;
  const isRewardInvalid = !reward || reward <= 0;
  const hasExplanation = !!(initializedConfig.explanation?.trim());
  const hasImage = !!(initializedConfig.imageUrl?.trim());

  // Completion status
  const isComplete = !isStatementEmpty && !isInstructionEmpty && !isRewardInvalid;
  const completionPercentage = [
    !isInstructionEmpty,
    !isStatementEmpty,
    !isRewardInvalid
  ].filter(Boolean).length / 3 * 100;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleInstructionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasInteracted(true);
    onChange({
      ...initializedConfig,
      instruction: e.target.value
    });
  };

  const handleStatementChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasInteracted(true);
    onChange({
      ...initializedConfig,
      statement: e.target.value
    });
  };

  const handleCorrectAnswerChange = (value: boolean) => {
    onChange({
      ...initializedConfig,
      correctAnswer: value
    });
  };

  const handleExplanationChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange({
      ...initializedConfig,
      explanation: e.target.value
    });
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
          value={initializedConfig.instruction}
          onChange={handleInstructionChange}
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
      </div>

      {/* Statement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Statement <span className="text-red-500">*</span>
        </label>
        <textarea
          value={initializedConfig.statement}
          onChange={handleStatementChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
          rows={4}
          placeholder="e.g., Hard hats must be worn in all construction zones at all times"
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
      </div>

      {/* Image (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Image (Optional)
        </label>
        {hasImage ? (
          <div className="space-y-3">
            <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
              {!imageError ? (
                <img
                  src={initializedConfig.imageUrl}
                  alt="Statement reference"
                  className="w-full max-h-64 object-contain"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Failed to load image</p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowImageSelector(true)}
                className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                Change Image
              </button>
              <button
                type="button"
                onClick={handleRemoveImage}
                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-md hover:bg-red-100 transition-colors text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowImageSelector(true)}
            className="w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors group"
          >
            <svg className="mx-auto h-10 w-10 text-gray-400 group-hover:text-blue-500 mb-2 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm text-gray-600 group-hover:text-blue-700 font-medium transition-colors">
              Add Image
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Upload a reference image for the statement
            </p>
          </button>
        )}
        <p className="mt-2 text-xs text-gray-500">
          Add an image to provide visual context (e.g., "Is this PPE worn correctly?")
        </p>
      </div>

      {/* Correct Answer Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Correct Answer <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-4" role="radiogroup">
          <label 
            className={`
              flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all
              focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
              ${initializedConfig.correctAnswer === true 
                ? 'bg-green-50 border-green-500 shadow-sm' 
                : 'bg-white border-gray-300 hover:border-green-300 hover:bg-gray-50'}
            `}
          >
            <input
              type="radio"
              name="correctAnswer"
              checked={initializedConfig.correctAnswer === true}
              onChange={() => handleCorrectAnswerChange(true)}
              className="w-4 h-4 text-green-600 focus:ring-green-500"
              tabIndex={0}
            />
            <span className={`ml-3 font-medium ${initializedConfig.correctAnswer === true ? 'text-green-700' : 'text-gray-700'}`}>
              ✓ True
            </span>
          </label>
          <label 
            className={`
              flex items-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all
              focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2
              ${initializedConfig.correctAnswer === false 
                ? 'bg-red-50 border-red-500 shadow-sm' 
                : 'bg-white border-gray-300 hover:border-red-300 hover:bg-gray-50'}
            `}
          >
            <input
              type="radio"
              name="correctAnswer"
              checked={initializedConfig.correctAnswer === false}
              onChange={() => handleCorrectAnswerChange(false)}
              className="w-4 h-4 text-red-600 focus:ring-red-500"
              tabIndex={0}
            />
            <span className={`ml-3 font-medium ${initializedConfig.correctAnswer === false ? 'text-red-700' : 'text-gray-700'}`}>
              ✗ False
            </span>
          </label>
        </div>
      </div>

      {/* Explanation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Explanation (Optional)
        </label>
        <textarea
          value={initializedConfig.explanation}
          onChange={handleExplanationChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
          rows={3}
          placeholder="e.g., According to OSHA regulations, hard hats are mandatory PPE in construction zones to prevent head injuries from falling objects"
          tabIndex={0}
        />
        <p className="mt-1 text-xs text-gray-500">
          This explanation will be shown to users after they submit their answer
        </p>
      </div>

      {/* Reward */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isQuizQuestion ? 'Points' : 'XP'} Reward <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="1"
          step="1"
          value={reward}
          onChange={handleRewardChange}
          onBlur={handleRewardBlur}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500"
          tabIndex={0}
        />
        {hasInteracted && isRewardInvalid && (
          <p className="mt-1 text-xs text-red-500 flex items-center">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Reward must be at least 1
          </p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {isQuizQuestion 
            ? 'Points awarded for correct answer in quiz' 
            : 'XP awarded for completing this game'}
        </p>
      </div>

      {/* Real-time Validation Warnings */}
      {hasInteracted && !isComplete && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-amber-700 font-medium mb-1">
                Incomplete Configuration
              </p>
              <ul className="text-xs text-amber-600 space-y-0.5">
                {isInstructionEmpty && <li>• Add an instruction</li>}
                {isStatementEmpty && <li>• Add a statement</li>}
                {isRewardInvalid && <li>• Set a valid reward (minimum 1)</li>}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Game Preview */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="font-semibold text-gray-800">Game Preview</h3>
        </div>
        
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          {/* Instruction */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 italic">
              {initializedConfig.instruction}
            </p>
          </div>

          {/* Image (if present) */}
          {hasImage && !imageError && (
            <div className="mb-4">
              <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={initializedConfig.imageUrl}
                  alt="Preview"
                  className="w-full max-h-48 object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
            </div>
          )}

          {/* Statement Display */}
          <div className="mb-5">
            <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-base text-gray-800 leading-relaxed">
                {initializedConfig.statement || (
                  <span className="text-gray-400 italic">
                    Your statement will appear here...
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* True/False Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              className={`
                flex-1 px-5 py-3 rounded-lg font-medium transition-all border-2
                ${initializedConfig.correctAnswer === true 
                  ? 'bg-green-100 text-green-700 border-green-400 shadow-sm' 
                  : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}
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
              className={`
                flex-1 px-5 py-3 rounded-lg font-medium transition-all border-2
                ${initializedConfig.correctAnswer === false 
                  ? 'bg-red-100 text-red-700 border-red-400 shadow-sm' 
                  : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}
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

          {/* Reward Display */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Reward for correct answer:
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {reward} {isQuizQuestion ? 'Points' : 'XP'}
            </span>
          </div>
        </div>

        {/* Preview Notes */}
        <div className="mt-3 text-xs text-blue-700">
          <p>
            {!initializedConfig.statement && '⚠️ Add a statement above to complete the game'}
            {initializedConfig.statement && (
              <>
                ℹ️ Correct answer: <strong>{initializedConfig.correctAnswer ? 'True' : 'False'}</strong>
                {hasImage && ' • Has image'}
                {hasExplanation && ' • Explanation will be shown after answer'}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Game Summary */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          Game Summary
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1">Status</p>
            <div className="flex items-center gap-2">
              {isComplete ? (
                <>
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-green-700">Complete</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold text-amber-700">{Math.round(completionPercentage)}%</span>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Correct Answer</p>
            <div className="flex items-center gap-2">
              {initializedConfig.correctAnswer ? (
                <span className="font-semibold text-lg text-green-700">True</span>
              ) : (
                <span className="font-semibold text-lg text-red-700">False</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-gray-600 mb-1">Reward</p>
            <p className="font-semibold text-lg text-blue-700">
              {reward || 0} {isQuizQuestion ? 'pts' : 'XP'}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        {!isComplete && hasInteracted && (
          <div className="mt-3 pt-3 border-t border-gray-300">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Configuration Progress</span>
              <span className="text-xs font-medium text-gray-700">{Math.round(completionPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800 font-medium mb-2">💡 Tips for Effective True/False Questions:</p>
        <ul className="text-xs text-blue-700 space-y-1.5">
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