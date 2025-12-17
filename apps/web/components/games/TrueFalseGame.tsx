// apps/web/components/games/TrueFalseGame.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const reward = isQuiz ? config.points || 10 : config.xp || 10;

  const handleAnswer = (answer: boolean) => {
    if (showFeedback || isPreview || isSubmitted) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null || isPreview || isSubmitted) return;

    const correct = selectedAnswer === config.correctAnswer;
    setShowFeedback(true);
    setIsSubmitted(true);
    setAttempts(a => a + 1);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    if (isQuiz) {
      // Quiz mode: silent submission, no feedback
      onComplete?.({
        success: correct,
        earnedPoints: correct ? reward : 0,
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
          earnedXp: correct ? reward : 0,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsSubmitted(false);
  };

  const isCorrect = selectedAnswer === config.correctAnswer;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.instruction || 'Determine if the following statement is true or false.'}
        </h3>

        {isPreview && (
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • True/False Question
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
              {isCorrect ? 'Correct!' : 'Incorrect'}
            </p>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              +{isCorrect ? reward : 0} XP
            </p>
          </motion.div>
        )}
      </div>

      {/* Image */}
      {config.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 flex justify-center"
        >
          <img
            src={config.imageUrl}
            alt="Question context"
            className="max-h-[60vh] w-auto object-contain rounded-xl border-2 border-gray-200 bg-gray-50 shadow-md"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>
      )}

      {/* Statement */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-l-4 border-blue-500">
          <p className="text-lg leading-relaxed font-medium text-gray-800">
            {config.statement || 'No statement provided.'}
          </p>
        </div>
      </motion.div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <motion.button
          whileTap={isPreview || isSubmitted ? {} : { scale: 0.95 }}
          onClick={() => handleAnswer(true)}
          disabled={isSubmitted || isPreview}
          className={clsx(
            'relative overflow-hidden rounded-xl p-6 text-xl font-bold transition-all duration-300',
            'flex items-center justify-center gap-3 shadow-lg',
            selectedAnswer === true && !isSubmitted && 'ring-4 ring-blue-400',
            'bg-green-100 text-green-700 hover:bg-green-200',
            (isSubmitted || isPreview) && 'cursor-default opacity-60'
          )}
        >
          <span>True</span>
        </motion.button>

        <motion.button
          whileTap={isPreview || isSubmitted ? {} : { scale: 0.95 }}
          onClick={() => handleAnswer(false)}
          disabled={isSubmitted || isPreview}
          className={clsx(
            'relative overflow-hidden rounded-xl p-6 text-xl font-bold transition-all duration-300',
            'flex items-center justify-center gap-3 shadow-lg',
            selectedAnswer === false && !isSubmitted && 'ring-4 ring-blue-400',
            'bg-red-100 text-red-700 hover:bg-red-200',
            (isSubmitted || isPreview) && 'cursor-default opacity-60'
          )}
        >
          <span>False</span>
        </motion.button>
      </div>

      {/* Submit Button */}
      {!isSubmitted && !isPreview && (
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={clsx(
              "px-8 py-3 rounded-lg font-semibold text-white text-lg shadow-lg transition-all",
              selectedAnswer !== null
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={selectedAnswer !== null ? { scale: 1.05 } : {}}
            whileTap={selectedAnswer !== null ? { scale: 0.95 } : {}}
          >
            Submit Answer
          </motion.button>
          
          {selectedAnswer === null && (
            <p className="mt-2 text-sm text-gray-500">
              Please select True or False
            </p>
          )}
        </div>
      )}

      {/* Explanation (Lesson mode only, after submission) */}
      {!isQuiz && isSubmitted && showFeedback && config.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 rounded-xl bg-blue-50 border-2 border-blue-200"
        >
          <h4 className="text-lg font-bold text-blue-900 mb-3">Explanation</h4>
          <p className="text-base leading-relaxed text-gray-700">
            {config.explanation}
          </p>
          <p className="mt-3 text-sm font-semibold text-blue-800">
            Correct answer: <strong>{config.correctAnswer ? 'TRUE' : 'FALSE'}</strong>
          </p>
        </motion.div>
      )}

      {/* Try Again Button (Lesson mode only, after submission) */}
      {mode === 'lesson' && isSubmitted && showFeedback && (
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