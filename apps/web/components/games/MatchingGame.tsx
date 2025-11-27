// apps/web/components/games/MatchingGame.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import clsx from 'clsx';

type MatchingItem = {
  id: string;
  text: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type MatchingPair = {
  leftId: string;
  rightId: string;
};

type MatchingConfig = {
  instruction: string;
  leftItems: MatchingItem[];
  rightItems: MatchingItem[];
  pairs: MatchingPair[];
  totalXp?: number;
  totalPoints?: number;
};

type MatchingGameProps = {
  config: MatchingConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    correctCount: number;
    totalCount: number;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    timeSpent: number;
  }) => void;
};

// Reusable Item Card (used for both left and right)
function MatchingItemCard({
  item,
  side,
  isSelected,
  isPaired,
  pairedWith,
  isCorrect,
  showFeedback,
  isPreview,
  onClick,
  mode,
}: {
  item: MatchingItem;
  side: 'left' | 'right';
  isSelected?: boolean;
  isPaired?: boolean;
  pairedWith?: MatchingItem | null;
  isCorrect?: boolean;
  showFeedback: boolean;
  isPreview: boolean;
  onClick?: () => void;
  mode: 'preview' | 'lesson' | 'quiz';

}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: isPreview || side === 'right' });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'relative p-5 rounded-xl border-2 transition-all select-none',
        isDragging && 'opacity-50 scale-110 shadow-2xl z-50',
        isPreview && 'cursor-default',
        !isPreview && side === 'left' && 'cursor-grab active:cursor-grabbing',
        !isPreview && side === 'right' && 'cursor-pointer',
        // States
        isSelected && 'border-blue-500 bg-blue-50 ring-4 ring-blue-200',
        isPaired && !showFeedback && 'border-purple-500 bg-purple-50',
        showFeedback && isCorrect && 'border-green-500 bg-green-50 ring-4 ring-green-200',
        showFeedback && isCorrect === false && 'border-red-500 bg-red-50 ring-4 ring-red-200',
        !showFeedback && !isPaired && !isSelected && 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-lg',
        isPreview && 'border-blue-400 bg-blue-50'
      )}
      {...(isPreview || side === 'right' ? {} : attributes)}
      {...(isPreview || side === 'right' ? {} : listeners)}
      onClick={isPreview ? undefined : onClick}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.text}
          className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <p className="text-center font-medium text-gray-800">{item.text}</p>

      {(item.xp || item.points) && side === 'left' && !isPreview && (
        <p className="text-xs text-gray-500 text-center mt-2">
          +{item.xp || item.points} {mode === 'quiz' ? 'pts' : 'XP'}
        </p>
      )}

      {isPaired && pairedWith && !showFeedback && (
        <p className="text-xs text-purple-600 text-center mt-3">
          Paired with "{pairedWith.text}"
        </p>
      )}

      {showFeedback && (
        <div className="mt-3 flex justify-center">
          {isCorrect ? (
            <span className="text-3xl">Correct</span>
          ) : (
            <span className="text-3xl">Incorrect</span>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function MatchingGame({
  config,
  mode,
  onComplete,
}: MatchingGameProps) {
  const [userPairs, setUserPairs] = useState<MatchingPair[]>([]);
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Helper: Find user's pair for an item
  const getUserPairedItem = (itemId: string, side: 'left' | 'right'): MatchingItem | null => {
    const pair = userPairs.find(p =>
      side === 'left' ? p.leftId === itemId : p.rightId === itemId
    );
    if (!pair) return null;
    const targetId = side === 'left' ? pair.rightId : pair.leftId;
    const items = side === 'left' ? config.rightItems : config.leftItems;
    return items.find(i => i.id === targetId) || null;
  };

  // Helper: Is a user pair correct?
  const isUserPairCorrect = (userPair: MatchingPair): boolean => {
    return config.pairs.some(
      p => p.leftId === userPair.leftId && p.rightId === userPair.rightId
    );
  };

  const handleLeftClick = (leftId: string) => {
    if (isPreview || showFeedback) return;
    if (selectedLeftId === leftId) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(leftId);
    }
  };

  const handleRightClick = (rightId: string) => {
    if (isPreview || showFeedback || !selectedLeftId) return;

    const existing = userPairs.find(p => p.leftId === selectedLeftId && p.rightId === rightId);
    if (existing) {
      setUserPairs(prev => prev.filter(p => p !== existing));
      toast('Pair removed', { icon: 'Removed', duration: 1200 });
    } else {
      const leftPaired = userPairs.find(p => p.leftId === selectedLeftId);
      const rightPaired = userPairs.find(p => p.rightId === rightId);
      if (leftPaired || rightPaired) {
        toast.error('One or both items already paired!');
        return;
      }
      setUserPairs(prev => [...prev, { leftId: selectedLeftId, rightId }]);
      toast.success('Pair created!');
    }
    setSelectedLeftId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPreview) return;
    const { active, over } = event;
    if (!over) return;

    const leftId = active.id.toString();
    const rightId = over.id.toString();
    if (!leftId.startsWith('left_') || !rightId.startsWith('right_')) return;

    const existing = userPairs.find(p => p.leftId === leftId && p.rightId === rightId);
    if (existing) {
      setUserPairs(prev => prev.filter(p => p !== existing));
      toast('Pair removed', { icon: 'Removed', duration: 1200 });
    } else {
      const leftPaired = userPairs.find(p => p.leftId === leftId);
      const rightPaired = userPairs.find(p => p.rightId === rightId);
      if (leftPaired || rightPaired) {
        toast.error('Already paired!');
        return;
      }
      setUserPairs(prev => [...prev, { leftId, rightId }]);
      toast.success('Paired!');
    }
  };

  const checkAnswers = () => {
    if (isPreview) return;
    if (userPairs.length !== config.pairs.length) {
      toast.error(`Complete all ${config.pairs.length} pairs first!`);
      return;
    }

    let correct = 0;
    userPairs.forEach(pair => {
      if (isUserPairCorrect(pair)) correct++;
    });

    setAttempts(a => a + 1);
    setShowFeedback(true);

    if (correct === config.pairs.length) {
      confetti({ particleCount: 130, spread: 70, origin: { y: 0.6 } });
      toast.success('Perfect! All matches correct! Excellent', { duration: 4000, icon: 'Excellent' });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const reward = isQuiz ? config.totalPoints : config.totalXp;

      setTimeout(() => {
        onComplete?.({
          success: true,
          correctCount: correct,
          totalCount: config.pairs.length,
          earnedXp: isQuiz ? undefined : reward,
          earnedPoints: isQuiz ? reward : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 2200);
    } else {
      toast.error(`${correct}/${config.pairs.length} correct. Try again!`, { duration: 3000 });
    }
  };

  const reset = () => {
    setUserPairs([]);
    setShowFeedback(false);
    setSelectedLeftId(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-2xl"
      >
        <h2 className="text-2xl font-bold text-gray-800">{config.instruction}</h2>
        {isPreview && (
          <p className="mt-3 text-sm font-medium text-purple-700">
            Preview Mode • {config.pairs.length} pairs required
          </p>
        )}
      </motion.div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-gray-700 text-center">Match From</h3>
            <div className="space-y-5">
              {config.leftItems.map((item) => {
                const pairedWith = getUserPairedItem(item.id, 'left');
                const userPair = userPairs.find(p => p.leftId === item.id);
                const isCorrect = userPair ? isUserPairCorrect(userPair) : undefined;

                return (
                  <MatchingItemCard
                    key={item.id}
                    item={item}
                    side="left"
                    isSelected={selectedLeftId === item.id}
                    isPaired={!!pairedWith}
                    pairedWith={pairedWith}
                    isCorrect={showFeedback ? isCorrect : undefined}
                    showFeedback={showFeedback}
                    isPreview={isPreview}
                    onClick={() => handleLeftClick(item.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-gray-700 text-center">Match To</h3>
            <div className="space-y-5">
              {config.rightItems.map((item) => {
                const pairedWith = getUserPairedItem(item.id, 'right');
                const userPair = userPairs.find(p => p.rightId === item.id);
                const isCorrect = userPair ? isUserPairCorrect(userPair) : undefined;

                return (
                  <MatchingItemCard
                    key={item.id}
                    item={item}
                    side="right"
                    isPaired={!!pairedWith}
                    pairedWith={pairedWith}
                    isCorrect={showFeedback ? isCorrect : undefined}
                    showFeedback={showFeedback}
                    isPreview={isPreview}
                    onClick={() => handleRightClick(item.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {selectedLeftId && !isPreview && (
            <div className="bg-white border-4 border-purple-500 rounded-xl p-6 shadow-2xl">
              {config.leftItems.find(i => i.id === selectedLeftId)?.imageUrl && (
                <img
                  src={config.leftItems.find(i => i.id === selectedLeftId)?.imageUrl}
                  alt=""
                  className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                />
              )}
              <p className="text-center font-bold text-lg">
                {config.leftItems.find(i => i.id === selectedLeftId)?.text}
              </p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Progress & Buttons */}
      <div className="mt-12 text-center">
        <div className="mb-6">
          <span className="text-2xl font-bold text-gray-700">
            {userPairs.length} / {config.pairs.length} matched
          </span>
        </div>

        {!isPreview && (
          <div className="flex justify-center gap-4">
            <button
              onClick={checkAnswers}
              disabled={userPairs.length !== config.pairs.length}
              className={clsx(
                'px-12 py-4 rounded-xl font-bold text-lg transition-all',
                userPairs.length === config.pairs.length
                  ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              Check Answers
            </button>

            {showFeedback && (
              <button
                onClick={reset}
                className="px-10 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}