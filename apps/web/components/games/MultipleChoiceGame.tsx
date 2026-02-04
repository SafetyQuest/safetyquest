// apps/web/components/games/MultipleChoiceGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import GameResultCard from './shared/GameResultCard';
import ScenarioResultsWithFeedbackCard from './shared/ScenarioResultsWithFeedbackCard';

type MultipleChoiceOption = {
  id: string;
  text: string;
  correct: boolean;
  explanation?: string;
  imageUrl?: string;
};

type MultipleChoiceConfig = {
  instruction: string;
  instructionImageUrl?: string;
  options: MultipleChoiceOption[];
  allowMultipleCorrect: boolean;
  generalFeedback?: string;
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
    userActions?: any;
  }) => void;
  previousState?: any | null;
};

export default function MultipleChoiceGame({
  config,
  mode,
  onComplete,
  previousState,
}: MultipleChoiceGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';
  const allowMultiple = config.allowMultipleCorrect;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    // 🔧 FIX: Ensure selectedIds is always an array before creating Set
    const savedIds = previousState?.userActions?.selectedIds;
    if (savedIds && Array.isArray(savedIds)) {
      return new Set(savedIds);
    }
    return new Set();
  });
  
  const [showFeedback, setShowFeedback] = useState(!!previousState);
  const [isSubmitted, setIsSubmitted] = useState(!!previousState); 
  const [isCorrect, setIsCorrect] = useState<boolean | null>(
    previousState?.result?.success ?? null
  );
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());

  const correctIds = useMemo(() => {
    return new Set(config.options.filter(o => o.correct).map(o => o.id));
  }, [config.options]);

  const [resultData, setResultData] = useState<{
    success: boolean;
    correctCount: number;
    incorrectCount: number;
    missedCount: number;
    totalCorrect: number;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    userActions?: { selectedIds: string[] };
  } | null>(() => {
    // 🔧 FIX: Safely compute initial resultData from previousState
    if (!previousState) return null;
    
    const savedIds = previousState.userActions?.selectedIds;
    const selectedIdsArray = Array.isArray(savedIds) ? savedIds : [];
    
    return {
      success: previousState.result?.success ?? false,
      correctCount: selectedIdsArray.filter((id: string) => correctIds.has(id)).length,
      incorrectCount: selectedIdsArray.filter((id: string) => !correctIds.has(id)).length,
      missedCount: Array.from(correctIds).filter(id => !selectedIdsArray.includes(id)).length,
      totalCorrect: correctIds.size,
      earnedXp: previousState.result?.earnedXp,
      earnedPoints: previousState.result?.earnedPoints,
      attempts: previousState.result?.attempts ?? 0,
      userActions: { selectedIds: selectedIdsArray },
    };
  });

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

    const correctSelections = Array.from(selectedIds).filter(id => correctIds.has(id));
    const incorrectSelections = Array.from(selectedIds).filter(id => !correctIds.has(id));
    const missedCorrect = Array.from(correctIds).filter(id => !selectedIds.has(id));

    const resultPayload = {
      success: correct,
      correctCount: correctSelections.length,
      incorrectCount: incorrectSelections.length,
      missedCount: missedCorrect.length,
      totalCorrect: correctIds.size,
      earnedXp: isQuiz ? undefined : (correct ? totalReward : 0),
      earnedPoints: isQuiz ? (correct ? totalReward : 0) : undefined,
      attempts: attempts + 1,
      timeSpent,
      userActions: { selectedIds: Array.from(selectedIds) },
    };
    
    setResultData(resultPayload);

    if (isQuiz) {
      onComplete?.({
        ...resultPayload,
        userActions: { selectedIds: Array.from(selectedIds) },
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
          userActions: { selectedIds: Array.from(selectedIds) },
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setSelectedIds(new Set());
    setShowFeedback(false);
    setIsSubmitted(false);
    setIsCorrect(null);
    setResultData(null);
  };

  const gameMechanicsInstruction = allowMultiple 
    ? 'Select all correct options from the choices below'
    : 'Select the correct option from the choices below';

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md">
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
              <p className="leading-relaxed">
                {gameMechanicsInstruction}
              </p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          <div className="text-center flex-1 px-4">
            <p className="text-sm text-gray-700 truncate">
              {gameMechanicsInstruction}
            </p>
          </div>

          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • {allowMultiple ? 'Multiple Answers' : 'Single Answer'}
            </div>
          )}
        </div>
      </div>

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
              className="flex flex-col"
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

                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                  {String.fromCharCode(65 + index)}
                </div>

                {option.imageUrl && (
                  <img
                    src={option.imageUrl}
                    alt=""
                    className="flex-shrink-0 w-16 h-16 object-cover rounded-lg border"
                  />
                )}

                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {option.text}
                  </p>
                </div>

                {!isQuiz && showFeedback && (
                  <div className="flex-shrink-0 text-2xl">
                    {isCorrectAnswer && '✓'}
                    {wasWronglySelected && '✗'}
                  </div>
                )}
              </label>

              {!isQuiz && showFeedback && option.explanation && isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={clsx(
                    'mt-2 p-3 rounded-lg text-sm',
                    isCorrectAnswer
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  )}
                >
                  <span className="font-semibold">{isCorrectAnswer ? 'Correct: ' : 'Incorrect: '}</span>
                  <div
                    className="inline prose prose-xs"
                    dangerouslySetInnerHTML={{ __html: option.explanation }}
                  />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

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

      {mode === 'lesson' && resultData && resultData.userActions && (
        <ScenarioResultsWithFeedbackCard
          config={{
            options: config.options.map(opt => ({
              ...opt,
              feedback: opt.explanation
            })),
            allowMultipleCorrect: config.allowMultipleCorrect,
            generalFeedback: config.generalFeedback,
          }}
          userActions={resultData.userActions}
          metrics={{
            correctCount: resultData.correctCount,
            incorrectCount: resultData.incorrectCount,
            missedCount: resultData.missedCount,
            totalCorrect: resultData.totalCorrect,
            earnedXp: resultData.earnedXp,
            earnedPoints: resultData.earnedPoints,
            attempts: resultData.attempts,
          }}
          mode={mode}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  );
}