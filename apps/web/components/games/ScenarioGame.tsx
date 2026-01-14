// apps/web/components/games/ScenarioGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import GameResultCard from './GameResultCard';

type Option = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type ScenarioConfig = {
  scenario: string;
  question: string;
  imageUrl?: string;
  options: Option[];
  allowMultipleCorrect?: boolean;
  xp?: number;
  points?: number;
  totalXp?: number;
  totalPoints?: number;
};

type ScenarioGameProps = {
  config: ScenarioConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    timeSpent: number;
    userActions?: any;  // ✅ NEW
  }) => void;
  previousState?: any | null;  // ✅ NEW
};

export default function ScenarioGame({
  config,
  mode,
  onComplete,
  previousState,
}: ScenarioGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';
  const allowMultiple = !!config.allowMultipleCorrect;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    previousState?.userActions?.selectedIds 
      ? new Set(previousState.userActions.selectedIds)
      : new Set()
  );
  const [showFeedback, setShowFeedback] = useState(!!previousState);
  const [isSubmitted, setIsSubmitted] = useState(!!previousState);
  const [isPerfect, setIsPerfect] = useState(() => {
    // ✅ Calculate isPerfect from previousState
    if (previousState?.userActions?.selectedIds && previousState?.result?.success) {
      return previousState.result.success;
    }
    return false;
  });
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  // ✅ NEW: Store result data for GameResultCard
  const [resultData, setResultData] = useState<any>(
    previousState ? {
      success: previousState.result?.success ?? false,
      earnedXp: previousState.result?.earnedXp,
      earnedPoints: previousState.result?.earnedPoints,
      attempts: previousState.result?.attempts ?? 0,
    } : null
  );

  const correctIds = useMemo(() => {
    return new Set(config.options.filter(o => o.correct).map(o => o.id));
  }, [config.options]);

  const toggleOption = (id: string) => {
    if (isSubmitted || isPreview) return;

    const newSelected = new Set(selectedIds);
    if (allowMultiple) {
      newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    } else {
      newSelected.clear();
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0 || isSubmitted || isPreview) return;

    setAttempts(a => a + 1);

    const isPerfectAnswer =
      selectedIds.size === correctIds.size &&
      [...selectedIds].every(id => correctIds.has(id));

    setIsPerfect(isPerfectAnswer);
    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Calculate earned reward
    let earned = 0;
    
    // Check if per-option rewards are configured
    const hasPerOptionRewards = config.options.some(opt => 
      isQuiz ? (opt.points && opt.points > 0) : (opt.xp && opt.xp > 0)
    );
    
    if (hasPerOptionRewards) {
      // Use per-option rewards (sum of selected correct options)
      earned = config.options
        .filter(opt => selectedIds.has(opt.id) && opt.correct)
        .reduce((sum, opt) => sum + (isQuiz ? (opt.points || 0) : (opt.xp || 0)), 0);
    } else {
      // Fallback: Use total reward
      if (isPerfectAnswer) {
        earned = totalReward;
      } else if (allowMultiple) {
        // Partial credit: proportion of correct selections
        const correctSelections = Array.from(selectedIds).filter(id => correctIds.has(id)).length;
        const totalCorrect = correctIds.size;
        earned = Math.round((correctSelections / totalCorrect) * totalReward);
      } else {
        earned = 0; // Single answer mode: all or nothing
      }
    }

    // ✅ Store result data for GameResultCard
    const resultPayload = {
      success: isPerfectAnswer,
      earnedXp: isQuiz ? undefined : earned,
      earnedPoints: isQuiz ? earned : undefined,
      attempts: attempts + 1,
    };
    
    setResultData(resultPayload);

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        ...resultPayload,
        timeSpent,
        userActions: { selectedIds: Array.from(selectedIds) },
      });
    } else {
      // Lesson mode: show feedback
      if (isPerfectAnswer) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#86efac'],
        });
      }

      setTimeout(() => {
        onComplete?.({
          ...resultPayload,
          timeSpent,
          userActions: { selectedIds: Array.from(selectedIds) },
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setSelectedIds(new Set());
    setShowFeedback(false);
    setIsSubmitted(false);
    setIsPerfect(false);
    setResultData(null); // ✅ Clear result data
  };

  const totalReward = isQuiz ? (config.totalPoints || config.points || 100) : (config.totalXp || config.xp || 100);

  // Calculate current earned for display
  const currentEarned = useMemo(() => {
    if (!showFeedback) return 0;
    
    // Check if per-option rewards are configured
    const hasPerOptionRewards = config.options.some(opt => 
      isQuiz ? (opt.points && opt.points > 0) : (opt.xp && opt.xp > 0)
    );
    
    if (hasPerOptionRewards) {
      // Use per-option rewards
      return config.options
        .filter(opt => selectedIds.has(opt.id) && opt.correct)
        .reduce((sum, opt) => sum + (isQuiz ? (opt.points || 0) : (opt.xp || 0)), 0);
    } else {
      // Fallback: Use total reward
      const isPerfectAnswer =
        selectedIds.size === correctIds.size &&
        [...selectedIds].every(id => correctIds.has(id));
      
      if (isPerfectAnswer) {
        return totalReward;
      } else if (allowMultiple) {
        // Partial credit
        const correctSelections = config.options.filter(opt => selectedIds.has(opt.id) && opt.correct).length;
        const totalCorrect = correctIds.size;
        return Math.round((correctSelections / totalCorrect) * totalReward);
      }
      
      return 0;
    }
  }, [config.options, selectedIds, showFeedback, isQuiz, allowMultiple, correctIds, totalReward]);

  // Instruction for game mechanics (used in header and tooltip)
  const gameMechanicsInstruction = allowMultiple 
    ? 'Read the scenario and select all correct options. Partial credit available.'
    : 'Read the scenario and select the correct option from the choices below.';

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Compact Header - Single Line */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md">
          {/* Left: Info Icon with Tooltip */}
          <div className="relative group">
            <motion.div
              className="w-8 h-8 flex items-center justify-center cursor-help"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'loop',
              }}
            >
              <span className="text-3xl font-bold text-blue-500">?</span>
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">
                {gameMechanicsInstruction}
              </p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Instruction Text - Always Visible */}
          <div className="text-center flex-1 px-4">
            <p className="text-sm text-gray-700 truncate">
              {gameMechanicsInstruction}
            </p>
          </div>

          {/* Preview Mode Info */}
          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • {allowMultiple ? 'Partial Credit' : 'Single Answer'}
            </div>
          )}
        </div>
      </div>

      {/* Side-by-side Layout: Left (Scenario) + Right (Question & Options) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT PANEL: Scenario + Image (40%) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Scenario Description */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl lg:sticky lg:top-4"
          >
            <h4 className="text-xs font-bold text-amber-800 mb-2">SCENARIO</h4>
            <p className="text-sm leading-relaxed text-gray-800">
              {config.scenario}
            </p>
          </motion.div>

          {/* Scenario Image */}
          {config.imageUrl && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex justify-center lg:sticky lg:top-[calc(1rem+theme(spacing.4))]"
            >
              <img
                src={config.imageUrl}
                alt="Scenario"
                className="max-h-[30vh] w-full object-contain rounded-lg border-2 border-gray-200 bg-gray-50 shadow-sm"
              />
            </motion.div>
          )}
        </div>

        {/* RIGHT PANEL: Question + Options (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Question */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl"
          >
            <h4 className="text-xs font-bold text-blue-800 mb-2">QUESTION</h4>
            <p className="text-base font-semibold text-gray-800">
              {config.question}
            </p>
            {allowMultiple && (
              <p className="mt-1 text-xs text-blue-700 font-medium">
                Select all correct • Partial credit available
              </p>
            )}
          </motion.div>

          {/* Options - Strips Layout */}
          <div className="space-y-3">
            {config.options.map((option, index) => {
              const isSelected = selectedIds.has(option.id);
              const isCorrect = option.correct;
              const reward = isQuiz ? (option.points || 0) : (option.xp || 0);

              const wasCorrectlySelected = showFeedback && isSelected && isCorrect;
              const wasWronglySelected = showFeedback && isSelected && !isCorrect;
              const wasMissed = showFeedback && !isSelected && isCorrect;

              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col"
                >
                  <label
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none',
                      !isSubmitted && !isPreview && 'hover:border-blue-400 hover:shadow-md',
                      isSelected && !showFeedback && 'border-blue-500 bg-blue-50 ring-2 ring-blue-300',
                      !isSelected && !showFeedback && 'border-gray-300 bg-white',
                      wasCorrectlySelected && 'border-green-500 bg-green-50 ring-2 ring-green-300',
                      wasWronglySelected && 'border-red-500 bg-red-50 ring-2 ring-red-300',
                      wasMissed && 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300',
                      (isSubmitted || isPreview) && 'cursor-default'
                    )}
                  >
                    {/* Checkbox/Radio */}
                    <input
                      type={allowMultiple ? 'checkbox' : 'radio'}
                      name="scenario-option"
                      checked={isSelected}
                      onChange={() => toggleOption(option.id)}
                      disabled={isSubmitted || isPreview}
                      className={clsx(
                        'w-5 h-5 flex-shrink-0',
                        allowMultiple ? 'rounded' : 'rounded-full',
                        'text-blue-600 focus:ring-blue-500'
                      )}
                    />

                    {/* Letter Badge */}
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + index)}
                    </div>

                    {/* Option Image */}
                    {option.imageUrl && (
                      <img
                        src={option.imageUrl}
                        alt=""
                        className="flex-shrink-0 w-16 h-16 object-cover rounded-lg border"
                      />
                    )}

                    {/* Text */}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {option.text}
                      </p>
                      {allowMultiple && isCorrect && reward > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          +{reward} {isQuiz ? 'pts' : 'XP'}
                        </span>
                      )}
                    </div>

                    {/* Feedback Icons (Lesson mode only) */}
                    {!isQuiz && showFeedback && isSelected && (
                      <div className="flex-shrink-0 text-2xl">
                        {isCorrect ? '✓' : '✗'}
                      </div>
                    )}
                  </label>

                  {/* Per-option feedback text (Lesson mode only, after submission) */}
                  {!isQuiz && showFeedback && option.feedback && isSelected && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={clsx(
                        'mt-2 p-3 rounded-lg text-sm',
                        isCorrect
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      )}
                    >
                      <span className="font-semibold">{isCorrect ? 'Correct: ' : 'Incorrect: '}</span>
                      {option.feedback}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Submit Button - Bottom Right */}
      <div className="mt-6 flex justify-end">
        {mode !== 'preview' && !isSubmitted && (
          <motion.button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0}
            className={clsx(
              "px-6 py-2 rounded-lg font-semibold text-white shadow-lg transition-all",
              selectedIds.size > 0
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={selectedIds.size > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedIds.size > 0 ? { scale: 0.95 } : {}}
          >
            Submit
          </motion.button>
        )}
      </div>

      {/* ✅ Game Result Card */}
      {resultData && (
        <GameResultCard
          mode={mode}
          success={resultData.success}
          metrics={{
            score: `${[...selectedIds].filter(id => correctIds.has(id)).length}/${correctIds.size}`,
            xpEarned: resultData.earnedXp,
            pointsEarned: resultData.earnedPoints,
            attempts: resultData.attempts,
            // Don't show time - this is not a time-dependent game
          }}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  );
}