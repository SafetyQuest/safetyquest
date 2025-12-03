// apps/web/components/games/MultipleChoiceGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
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
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const correctIds = useMemo(() => {
    return new Set(config.options.filter(o => o.correct).map(o => o.id));
  }, [config.options]);

  const totalReward = isQuiz ? (config.points || 100) : (config.xp || 100);

  const toggleOption = (id: string) => {
    if (showFeedback || isPreview) return;

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
    setShowFeedback(false);
  };

  const checkAnswer = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one answer');
      return;
    }
  
    setAttempts(a => a + 1);
  
    const isCorrect =
      selectedIds.size === correctIds.size &&
      [...selectedIds].every(id => correctIds.has(id));
  
    setIsCorrect(isCorrect);     // ← THIS WAS MISSING
    setShowFeedback(true);
  
    if (isCorrect) {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#86EFAC'],
      });
  
      toast.success(`Perfect! +${totalReward} ${isQuiz ? 'pts' : 'XP'}`, {
        duration: 5000,
        icon: 'Congratulations',
      });
  
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
  
      setTimeout(() => {
        onComplete?.({
          success: true,
          earnedXp: isQuiz ? undefined : totalReward,
          earnedPoints: isQuiz ? totalReward : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 2000);
    } else {
      toast.error('Not quite right — try again!', { duration: 4000 });
    }
  };

  const reset = () => {
    setSelectedIds(new Set());
    setShowFeedback(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold text-gray-800 leading-tight">
          {config.instruction}
        </h2>
        {isPreview && (
          <p className="mt-4 px-6 py-2 bg-purple-100 text-purple-700 rounded-full inline-block text-sm font-medium">
            Preview • Multiple Choice • {allowMultiple ? 'Select All That Apply' : 'Single Answer'}
          </p>
        )}
      </motion.div>

      {/* Question Image */}
      <AnimatePresence>
        {config.instructionImageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 -mx-6"
          >
            <img
              src={config.instructionImageUrl}
              alt="Question context"
              className="w-full max-h-96 object-contain rounded-2xl border-4 border-gray-100 bg-gray-50 shadow-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Options Grid */}
      <div className="grid gap-5 mb-12">
        {config.options.map((option, index) => {
          const isSelected = selectedIds.has(option.id);
          const isCorrectAnswer = option.correct;
          const wasWronglySelected = showFeedback && isSelected && !isCorrectAnswer;
          const wasMissed = showFeedback && isCorrectAnswer && !isSelected;

          return (
            <motion.div
              key={option.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <label
                className={clsx(
                  'flex items-center gap-5 p-6 rounded-2xl border-4 cursor-pointer transition-all duration-300 shadow-lg',
                  'hover:shadow-xl',
                  !showFeedback && 'hover:border-blue-400',
                  isSelected && !showFeedback && 'border-blue-500 bg-blue-50',
                  showFeedback && isCorrectAnswer && 'border-green-500 bg-green-50',
                  wasWronglySelected && 'border-red-500 bg-red-50',
                  wasMissed && 'border-amber-400 bg-amber-50'
                )}
              >
                <input
                  type={allowMultiple ? 'checkbox' : 'radio'}
                  name="mcq-option"
                  checked={isSelected}
                  onChange={() => toggleOption(option.id)}
                  disabled={showFeedback || isPreview}
                  className={clsx(
                    'w-7 h-7 rounded-full',
                    allowMultiple ? 'rounded' : 'rounded-full',
                    'text-blue-600 focus:ring-blue-500'
                  )}
                />

                {/* Letter Badge */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                  {String.fromCharCode(65 + index)}
                </div>

                {/* Option Image */}
                {option.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={option.imageUrl}
                      alt=""
                      className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200"
                    />
                  </div>
                )}

                {/* Text */}
                <div className="flex-1">
                  <p className="text-xl font-medium text-gray-800 leading-relaxed">
                    {option.text}
                  </p>
                </div>

                {/* Feedback Icons */}
                <AnimatePresence>
                  {showFeedback && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-5xl"
                    >
                      {isCorrectAnswer ? 'Correct' : wasWronglySelected ? 'Incorrect' : ''}
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </motion.div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6">
        {!showFeedback && !isPreview && (
          <button
            onClick={checkAnswer}
            disabled={selectedIds.size === 0}
            className={clsx(
              'px-16 py-6 rounded-3xl font-bold text-2xl shadow-2xl transition-all',
              selectedIds.size === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 active:scale-95'
            )}
          >
            Check Answer
          </button>
        )}

        {showFeedback && !isCorrect && !isPreview && (
          <button
            onClick={reset}
            className="px-12 py-5 rounded-2xl bg-red-600 text-white font-bold hover:bg-red-700 active:scale-95 shadow-xl"
          >
            Try Again
          </button>
        )}
      </div>

      {/* Reward Preview */}
      {!showFeedback && !isPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-12"
        >
          <span className="inline-block px-10 py-5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-full text-2xl font-bold shadow-lg">
            +{totalReward} {isQuiz ? 'Points' : 'XP'} for perfect answer
          </span>
          {correctIds.size > 1 && (
            <p className="mt-4 text-lg text-gray-600">
              Select <strong>all {correctIds.size}</strong> correct answers
            </p>
          )}
        </motion.div>
      )}

      {/* Final Success Message */}
      <AnimatePresence>
        {showFeedback && isCorrect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-12"
          >
            <div className="text-8xl mb-6">Congratulations</div>
            <p className="text-3xl font-bold text-green-600">
              Perfect! You earned {totalReward} {isQuiz ? 'points' : 'XP'}!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}