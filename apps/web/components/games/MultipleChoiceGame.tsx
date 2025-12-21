// apps/web/components/games/MultipleChoiceGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

type MultipleChoiceOption = {
  id: string;
  text: string;
  correct: boolean;
  imageUrl?: string;
};

type MultipleChoiceConfig = {
  instruction: string;
  instructionImageUrl?: string;
  options: MultipleChoiceOption[];
  allowMultipleCorrect: boolean;
  xp?: number;
  points?: number;
};

type MultipleChoiceGameProps = {
  config: MultipleChoiceConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    timeSpent: number;
  }) => void;
};

export default function MultipleChoiceGame({
  config,
  mode,
  onComplete,
}: MultipleChoiceGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';
  const allowMultiple = config.allowMultipleCorrect;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const correctIds = useMemo(() => {
    return new Set(config.options.filter(o => o.correct).map(o => o.id));
  }, [config.options]);

  const totalReward = isQuiz ? (config.points || 100) : (config.xp || 100);

  const toggleOption = (id: string) => {
    if (isSubmitted || isPreview) return;

    const newSelected = new Set(selectedIds);

    if (allowMultiple) {
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
    } else {
      // Single select: radio behavior
      newSelected.clear();
      newSelected.add(id);
    }

    setSelectedIds(newSelected);
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0 || isSubmitted || isPreview) return;

    setAttempts(a => a + 1);

    const correct =
      selectedIds.size === correctIds.size &&
      [...selectedIds].every(id => correctIds.has(id));

    setIsCorrect(correct);
    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        success: correct,
        earnedPoints: correct ? totalReward : 0,
        attempts: attempts + 1,
        timeSpent,
      });
    } else {
      // Lesson mode: show feedback
      if (correct) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#86efac'],
        });
      }

      setTimeout(() => {
        onComplete?.({
          success: correct,
          earnedXp: correct ? totalReward : 0,
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
    setIsCorrect(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.instruction}
        </h3>

        {isPreview && (
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • {allowMultiple ? 'Multiple Answers' : 'Single Answer'}
          </p>
        )}

        {/* Hint (not submitted yet) */}
        {mode !== 'preview' && !isSubmitted && (
          <div className="max-w-md mx-auto mt-4">
            <p className="text-xs text-gray-500">
              {allowMultiple 
                ? `Select all correct answers (${correctIds.size} correct)`
                : 'Select the correct answer'}
            </p>
          </div>
        )}

        {/* Results Display (Lesson mode only) */}
        {!isQuiz && isSubmitted && showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
          >
            <p className="text-2xl font-bold text-green-600">
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              +{isCorrect ? totalReward : 0} XP
            </p>
          </motion.div>
        )}
      </div>

      {/* Question Image */}
      {config.instructionImageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex justify-center"
        >
          <img
            src={config.instructionImageUrl}
            alt="Question context"
            className="max-h-[60vh] w-auto object-contain rounded-xl border-2 border-gray-200 bg-gray-50 shadow-md"
          />
        </motion.div>
      )}

      {/* Options List */}
      <div className="space-y-3 mb-6">
        {config.options.map((option, index) => {
          const isSelected = selectedIds.has(option.id);
          const isCorrectAnswer = option.correct;
          const wasWronglySelected = showFeedback && isSelected && !isCorrectAnswer;
          const wasMissed = showFeedback && isCorrectAnswer && !isSelected;

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
                  showFeedback && isCorrectAnswer && 'border-green-500 bg-green-50 ring-2 ring-green-300',
                  wasWronglySelected && 'border-red-500 bg-red-50 ring-2 ring-red-300',
                  wasMissed && 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-300',
                  (isSubmitted || isPreview) && 'cursor-default'
                )}
              >
                {/* Checkbox/Radio */}
                <input
                  type={allowMultiple ? 'checkbox' : 'radio'}
                  name="mcq-option"
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
                </div>

                {/* Feedback Icons (Lesson mode only) */}
                {!isQuiz && showFeedback && (
                  <div className="flex-shrink-0 text-2xl">
                    {isCorrectAnswer && '✓'}
                    {wasWronglySelected && '✗'}
                  </div>
                )}
              </label>
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
        </div>
      )}

      {/* Try Again Button (Lesson mode only, after submission) */}
      {mode === 'lesson' && isSubmitted && showFeedback && !isCorrect && (
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