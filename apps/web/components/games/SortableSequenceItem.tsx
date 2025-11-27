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
import toast from 'react-hot-toast';
import clsx from 'clsx';

type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type SequenceConfig = {
  instruction: string;
  items: SequenceItem[];
  correctOrder: string[];
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
  }) => void;
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
  mode,
}: {
  item: SequenceItem;
  position: number;
  isCorrect?: boolean;
  isIncorrect?: boolean;
  showFeedback: boolean;
  isPreview: boolean;
  mode: 'preview' | 'lesson' | 'quiz';
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isPreview });

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
        'relative flex items-center gap-4 p-5 rounded-xl border-2 transition-all select-none',
        isDragging && 'opacity-70 scale-105 shadow-2xl z-50 bg-white',
        isPreview && 'cursor-default',
        !isPreview && 'cursor-grab active:cursor-grabbing',
        // Feedback states
        showFeedback && isCorrect && 'border-green-500 bg-green-50 ring-4 ring-green-200',
        showFeedback && isIncorrect && 'border-red-500 bg-red-50 ring-4 ring-red-200',
        !showFeedback && !isPreview && 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg',
        isPreview && 'border-blue-400 bg-blue-50'
      )}
      {...(isPreview ? {} : attributes)}
      {...(isPreview ? {} : listeners)}
    >
      {/* Position Badge */}
      <div
        className={clsx(
          'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold',
          showFeedback && isCorrect && 'bg-green-100 text-green-700',
          showFeedback && isIncorrect && 'bg-red-100 text-red-700',
          !showFeedback && 'bg-gray-100 text-gray-700'
        )}
      >
        {position + 1}
      </div>

      {/* Image */}
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.content}
          className="w-20 h-20 object-cover rounded-lg border"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}

      {/* Content */}
      <div className="flex-1">
        <p className="font-medium text-gray-800">{item.content}</p>
        {(item.xp || item.points) && !isPreview && (
          <p className="text-sm text-gray-500 mt-1">
            +{item.xp || item.points} {mode === 'quiz' ? 'pts' : 'XP'}
          </p>
        )}
      </div>

      {/* Feedback Icon */}
      {showFeedback && (
        <div className="flex-shrink-0">
          {isCorrect ? (
            <span className="text-4xl">Correct</span>
          ) : (
            <span className="text-4xl">Incorrect</span>
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
}: SequenceGameProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  // Shuffle items once on mount
  const shuffledItems = useMemo(() => shuffleArray(config.items), [config.items]);

  // User's current order (array of IDs)
  const [userOrder, setUserOrder] = useState<string[]>(
    shuffledItems.map((item) => item.id)
  );

  const [showFeedback, setShowFeedback] = useState(false);
  const [correctPositions, setCorrectPositions] = useState<boolean[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [startTime] = useState(Date.now());

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
    if (isPreview) return;
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPreview) return;
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

    // Clear feedback when user reorders
    if (showFeedback) {
      setShowFeedback(false);
      setCorrectPositions([]);
    }

    setActiveId(null);
  };

  const checkAnswer = () => {
    if (isPreview) return;

    const positions = userOrder.map((id, index) => id === config.correctOrder[index]);
    const correctCount = positions.filter(Boolean).length;
    const allCorrect = correctCount === config.items.length;

    setAttempts((a) => a + 1);
    setCorrectPositions(positions);
    setShowFeedback(true);

    if (allCorrect) {
      confetti({ particleCount: 140, spread: 80, origin: { y: 0.6 } });
      toast.success('Perfect! All steps in correct order! Excellent', {
        duration: 4000,
        icon: 'Excellent',
      });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const reward = isQuiz ? config.totalPoints : config.totalXp;

      setTimeout(() => {
        onComplete?.({
          success: true,
          correctCount,
          totalCount: config.items.length,
          correctPositions: positions,
          earnedXp: isQuiz ? undefined : reward,
          earnedPoints: isQuiz ? reward : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 2200);
    } else {
      toast.error(`${correctCount}/${config.items.length} in correct position. Try again!`, {
        duration: 3000,
      });
    }
  };

  const reset = () => {
    setUserOrder(shuffleArray(config.items).map((i) => i.id));
    setShowFeedback(false);
    setCorrectPositions([]);
  };

  const activeItem = activeId ? getItemById(activeId) : null;

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-2xl"
      >
        <h2 className="text-2xl font-bold text-gray-800">{config.instruction}</h2>
        {isPreview && (
          <p className="mt-3 text-sm font-medium text-teal-700">
            Preview Mode • {config.items.length} steps to order
          </p>
        )}
      </motion.div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={userOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-5">
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
            <div className="bg-white border-4 border-teal-500 rounded-xl p-6 shadow-2xl flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xl font-bold">
                ?
              </div>
              {activeItem.imageUrl && (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.content}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <p className="font-bold text-lg">{activeItem.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Buttons */}
      <div className="mt-12 text-center">
        <div className="mb-6">
          <span className="text-2xl font-bold text-gray-700">
            {correctPositions.filter(Boolean).length} / {config.items.length} correct
          </span>
        </div>

        {!isPreview && (
          <div className="flex justify-center gap-4">
            <button
              onClick={checkAnswer}
              className="px-12 py-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-lg shadow-lg transition-all"
            >
              Check Order
            </button>

            {showFeedback && (
              <button
                onClick={reset}
                className="px-10 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold"
              >
                Shuffle & Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}