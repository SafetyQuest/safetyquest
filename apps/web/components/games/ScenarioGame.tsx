// apps/web/components/games/ScenarioGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

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
  }) => void;
};

export default function ScenarioGame({
  config,
  mode,
  onComplete,
}: ScenarioGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';
  const allowMultiple = !!config.allowMultipleCorrect;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPerfect, setIsPerfect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

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

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        success: isPerfectAnswer,
        earnedPoints: earned,
        attempts: attempts + 1,
        timeSpent,
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
          success: isPerfectAnswer,
          earnedXp: earned,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setSelectedIds(new Set());
    setShowFeedback(false);
    setIsSubmitted(false);
    setIsPerfect(false);
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Scenario-Based Question
        </h3>

        {isPreview && (
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • {allowMultiple ? 'Partial Credit Possible' : 'Single Answer'}
          </p>
        )}

        {/* Results Display (Lesson mode only) */}
        {!isQuiz && isSubmitted && showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
          >
            <p className="text-2xl font-bold text-green-600">
              {isPerfect ? 'Perfect!' : currentEarned > 0 ? 'Partial Credit' : 'Incorrect'}
            </p>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              +{currentEarned} XP {!isPerfect && `(of ${totalReward})`}
            </p>
          </motion.div>
        )}
      </div>

      {/* Scenario Image */}
      {config.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex justify-center"
        >
          <img
            src={config.imageUrl}
            alt="Scenario"
            className="max-h-[60vh] w-auto object-contain rounded-xl border-2 border-gray-200 bg-gray-50 shadow-md"
          />
        </motion.div>
      )}

      {/* Scenario Description */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-xl shadow-md"
      >
        <h4 className="text-sm font-bold text-amber-800 mb-2">SCENARIO</h4>
        <p className="text-base leading-relaxed text-gray-800">
          {config.scenario}
        </p>
      </motion.div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-xl"
      >
        <h4 className="text-sm font-bold text-blue-800 mb-2">QUESTION</h4>
        <p className="text-lg font-semibold text-gray-800">
          {config.question}
        </p>
        {allowMultiple && (
          <p className="mt-2 text-sm text-blue-700 font-medium">
            Select all correct answers • Partial credit available
          </p>
        )}
      </motion.div>

      {/* Options */}
      <div className="space-y-3 mb-6">
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
            >
              <label
                className={clsx(
                  'flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none',
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

      {/* Submit Button */}
      {!isSubmitted && !isPreview && (
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleSubmit}
            disabled={selectedIds.size === 0}
            className={clsx(
              "px-8 py-3 rounded-lg font-semibold text-white text-lg shadow-lg transition-all",
              selectedIds.size > 0
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={selectedIds.size > 0 ? { scale: 1.05 } : {}}
            whileTap={selectedIds.size > 0 ? { scale: 0.95 } : {}}
          >
            Submit Answer{selectedIds.size > 1 ? 's' : ''}
          </motion.button>
          
          {selectedIds.size === 0 && (
            <p className="mt-2 text-sm text-gray-500">
              Please select at least one answer
            </p>
          )}
          
          {allowMultiple && (
            <p className="mt-2 text-xs text-gray-500">
              Earn partial credit for each correct choice
            </p>
          )}
        </div>
      )}

      {/* Try Again Button (Lesson mode only, after submission) */}
      {mode === 'lesson' && isSubmitted && showFeedback && !isPerfect && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center"
        >
          <motion.button
            onClick={handleTryAgain}
            className="px-8 py-3 rounded-lg font-semibold text-white text-lg shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}