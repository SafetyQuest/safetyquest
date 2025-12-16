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
  useDroppable,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
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

// Color schemes for different pairs
const PAIR_COLORS = [
  { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700', ring: 'ring-blue-200', badge: 'bg-blue-500' },
  { bg: 'bg-purple-100', border: 'border-purple-400', text: 'text-purple-700', ring: 'ring-purple-200', badge: 'bg-purple-500' },
  { bg: 'bg-pink-100', border: 'border-pink-400', text: 'text-pink-700', ring: 'ring-pink-200', badge: 'bg-pink-500' },
  { bg: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-700', ring: 'ring-orange-200', badge: 'bg-orange-500' },
  { bg: 'bg-teal-100', border: 'border-teal-400', text: 'text-teal-700', ring: 'ring-teal-200', badge: 'bg-teal-500' },
  { bg: 'bg-indigo-100', border: 'border-indigo-400', text: 'text-indigo-700', ring: 'ring-indigo-200', badge: 'bg-indigo-500' },
  { bg: 'bg-rose-100', border: 'border-rose-400', text: 'text-rose-700', ring: 'ring-rose-200', badge: 'bg-rose-500' },
  { bg: 'bg-cyan-100', border: 'border-cyan-400', text: 'text-cyan-700', ring: 'ring-cyan-200', badge: 'bg-cyan-500' },
];

// Reusable Item Card (compact version)
function MatchingItemCard({
  item,
  side,
  isSelected,
  isPaired,
  pairIndex,
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
  pairIndex?: number;
  isCorrect?: boolean;
  showFeedback: boolean;
  isPreview: boolean;
  onClick?: () => void;
  mode: 'preview' | 'lesson' | 'quiz';
}) {
  // Left items are draggable, right items are droppable
  const itemId = `${side}_${item.id}`;
  
  const {
    attributes: sortableAttributes,
    listeners: sortableListeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: itemId, 
    disabled: isPreview || side === 'right' || showFeedback 
  });

  const {
    setNodeRef: setDroppableRef,
    isOver,
  } = useDroppable({
    id: itemId,
    disabled: isPreview || side === 'left' || showFeedback,
  });

  // Use appropriate ref and props based on side
  const setNodeRef = side === 'left' ? setSortableRef : setDroppableRef;
  const attributes = side === 'left' ? sortableAttributes : {};
  const listeners = side === 'left' ? sortableListeners : {};

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const pairColor = pairIndex !== undefined ? PAIR_COLORS[pairIndex % PAIR_COLORS.length] : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'relative p-3 rounded-lg border-2 transition-all select-none',
        isDragging && 'opacity-50 scale-110 shadow-2xl z-50',
        isOver && side === 'right' && 'scale-105 ring-4 ring-blue-400',
        isPreview && 'cursor-default',
        !isPreview && !showFeedback && side === 'left' && 'cursor-grab active:cursor-grabbing',
        !isPreview && !showFeedback && side === 'right' && 'cursor-pointer',
        showFeedback && 'cursor-default',
        // States
        isSelected && !isPaired && 'border-blue-500 bg-blue-50 ring-2 ring-blue-300',
        isPaired && !showFeedback && pairColor && `${pairColor.border} ${pairColor.bg} ring-2 ${pairColor.ring}`,
        showFeedback && isCorrect && 'border-green-500 bg-green-50 ring-2 ring-green-300',
        showFeedback && isCorrect === false && 'border-red-500 bg-red-50 ring-2 ring-red-300',
        !showFeedback && !isPaired && !isSelected && !isOver && 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-md',
        isPreview && 'border-blue-400 bg-blue-50'
      )}
      {...(isPreview || showFeedback ? {} : attributes)}
      {...(isPreview || showFeedback ? {} : listeners)}
      onClick={isPreview || showFeedback ? undefined : onClick}
    >
      <div className="flex items-center gap-3">
        {/* Pair Badge */}
        {isPaired && !showFeedback && pairColor && (
          <div className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
            pairColor.badge
          )}>
            {(pairIndex || 0) + 1}
          </div>
        )}

        {/* Image (if exists) */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.text}
            className="flex-shrink-0 w-12 h-12 object-cover rounded-md"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        )}

        {/* Text */}
        <p className="flex-1 text-sm font-medium text-gray-800">{item.text}</p>

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
      </div>
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
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  // Helper: Get pair index for coloring
  const getPairIndex = (leftId: string, rightId: string): number => {
    return userPairs.findIndex(p => (p.leftId === leftId && p.rightId === rightId));
  };

  // Helper: Find user's pair for an item
  const getUserPairedItem = (itemId: string, side: 'left' | 'right'): { item: MatchingItem | null, pairIndex: number } => {
    const pairIndex = userPairs.findIndex(p =>
      side === 'left' ? p.leftId === itemId : p.rightId === itemId
    );
    
    if (pairIndex === -1) return { item: null, pairIndex: -1 };
    
    const pair = userPairs[pairIndex];
    const targetId = side === 'left' ? pair.rightId : pair.leftId;
    const items = side === 'left' ? config.rightItems : config.leftItems;
    const item = items.find(i => i.id === targetId) || null;
    
    return { item, pairIndex };
  };

  // Helper: Is a user pair correct?
  const isUserPairCorrect = (userPair: MatchingPair): boolean => {
    return config.pairs.some(
      p => p.leftId === userPair.leftId && p.rightId === userPair.rightId
    );
  };

  const handleLeftClick = (leftId: string) => {
    if (isPreview || showFeedback) return;
    
    // If clicking already paired item, unpair it
    const existingPair = userPairs.find(p => p.leftId === leftId);
    if (existingPair) {
      setUserPairs(prev => prev.filter(p => p.leftId !== leftId));
      setSelectedLeftId(null);
      return;
    }
    
    // Toggle selection
    if (selectedLeftId === leftId) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(leftId);
    }
  };

  const handleRightClick = (rightId: string) => {
    if (isPreview || showFeedback) return;
    
    // If clicking already paired item, unpair it
    const existingPair = userPairs.find(p => p.rightId === rightId);
    if (existingPair) {
      setUserPairs(prev => prev.filter(p => p.rightId !== rightId));
      return;
    }
    
    // Need a selected left item
    if (!selectedLeftId) return;

    // Create new pair
    setUserPairs(prev => [...prev, { leftId: selectedLeftId, rightId }]);
    setSelectedLeftId(null);
  };

  const handleDragStart = (event: DragStartEvent) => {
    if (isPreview || showFeedback) return;
    const activeId = event.active.id.toString();
    setActiveDragId(activeId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (isPreview || showFeedback) return;
    const { active, over } = event;
    setActiveDragId(null);
    
    if (!over) return;

    const leftIdWithPrefix = active.id.toString();
    const rightIdWithPrefix = over.id.toString();
    
    // Strip prefixes to get actual item IDs
    const leftId = leftIdWithPrefix.replace('left_', '');
    const rightId = rightIdWithPrefix.replace('right_', '');
    
    // Validate that we're dragging from left to right
    if (!leftIdWithPrefix.startsWith('left_') || !rightIdWithPrefix.startsWith('right_')) {
      return;
    }

    // Remove existing pairs involving these items and add new pair in one operation
    setUserPairs(prev => {
      const filtered = prev.filter(p => p.leftId !== leftId && p.rightId !== rightId);
      return [...filtered, { leftId, rightId }];
    });
    setSelectedLeftId(null);
  };

  const handleSubmit = () => {
    if (isPreview || isSubmitted) return;
    if (userPairs.length !== config.pairs.length) return;

    let correctCount = 0;
    userPairs.forEach(pair => {
      if (isUserPairCorrect(pair)) correctCount++;
    });

    setAttempts(a => a + 1);
    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalReward = isQuiz ? config.totalPoints : config.totalXp;
    
    // Calculate proportional reward
    const earnedReward = Math.round((correctCount / config.pairs.length) * (totalReward || 0));

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        success: correctCount === config.pairs.length,
        correctCount,
        totalCount: config.pairs.length,
        earnedPoints: earnedReward,
        attempts: attempts + 1,
        timeSpent,
      });
    } else {
      // Lesson mode: show feedback
      if (correctCount === config.pairs.length) {
        confetti({ 
          particleCount: 100, 
          spread: 70, 
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#86efac'],
        });
      }

      setTimeout(() => {
        onComplete?.({
          success: correctCount === config.pairs.length,
          correctCount,
          totalCount: config.pairs.length,
          earnedXp: earnedReward,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setUserPairs([]);
    setShowFeedback(false);
    setIsSubmitted(false);
    setSelectedLeftId(null);
  };

  const correctCount = useMemo(() => {
    if (!showFeedback) return 0;
    let count = 0;
    userPairs.forEach(pair => {
      if (isUserPairCorrect(pair)) count++;
    });
    return count;
  }, [showFeedback, userPairs]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.instruction}
        </h3>

        {isPreview && (
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • {config.pairs.length} pairs required
          </p>
        )}

        {/* Progress Counter (not submitted yet) */}
        {mode !== 'preview' && !isSubmitted && (
          <div className="max-w-md mx-auto mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Pairs Matched</span>
              <span className="font-semibold text-gray-800">
                {userPairs.length} / {config.pairs.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${(userPairs.length / config.pairs.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Click items from left column, then click matching items from right column
            </p>
          </div>
        )}

        {/* Results Display (Lesson mode only) */}
        {!isQuiz && isSubmitted && showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
          >
            <p className="text-2xl font-bold text-green-600">
              {correctCount} / {config.pairs.length} Correct!
            </p>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              +{Math.round((correctCount / config.pairs.length) * (config.totalXp || 0))} XP
            </p>
          </motion.div>
        )}
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-700">Match From</h3>
            <div className="space-y-3">
              {config.leftItems.map((item) => {
                const { item: pairedWith, pairIndex } = getUserPairedItem(item.id, 'left');
                const userPair = userPairs.find(p => p.leftId === item.id);
                const isCorrect = userPair ? isUserPairCorrect(userPair) : undefined;

                return (
                  <MatchingItemCard
                    key={item.id}
                    item={item}
                    side="left"
                    isSelected={selectedLeftId === item.id}
                    isPaired={!!pairedWith}
                    pairIndex={pairIndex >= 0 ? pairIndex : undefined}
                    isCorrect={showFeedback ? isCorrect : undefined}
                    showFeedback={showFeedback}
                    isPreview={isPreview}
                    onClick={() => handleLeftClick(item.id)}
                    mode={mode}
                  />
                );
              })}
            </div>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-gray-700">Match To</h3>
            <div className="space-y-3">
              {config.rightItems.map((item) => {
                const { item: pairedWith, pairIndex } = getUserPairedItem(item.id, 'right');
                const userPair = userPairs.find(p => p.rightId === item.id);
                const isCorrect = userPair ? isUserPairCorrect(userPair) : undefined;

                return (
                  <MatchingItemCard
                    key={item.id}
                    item={item}
                    side="right"
                    isPaired={!!pairedWith}
                    pairIndex={pairIndex >= 0 ? pairIndex : undefined}
                    isCorrect={showFeedback ? isCorrect : undefined}
                    showFeedback={showFeedback}
                    isPreview={isPreview}
                    onClick={() => handleRightClick(item.id)}
                    mode={mode}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeDragId && !isPreview && (() => {
            const itemId = activeDragId.replace('left_', '');
            const draggedItem = config.leftItems.find(i => i.id === itemId);
            return draggedItem ? (
              <div className="bg-white border-4 border-blue-500 rounded-lg p-4 shadow-2xl max-w-xs">
                {draggedItem.imageUrl && (
                  <img
                    src={draggedItem.imageUrl}
                    alt=""
                    className="w-16 h-16 object-cover rounded-md mx-auto mb-2"
                  />
                )}
                <p className="text-center font-bold text-sm">
                  {draggedItem.text}
                </p>
              </div>
            ) : null;
          })()}
        </DragOverlay>
      </DndContext>

      {/* Submit Button */}
      {mode !== 'preview' && !isSubmitted && (
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleSubmit}
            disabled={userPairs.length !== config.pairs.length}
            className={clsx(
              "px-8 py-3 rounded-lg font-semibold text-white text-lg shadow-lg transition-all",
              userPairs.length === config.pairs.length
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={userPairs.length === config.pairs.length ? { scale: 1.05 } : {}}
            whileTap={userPairs.length === config.pairs.length ? { scale: 0.95 } : {}}
          >
            Submit Answers ({userPairs.length} paired)
          </motion.button>
          
          {userPairs.length < config.pairs.length && (
            <p className="mt-2 text-sm text-gray-500">
              Match all {config.pairs.length} pairs before submitting
            </p>
          )}
        </div>
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