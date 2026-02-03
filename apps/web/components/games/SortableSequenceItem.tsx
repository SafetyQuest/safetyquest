// apps/web/components/games/SequenceGame.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import GameResultCard from './shared/GameResultCard';
import SequenceResultsWithFeedbackCard from './shared/SequenceResultsWithFeedbackCard';

type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
  explanation?: string;  // ✅ ADD THIS
  xp?: number;
  points?: number;
};

type SequenceConfig = {
  instruction: string;
  items: SequenceItem[];
  correctOrder: string[];
  generalFeedback?: string;  // ✅ ADD THIS
  totalXp?: number;
  totalPoints?: number;
};

type SequenceGameProps = {
  config: SequenceConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    correctCount: number;
    totalCount: number;
    correctPositions: boolean[];
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    timeSpent: number;
    userActions?: any;
  }) => void;
  previousState?: any | null;
};

// Fisher-Yates shuffle (in-place)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function SortableSequenceItem({
  item,
  position,
  isCorrect,
  isIncorrect,
  showFeedback,
  isPreview,
}: {
  item: SequenceItem;
  position: number;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showFeedback: boolean;
  isPreview: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isPreview || showFeedback });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all select-none',
        isDragging && 'opacity-70 scale-105 shadow-2xl z-50 bg-white',
        isPreview && 'cursor-default',
        !isPreview && !showFeedback && 'cursor-grab active:cursor-grabbing',
        showFeedback && 'cursor-default',
        // Feedback states
        showFeedback && isCorrect && 'border-green-500 bg-green-50 ring-2 ring-green-300',
        showFeedback && isIncorrect && 'border-red-500 bg-red-50 ring-2 ring-red-300',
        !showFeedback && !isPreview && 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-md',
        isPreview && 'border-blue-400 bg-blue-50'
      )}
      {...(isPreview || showFeedback ? {} : attributes)}
      {...(isPreview || showFeedback ? {} : listeners)}
    >
      {/* Position Badge */}
      <div
        className={clsx(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold',
          showFeedback && isCorrect && 'bg-green-500 text-white',
          showFeedback && isIncorrect && 'bg-red-500 text-white',
          !showFeedback && 'bg-blue-100 text-blue-700'
        )}
      >
        {position + 1}
      </div>

      {/* Image */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.content}
          className="flex-shrink-0 w-14 h-14 md:w-32 md:h-32 object-cover rounded-lg border"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}

      {/* Content */}
      <div className="flex-1">
        <p className="font-medium text-gray-800 text-sm">{item.content}</p>
      </div>

      {/* Feedback Icon */}
      {showFeedback && (
        <div className="flex-shrink-0">
          {isCorrect ? (
            <span className="text-2xl">✓</span>
          ) : (
            <span className="text-2xl">✗</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function SequenceGame({
  config,
  mode,
  onComplete,
  previousState, 
}: SequenceGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  // Shuffle items once on mount
  const shuffledItems = useMemo(() => shuffleArray(config.items), [config.items]);

  // User's current order (array of IDs)
  const [userOrder, setUserOrder] = useState<string[]>(() =>
    previousState?.userActions?.order ??
    shuffleArray([...config.items.map((item) => item.id)])
  );
  const [showFeedback, setShowFeedback] = useState(!!previousState);
  const [isSubmitted, setIsSubmitted] = useState(!!previousState);
  const [correctPositions, setCorrectPositions] = useState<boolean[]>(() => {
    // ✅ Calculate correctPositions from previousState
    if (previousState?.userActions?.order && Array.isArray(previousState.userActions.order)) {
      return previousState.userActions.order.map(
        (id: string, index: number) => id === config.correctOrder[index]
      );
    }
    return [];
  });
  const [attempts, setAttempts] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

  // ✅ Store result data
  const [resultData, setResultData] = useState<{
    success: boolean;
    correctCount: number;
    totalCount: number;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    userActions?: { order: string[] };  // ✅ ADD THIS
  } | null>(
    previousState ? {
      success: previousState.result?.success ?? false,
      correctCount: previousState.result?.correctCount ?? 0,
      totalCount: config.items.length,
      earnedXp: previousState.result?.earnedXp,
      earnedPoints: previousState.result?.earnedPoints,
      attempts: previousState.result?.attempts ?? 0,
      userActions: previousState.userActions,  // ✅ ADD THIS
    } : null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Get item by ID
  const getItemById = (id: string): SequenceItem | undefined =>
    config.items.find((i) => i.id === id);

  // Current ordered items (for rendering)
  const orderedItems = userOrder.map((id) => getItemById(id)!).filter(Boolean);

  const handleDragStart = (event: DragStartEvent) => {
    if (isPreview || isSubmitted) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPreview || isSubmitted) return;
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setActiveId(null);
      return;
    }

    setUserOrder((items) => {
      const oldIndex = items.indexOf(active.id as string);
      const newIndex = items.indexOf(over.id as string);
      return arrayMove(items, oldIndex, newIndex);
    });

    setActiveId(null);
  };

  const handleSubmit = () => {
    if (isPreview || isSubmitted) return;

    const positions = userOrder.map((id, index) => id === config.correctOrder[index]);
    const correctCount = positions.filter(Boolean).length;
    const allCorrect = correctCount === config.items.length;

    setAttempts((a) => a + 1);
    setCorrectPositions(positions);
    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalReward = isQuiz ? config.totalPoints : config.totalXp;
    
    // Calculate proportional reward
    const earnedReward = Math.round((correctCount / config.items.length) * (totalReward || 0));

    // ✅ Store result data with userActions
    const resultPayload = {
      success: allCorrect,
      correctCount,
      totalCount: config.items.length,
      earnedXp: isQuiz ? undefined : earnedReward,
      earnedPoints: isQuiz ? earnedReward : undefined,
      attempts: attempts + 1,
      userActions: { order: userOrder },  // ✅ ADD THIS
    };
    
    setResultData(resultPayload);

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        ...resultPayload,
        correctPositions: positions,
        timeSpent,
        userActions: { order: userOrder }, 
      });
    } else {
      // Lesson mode: show feedback
      if (allCorrect) {
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
          correctPositions: positions,
          timeSpent,
          userActions: { order: userOrder }, 
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setUserOrder(shuffleArray(config.items).map((i) => i.id));
    setShowFeedback(false);
    setIsSubmitted(false);
    setCorrectPositions([]);
    setResultData(null);  // ✅ Clear result data
  };

  const activeItem = activeId ? getItemById(activeId) : null;
  const correctCount = correctPositions.filter(Boolean).length;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Compact Header - Single Line */}
      <div className="mb-4">
        <div className="flex items-start justify-between px-4 py-3 bg-white rounded-lg shadow-md">
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
              <p className="leading-relaxed">Drag and drop the steps into the correct sequence. You can reorder them as many times as you like before submitting.</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Instruction Text - Always Visible */}
          <div className="text-center text-gray-700 font-medium flex-1 px-4">
            {config.instruction}
          </div>

          {/* Right: Progress & Results (stacked under info icon) */}
          <div className="flex flex-col items-end gap-1 min-w-[80px]">
            {!isQuiz && isSubmitted && showFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
              >
                <span className="text-xs font-bold text-green-600">
                  {correctCount} / {config.items.length}
                </span>
              </motion.div>
            )}

            {/* Preview Mode Info */}
            {mode === 'preview' && (
              <div className="text-xs text-gray-500 text-right">
                {config.items.length} steps to order
              </div>
            )}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={userOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {orderedItems.map((item, index) => {
              const isCorrect = showFeedback && correctPositions[index];
              const isIncorrect = showFeedback && !correctPositions[index];

              return (
                <SortableSequenceItem
                  key={item.id}
                  item={item}
                  position={index}
                  isCorrect={isCorrect}
                  isIncorrect={isIncorrect}
                  showFeedback={showFeedback}
                  isPreview={isPreview}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeItem && !isPreview && (
            <div className="bg-white border-4 border-blue-500 rounded-xl p-4 shadow-2xl flex items-center gap-4 w-full max-w-3xl">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold flex-shrink-0">
                ?
              </div>
              {activeItem.imageUrl && (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.content}
                  className="w-14 h-14 md:w-32 md:h-32 object-cover rounded-lg flex-shrink-0"
                />
              )}
              <p className="font-bold text-sm flex-1">{activeItem.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Submit Button - Bottom Right */}
      <div className="mt-6 flex justify-end">
        {mode !== 'preview' && !isSubmitted && (
          <motion.button
            onClick={handleSubmit}
            className="px-6 py-2 rounded-lg font-semibold text-white shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Submit
          </motion.button>
        )}
      </div>

      {/* ✅ LESSON MODE: Detailed Feedback Card */}
      {mode === 'lesson' && resultData && resultData.userActions && (
        <SequenceResultsWithFeedbackCard
          config={{
            items: config.items,
            correctOrder: config.correctOrder,
            generalFeedback: config.generalFeedback,
          }}
          userActions={resultData.userActions}
          metrics={{
            correctCount: resultData.correctCount,
            totalCount: resultData.totalCount,
            xpEarned: resultData.earnedXp,
            attempts: resultData.attempts,
          }}
          mode={mode}
          onTryAgain={handleTryAgain}
        />
      )}

      {/* ✅ QUIZ MODE: Silent submission - NO feedback card */}
    </div>
  );
}