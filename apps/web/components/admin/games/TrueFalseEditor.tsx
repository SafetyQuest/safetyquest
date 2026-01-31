// apps/web/components/admin/games/TrueFalseEditor.tsx
'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import MediaSelector from '../MediaSelector';
import InfoTooltip from './ui/InfoTooltip';
import GameSummary from './ui/GameSummary';
import GameRichTextEditor from './ui/GameRichTextEditor';

// ============================================================================
// HELPER FUNCTION — Character counting for rich text
// ============================================================================

const getPlainTextLength = (html: string): number => {
  if (!html) return 0;
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || '').trim().length;
};

// ============================================================================
// TYPES (Enhanced with separate explanations for True/False options)
// ============================================================================

type TrueFalseGameConfig = {
  instruction: string;
  statement: string;
  correctAnswer: boolean;
  trueExplanation?: string;    // ✅ NEW: Explanation shown when user selects True
  falseExplanation?: string;   // ✅ NEW: Explanation shown when user selects False
  generalFeedback?: string;    // ✅ NEW: General feedback shown after submission
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
    trueExplanation: config.trueExplanation || '',
    falseExplanation: config.falseExplanation || '',
    generalFeedback: config.generalFeedback || '',
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
  const [localTrueExplanation, setLocalTrueExplanation] = useState(config.trueExplanation || '');
  const [localFalseExplanation, setLocalFalseExplanation] = useState(config.falseExplanation || '');
  const [localGeneralFeedback, setLocalGeneralFeedback] = useState(config.generalFeedback || '');

  // Sync local state with config when config changes externally
  useEffect(() => {
    setLocalInstruction(config.instruction || 'Determine if the following statement is true or false.');
  }, [config.instruction]);
  
  useEffect(() => {
    setLocalStatement(config.statement || '');
  }, [config.statement]);
  
  useEffect(() => {
    setLocalTrueExplanation(config.trueExplanation || '');
  }, [config.trueExplanation]);
  
  useEffect(() => {
    setLocalFalseExplanation(config.falseExplanation || '');
  }, [config.falseExplanation]);
  
  useEffect(() => {
    setLocalGeneralFeedback(config.generalFeedback || '');
  }, [config.generalFeedback]);

  useEffect(() => {
    if (initializedConfig.statement || initializedConfig.trueExplanation || initializedConfig.falseExplanation) {
      setHasInteracted(true);
    }
  }, []);

  // Validation helpers
  const isStatementEmpty = !localStatement.trim();
  const isInstructionEmpty = !localInstruction.trim();
  const reward = isQuizQuestion ? initializedConfig.points : initializedConfig.xp;
  const isRewardInvalid = !reward || reward <= 0;
  const hasTrueExplanation = getPlainTextLength(localTrueExplanation) > 0;
  const hasFalseExplanation = getPlainTextLength(localFalseExplanation) > 0;
  const hasGeneralFeedback = getPlainTextLength(localGeneralFeedback) > 0;
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

  const handleTrueExplanationChange = (html: string) => {
    setLocalTrueExplanation(html);
    onChange({
      ...initializedConfig,
      trueExplanation: html
    });
  };

  const handleFalseExplanationChange = (html: string) => {
    setLocalFalseExplanation(html);
    onChange({
      ...initializedConfig,
      falseExplanation: html
    });
  };

  const handleGeneralFeedbackChange = (html: string) => {
    setLocalGeneralFeedback(html);
    onChange({
      ...initializedConfig,
      generalFeedback: html
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
    toast.success('Image added successfully', { duration: 2000 });
  };

  const handleRemoveImage = () => {
    onChange({
      ...initializedConfig,
      imageUrl: ''
    });
    setImageError(false);
    toast.success('Image removed', { duration: 2000 });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Instructions <span className="text-danger">*</span>
        </label>
        <textarea
          value={localInstruction}
          onChange={handleInstructionChange}
          onBlur={handleInstructionBlur}
          rows={2}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary ${
            hasInteracted && isInstructionEmpty ? 'border-danger' : 'border-border'
          }`}
          placeholder="Tell learners what to do..."
        />
        {hasInteracted && isInstructionEmpty && (
          <p className="text-danger text-xs mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Instructions are required
          </p>
        )}
        <p className="mt-1 text-xs text-text-muted">
          Explain the task to learners
        </p>
      </div>

      {/* Statement */}
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-1.5">
          Statement <span className="text-danger">*</span>
        </label>
        <textarea
          value={localStatement}
          onChange={handleStatementChange}
          onBlur={handleStatementBlur}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-light focus:border-primary ${
            hasInteracted && isStatementEmpty ? 'border-danger' : 'border-border'
          }`}
          placeholder="Enter the statement to evaluate (e.g., 'Safety gloves should be worn when handling chemicals')"
        />
        {hasInteracted && isStatementEmpty && (
          <p className="text-danger text-xs mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Statement is required
          </p>
        )}
        <p className="mt-1 text-xs text-text-muted">
          The statement learners will evaluate as true or false
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Image Section (Optional) */}
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-2 text-center">
            Image (Optional)
          </label>
          
          {hasImage && !imageError ? (
            <div className="space-y-2">
              <div className="border-2 border-border rounded-lg overflow-hidden bg-surface">
                <img
                  src={initializedConfig.imageUrl}
                  alt="Statement visual"
                  className="w-full h-64 object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageSelector(true)}
                  className="flex-1 btn btn-secondary text-sm"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex-1 btn btn-danger text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-border rounded-lg p-6 bg-surface text-center">
              <svg className="mx-auto h-12 w-12 text-text-muted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-text-secondary text-sm mb-3">No image selected</p>
              <button
                type="button"
                onClick={() => setShowImageSelector(true)}
                className="btn btn-primary"
              >
                Add Image
              </button>
            </div>
          )}
          <p className="mt-2 text-xs text-text-muted">
            Add a visual aid to support the statement
          </p>
        </div>

        {/* Correct Answer and Reward */}
        <div className="space-y-4">
          {/* Correct Answer */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Correct Answer <span className="text-danger">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleCorrectAnswerChange(true)}
                className={`
                  flex-1 px-5 py-3 rounded-lg font-medium transition-all border-2
                  ${initializedConfig.correctAnswer === true 
                    ? 'bg-success-light text-success-dark border-success ring-2 ring-success' 
                    : 'bg-white text-success border-border hover:bg-surface hover:border-success-light'}
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
                    ? 'bg-danger-light text-danger-dark border-danger ring-2 ring-danger' 
                    : 'bg-white text-danger border-border hover:bg-surface hover:border-danger-light'}
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
            <p className="mt-2 text-xs text-text-muted">
              Select whether the statement is true or false
            </p>
          </div>

          {/* XP/Points */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              {isQuizQuestion ? 'Points' : 'XP'} <span className="text-danger">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={reward}
              onChange={handleRewardChange}
              onBlur={handleRewardBlur}
              className="w-full"
            />
            {hasInteracted && isRewardInvalid && (
              <p className="mt-1 text-xs text-danger flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {isQuizQuestion ? 'Points' : 'XP'} must be at least 1
              </p>
            )}
            <p className="mt-1.5 text-xs text-text-muted">
              Reward for answering correctly (minimum 1)
            </p>
          </div>
        </div>
      </div>

      {/* True Explanation Section with Rich Text Editor */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="block text-sm font-medium text-text-secondary">
            True Explanation (Optional)
          </label>
          <span 
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" 
            title="This explanation will be shown to learners who select 'True'. Use it to explain why the statement is true or to correct a misconception if it's actually false."
          >
            ?
          </span>
        </div>
        <GameRichTextEditor
          key="true-explanation-editor"
          content={localTrueExplanation}
          onChange={handleTrueExplanationChange}
          height={120}
          placeholder="Explain why this statement is true, or clarify the misconception if it's false..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Shown to learners who select "True"</span>
          <span className={
            getPlainTextLength(localTrueExplanation) > 300 
              ? 'text-danger font-medium' 
              : getPlainTextLength(localTrueExplanation) > 240 
                ? 'text-warning-dark' 
                : 'text-text-muted'
          }>
            {getPlainTextLength(localTrueExplanation)}/300 characters
          </span>
        </div>
      </div>

      {/* False Explanation Section with Rich Text Editor */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="block text-sm font-medium text-text-secondary">
            False Explanation (Optional)
          </label>
          <span 
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" 
            title="This explanation will be shown to learners who select 'False'. Use it to explain why the statement is false or to correct a misconception if it's actually true."
          >
            ?
          </span>
        </div>
        <GameRichTextEditor
          key="false-explanation-editor"
          content={localFalseExplanation}
          onChange={handleFalseExplanationChange}
          height={120}
          placeholder="Explain why this statement is false, or clarify the misconception if it's true..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Shown to learners who select "False"</span>
          <span className={
            getPlainTextLength(localFalseExplanation) > 300 
              ? 'text-danger font-medium' 
              : getPlainTextLength(localFalseExplanation) > 240 
                ? 'text-warning-dark' 
                : 'text-text-muted'
          }>
            {getPlainTextLength(localFalseExplanation)}/300 characters
          </span>
        </div>
      </div>

      {/* General Feedback Section with Rich Text Editor */}
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <label className="block text-sm font-medium text-text-secondary">
            General Feedback (Optional)
          </label>
          <span 
            className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface text-text-muted text-xs cursor-help" 
            title="This feedback will be shown to all learners after they submit, regardless of whether they answered correctly. Use it to provide context, hints, or learning points about the topic."
          >
            ?
          </span>
        </div>
        <GameRichTextEditor
          key="general-feedback-editor"
          content={localGeneralFeedback}
          onChange={handleGeneralFeedbackChange}
          height={150}
          placeholder="Provide context, hints, or learning points about this topic..."
        />
        <div className="flex justify-between items-center mt-1 text-xs">
          <span className="text-text-muted">Shown to all learners after submission</span>
          <span className={
            getPlainTextLength(localGeneralFeedback) > 500 
              ? 'text-danger font-medium' 
              : getPlainTextLength(localGeneralFeedback) > 400 
                ? 'text-warning-dark' 
                : 'text-text-muted'
          }>
            {getPlainTextLength(localGeneralFeedback)}/500 characters
          </span>
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
              <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-danger" fill="currentColor" viewBox="0 0 20 20">
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
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: 'Has True Explanation',
            value: hasTrueExplanation ? 'Yes' : 'No',
            icon: hasTrueExplanation ? (
              <svg className="w-4 h-4 text-success" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: 'Has False Explanation',
            value: hasFalseExplanation ? 'Yes' : 'No',
            icon: hasFalseExplanation ? (
              <svg className="w-4 h-4 text-danger" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )
          },
          {
            label: 'Has General Feedback',
            value: hasGeneralFeedback ? 'Yes' : 'No',
            icon: hasGeneralFeedback ? (
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
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