// apps/web/components/games/TrueFalseGame.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import GameResultCard from './shared/GameResultCard';
import TrueFalseResultsCard from './shared/TrueFalseResultsCard';

type TrueFalseConfig = {
  instruction: string;
  statement: string;
  correctAnswer: boolean;
  trueExplanation?: string;
  falseExplanation?: string;
  generalFeedback?: string;
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
    userActions?: any;
  }) => void;
  previousState?: any | null;
};

export default function TrueFalseGame({
  config,
  mode,
  onComplete,
  previousState,
}: TrueFalseGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(
    previousState?.userActions?.selectedAnswer ?? null
  );
  const [showFeedback, setShowFeedback] = useState(!!previousState);
  const [isSubmitted, setIsSubmitted] = useState(!!previousState);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const [resultData, setResultData] = useState<{
    success: boolean;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    userActions?: { selectedAnswer: boolean };
  } | null>(
    previousState ? {
      success: previousState.result?.success ?? false,
      earnedXp: previousState.result?.earnedXp,
      earnedPoints: previousState.result?.earnedPoints,
      attempts: previousState.result?.attempts ?? 0,
      userActions: previousState.userActions,
    } : null
  );

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

    const resultPayload = {
      success: correct,
      earnedXp: isQuiz ? undefined : (correct ? reward : 0),
      earnedPoints: isQuiz ? (correct ? reward : 0) : undefined,
      attempts: attempts + 1,
      timeSpent,
      userActions: { selectedAnswer },
    };
    
    setResultData(resultPayload);

    if (isQuiz) {
      onComplete?.({
        ...resultPayload,
        userActions: { selectedAnswer }, 
      });
    } else {
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
          ...resultPayload,
          userActions: { selectedAnswer },
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setSelectedAnswer(null);
    setShowFeedback(false);
    setIsSubmitted(false);
    setResultData(null);
  };

  const isCorrect = selectedAnswer === config.correctAnswer;

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4">
        <div className="flex items-start justify-between px-4 py-3 bg-white rounded-lg shadow-md">
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
            
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">Read the statement carefully and decide whether it is true or false based on your knowledge.</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          <div className="text-center text-gray-700 font-medium flex-1 px-4">
            {config.instruction || 'Determine if the following statement is true or false.'}
          </div>

          <div className="flex flex-col items-end gap-1 min-w-[80px]">
            {mode === 'preview' && (
              <div className="text-xs text-gray-500 text-right">
                True/False Question
              </div>
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border-l-4 border-blue-500">
          <p className="text-base leading-relaxed font-medium text-gray-800">
            {config.statement || 'No statement provided.'}
          </p>
        </div>
      </motion.div>

      {config.imageUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 flex justify-center"
        >
          <img
            src={config.imageUrl}
            alt="Question context"
            className="max-h-[30vh] w-auto object-contain rounded-lg border-2 border-gray-200 bg-gray-50 shadow-sm"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </motion.div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        <motion.button
          whileTap={isPreview || isSubmitted ? {} : { scale: 0.95 }}
          onClick={() => handleAnswer(true)}
          disabled={isSubmitted || isPreview}
          className={clsx(
            'relative overflow-hidden rounded-xl p-4 text-lg font-bold transition-all duration-300',
            'flex items-center justify-center gap-2 shadow-md',
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
            'relative overflow-hidden rounded-xl p-4 text-lg font-bold transition-all duration-300',
            'flex items-center justify-center gap-2 shadow-md',
            selectedAnswer === false && !isSubmitted && 'ring-4 ring-blue-400',
            'bg-red-100 text-red-700 hover:bg-red-200',
            (isSubmitted || isPreview) && 'cursor-default opacity-60'
          )}
        >
          <span>False</span>
        </motion.button>
      </div>

      {/* Inline Feedback (Lesson mode only, after submission) */}
      {!isQuiz && showFeedback && selectedAnswer !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            'mb-4 p-4 rounded-lg border-2',
            isCorrect
              ? 'bg-green-50 text-green-800 border-green-300'
              : 'bg-red-50 text-red-800 border-red-300'
          )}
        >
          <div className="flex items-start gap-2 mb-2">
            <span className="text-lg flex-shrink-0">{isCorrect ? '✓' : '✗'}</span>
            <div className="flex-1">
              <span className="font-semibold block mb-1">
                You selected: {selectedAnswer ? 'TRUE' : 'FALSE'}
              </span>
              {(selectedAnswer ? config.trueExplanation : config.falseExplanation) && (
                <div
                  className="prose prose-sm mt-2"
                  style={{ color: 'inherit' }}
                  dangerouslySetInnerHTML={{
                    __html: selectedAnswer ? (config.trueExplanation || '') : (config.falseExplanation || '')
                  }}
                />
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex justify-end">
        {mode !== 'preview' && !isSubmitted && (
          <motion.button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={clsx(
              "px-6 py-2 rounded-lg font-semibold text-white shadow-lg transition-all",
              selectedAnswer !== null
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={selectedAnswer !== null ? { scale: 1.05 } : {}}
            whileTap={selectedAnswer !== null ? { scale: 0.95 } : {}}
          >
            Submit
          </motion.button>
        )}
      </div>

      {/* Summary Card (Lesson mode only) */}
      {mode === 'lesson' && resultData && resultData.userActions && (
        <TrueFalseResultsCard
          success={resultData.success}
          correctAnswer={config.correctAnswer}
          selectedAnswer={resultData.userActions.selectedAnswer}
          generalFeedback={config.generalFeedback}
          earnedXp={resultData.earnedXp}
          earnedPoints={resultData.earnedPoints}
          attempts={resultData.attempts}
          mode={mode}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  );
}