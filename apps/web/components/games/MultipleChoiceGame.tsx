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
                {allowMultiple 
                  ? 'Select all correct options from the choices below'
                  : 'Select the correct option from the choices below'}
              </p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Results (lesson mode, after submission) */}
          {!isQuiz && isSubmitted && showFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
            >
              <span className="text-lg font-bold text-green-600">
                {isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-lg font-semibold text-gray-700">
                +{isCorrect ? totalReward : 0} XP
              </span>
            </motion.div>
          )}

          {/* Right: Submit Button (if not submitted and not preview) */}
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

          {/* Right: Try Again Button (lesson mode, after submission, if incorrect) */}
          {mode === 'lesson' && isSubmitted && showFeedback && !isCorrect && (
            <motion.button
              onClick={handleTryAgain}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-2 rounded-lg font-semibold text-white shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          )}

          {/* Preview Mode Info */}
          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • {allowMultiple ? 'Multiple Answers' : 'Single Answer'}
            </div>
          )}
        </div>
      </div>

      {/* Question Statement - Reduced padding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
          <p className="text-base leading-relaxed font-medium text-gray-800">
            {config.instruction}
          </p>
        </div>
      </motion.div>

      {/* Question Image - Smaller size */}
      {config.instructionImageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex justify-center"
        >
          <img
            src={config.instructionImageUrl}
            alt="Question context"
            className="max-h-[30vh] w-auto object-contain rounded-lg border-2 border-gray-200 bg-gray-50 shadow-sm"
          />
        </motion.div>
      )}

      {/* Options List - Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  'flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all select-none',
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
    </div>
  );
}