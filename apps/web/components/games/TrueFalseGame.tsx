// apps/web/components/games/TrueFalseGame.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type TrueFalseConfig = {
  instruction: string;
  statement: string;
  correctAnswer: boolean;
  explanation?: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type TrueFalseGameProps = {
  config: TrueFalseConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    timeSpent: number;
  }) => void;
};

export default function TrueFalseGame({
  config,
  mode,
  onComplete,
}: TrueFalseGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const reward = isQuiz ? config.points || 10 : config.xp || 10;

  const handleAnswer = (answer: boolean) => {
    if (showFeedback || isPreview) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (selectedAnswer === null) {
      toast.error('Please select True or False');
      return;
    }

    const correct = selectedAnswer === config.correctAnswer;
    setShowFeedback(true);
    setAttempts(a => a + 1);

    if (correct) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7'],
      });

      toast.success('Correct! Well done! Excellent', {
        duration: 4000,
        icon: 'Excellent',
      });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      setTimeout(() => {
        onComplete?.({
          success: true,
          earnedXp: isQuiz ? undefined : reward,
          earnedPoints: isQuiz ? reward : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 2200);
    } else {
      toast.error('Incorrect. Review the explanation.', {
        duration: 4000,
      });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);

      setTimeout(() => {
        onComplete?.({
          success: false,
          earnedXp: isQuiz ? undefined : 0,
          earnedPoints: isQuiz ? 0 : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 3000);
    }
  };

  const isCorrect = selectedAnswer === config.correctAnswer;

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h2 className="text-2xl font-bold text-gray-800 leading-tight">
          {config.instruction || 'Determine if the following statement is true or false.'}
        </h2>
        {isPreview && (
          <p className="mt-3 text-sm font-medium text-teal-700">
            Preview Mode • True/False Question
          </p>
        )}
      </motion.div>

      {/* Image */}
      <AnimatePresence>
        {config.imageUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 -mx-6"
          >
            <img
              src={config.imageUrl}
              alt="Question context"
              className="w-full max-h-96 object-contain rounded-xl border-2 border-gray-200 bg-gray-50"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden text-center py-12 text-gray-500">
              Image failed to load
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-2xl border-l-8 border-blue-500">
          <p className="text-xl leading-relaxed font-medium text-gray-800">
            {config.statement || 'No statement provided.'}
          </p>
        </div>
      </motion.div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-6 mb-10">
        <motion.button
          whileTap={isPreview || showFeedback ? {} : { scale: 0.95 }}
          onClick={() => handleAnswer(true)}
          disabled={showFeedback || isPreview}
          className={clsx(
            'relative overflow-hidden rounded-2xl p-8 text-2xl font-bold transition-all duration-300',
            'flex items-center justify-center gap-4 shadow-lg',
            selectedAnswer === true && !showFeedback && 'ring-4 ring-green-400',
            showFeedback && config.correctAnswer === true && 'bg-green-500 text-white ring-4 ring-green-400',
            showFeedback && selectedAnswer === true && !config.correctAnswer && 'bg-red-500 text-white ring-4 ring-red-400',
            !showFeedback && selectedAnswer !== true && 'bg-green-100 text-green-700 hover:bg-green-200',
            (showFeedback || isPreview) && 'cursor-default'
          )}
        >
          <span>True</span>
          {showFeedback && config.correctAnswer === true && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl">
              Correct
            </motion.span>
          )}
        </motion.button>

        <motion.button
          whileTap={isPreview || showFeedback ? {} : { scale: 0.95 }}
          onClick={() => handleAnswer(false)}
          disabled={showFeedback || isPreview}
          className={clsx(
            'relative overflow-hidden rounded-2xl p-8 text-2xl font-bold transition-all duration-300',
            'flex items-center justify-center gap-4 shadow-lg',
            selectedAnswer === false && !showFeedback && 'ring-4 ring-red-400',
            showFeedback && config.correctAnswer === false && 'bg-green-500 text-white ring-4 ring-green-400',
            showFeedback && selectedAnswer === false && config.correctAnswer && 'bg-red-500 text-white ring-4 ring-red-400',
            !showFeedback && selectedAnswer !== false && 'bg-red-100 text-red-700 hover:bg-red-200',
            (showFeedback || isPreview) && 'cursor-default'
          )}
        >
          <span>False</span>
          {showFeedback && config.correctAnswer === false && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl">
              Correct
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Submit Button */}
      {!showFeedback && !isPreview && (
        <div className="text-center">
          <button
            onClick={submitAnswer}
            disabled={selectedAnswer === null}
            className={clsx(
              'px-12 py-5 rounded-2xl font-bold text-xl shadow-xl transition-all',
              selectedAnswer === null
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-600 text-white hover:bg-teal-700 active:scale-95'
            )}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Feedback */}
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              'mt-8 p-8 rounded-2xl border-2',
              isCorrect
                ? 'bg-green-50 border-green-400'
                : 'bg-red-50 border-red-400'
            )}
          >
            <div className="flex items-start gap-4">
              {isCorrect ? (
                <div className="text-5xl">Excellent</div>
              ) : (
                <div className="text-5xl">Incorrect</div>
              )}
              <div>
                <h3 className={clsx('text-2xl font-bold mb-3', isCorrect ? 'text-green-800' : 'text-red-800')}>
                  {isCorrect ? 'Correct!' : 'Incorrect'}
                </h3>
                <p className={clsx('text-lg', isCorrect ? 'text-green-700' : 'text-red-700')}>
                  The correct answer is:{' '}
                  <strong className="font-bold">
                    {config.correctAnswer ? 'TRUE' : 'FALSE'}
                  </strong>
                </p>
                {config.explanation && (
                  <p className="mt-4 text-lg leading-relaxed text-gray-700">
                    {config.explanation}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Preview */}
      {!showFeedback && !isPreview && (
        <div className="mt-12 text-center">
          <span className="inline-block px-6 py-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-full font-semibold">
            +{reward} {isQuiz ? 'Points' : 'XP'} for correct answer
          </span>
        </div>
      )}
    </div>
  );
}