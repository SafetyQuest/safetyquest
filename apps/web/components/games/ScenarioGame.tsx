// apps/web/components/games/ScenarioGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
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
  const [isPerfect, setIsPerfect] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const correctIds = useMemo(() => {
    return new Set(config.options.filter(o => o.correct).map(o => o.id));
  }, [config.options]);

  const toggleOption = (id: string) => {
    if (showFeedback || isPreview) return;

    const newSelected = new Set(selectedIds);
    if (allowMultiple) {
      newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
    } else {
      newSelected.clear();
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setShowFeedback(false);
  };

  const checkAnswer = () => {
    if (selectedIds.size === 0) {
      toast.error('Please select at least one option');
      return;
    }

    setAttempts(a => a + 1);

    const isPerfectAnswer =
      selectedIds.size === correctIds.size &&
      [...selectedIds].every(id => correctIds.has(id));

    setIsPerfect(isPerfectAnswer);
    setShowFeedback(true);

    const earned = config.options
      .filter(opt => selectedIds.has(opt.id) && opt.correct)
      .reduce((sum, opt) => sum + (isQuiz ? (opt.points || 0) : (opt.xp || 0)), 0);

    const totalReward = isQuiz ? (config.points || 100) : (config.xp || 100);

    if (isPerfectAnswer) {
      confetti({
        particleCount: 140,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#10B981', '#34D399', '#6EE7B7', '#86EFAC'],
      });

      toast.success(`Perfect! +${earned} ${isQuiz ? 'pts' : 'XP'}`, {
        duration: 5000,
        icon: 'Trophy',
      });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      setTimeout(() => {
        onComplete?.({
          success: true,
          earnedXp: isQuiz ? undefined : earned,
          earnedPoints: isQuiz ? earned : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 2000);
    } else {
      const partial = earned > 0 && earned < totalReward;
      toast[partial ? 'warning' : 'error'](
        partial
          ? `Good try — you earned ${earned} ${isQuiz ? 'pts' : 'XP'}`
          : 'Not quite right — try again!',
        { duration: 4000 }
      );
    }
  };

  const reset = () => {
    setSelectedIds(new Set());
    setShowFeedback(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">

      {/* Scenario Image */}
      <AnimatePresence>
        {config.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-10 -mx-6"
          >
            <img
              src={config.imageUrl}
              alt="Scenario"
              className="w-full max-h-96 object-contain rounded-2xl border-4 border-gray-100 bg-gray-50 shadow-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scenario Description */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl shadow-lg text-center"
      >
        <p className="text-xl leading-relaxed text-gray-800 font-medium">
          {config.scenario}
        </p>
      </motion.div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h2 className="text-3xl font-bold text-gray-800 leading-tight">
          {config.question}
        </h2>
        {allowMultiple && (
          <p className="mt-3 text-lg text-amber-700 font-medium">
            Select all that apply
          </p>
        )}
        {isPreview && (
          <p className="mt-4 px-6 py-2 bg-purple-100 text-purple-700 rounded-full inline-block text-sm font-medium">
            Preview • Scenario • {allowMultiple ? 'Partial Credit' : 'Single Answer'}
          </p>
        )}
      </motion.div>

      {/* Options */}
      <div className="grid gap-5 mb-12">
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
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <label
                className={clsx(
                  'flex items-center gap-5 p-6 rounded-2xl border-4 cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl',
                  !showFeedback && 'hover:border-blue-400',
                  !showFeedback && isSelected && 'border-blue-500 bg-blue-50',
                  wasCorrectlySelected && 'border-green-500 bg-green-50',
                  wasWronglySelected && 'border-red-500 bg-red-50',
                  wasMissed && 'border-amber-400 bg-amber-50'
                )}
              >
                <input
                  type={allowMultiple ? 'checkbox' : 'radio'}
                  name="scenario-option"
                  checked={isSelected}
                  onChange={() => toggleOption(option.id)}
                  disabled={showFeedback || isPreview}
                  className={clsx(
                    'w-7 h-7',
                    allowMultiple ? 'rounded' : 'rounded-full',
                    'text-blue-600 focus:ring-blue-500'
                  )}
                />

                {/* Letter Badge — identical to MultipleChoice */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-md">
                  {String.fromCharCode(65 + index)}
                </div>

                {option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt=""
                    className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 flex-shrink-0"
                  />
                )}

                <div className="flex-1">
                  <p className="text-xl font-medium text-gray-800 leading-relaxed">
                    {option.text}
                  </p>
                  {isCorrect && reward > 0 && (
                    <span className="inline-block mt-2 px-4 py-1.5 bg-emerald-100 text-emerald-800 rounded-full text-sm font-bold">
                      +{reward} {isQuiz ? 'pts' : 'XP'}
                    </span>
                  )}
                </div>

                {/* Feedback Icons */}
                <AnimatePresence>
                  {showFeedback && isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-5xl"
                    >
                      {isCorrect ? 'Correct' : 'Incorrect'}
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>

              {/* Per-option feedback text */}
              <AnimatePresence>
                {showFeedback && option.feedback && isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className={clsx(
                      'mt-3 p-4 rounded-xl text-lg',
                      isCorrect
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-red-100 text-red-800 border border-red-300'
                    )}
                  >
                    {option.feedback}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Buttons — EXACT same as MultipleChoiceGame */}
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
            Submit Answer
          </button>
        )}

        {showFeedback && !isPerfect && !isPreview && (
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
            Up to +{isQuiz ? (config.points || 100) : (config.xp || 100)} {isQuiz ? 'Points' : 'XP'}
          </span>
          {allowMultiple && (
            <p className="mt-4 text-lg text-gray-600">
              Earn partial credit for each correct choice
            </p>
          )}
        </motion.div>
      )}

      {/* Perfect Celebration */}
      <AnimatePresence>
        {showFeedback && isPerfect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center mt-12"
          >
            <div className="text-8xl mb-6">Congratulations</div>
            <p className="text-3xl font-bold text-green-600">
              Perfect Response!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}