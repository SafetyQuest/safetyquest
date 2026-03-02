// apps/web/components/games/MatchingGame.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCorners,
  pointerWithin,
  CollisionDetection,
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
import MatchingResultsWithFeedbackCard from './shared/MatchingResultsWithFeedbackCard';

type MatchingItem = {
  id: string;
  text: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
  explanation?: string;
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
  generalFeedback?: string;
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
    userActions?: any;
  }) => void;
  previousState?: any | null;
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

// Custom collision detection: pointer-exact first, geometry fallback second
const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

// Reusable Item Card (more compact version)
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
        'relative p-2 sm:p-3 rounded-lg sm:rounded-xl border-2 transition-all select-none',
        // Only apply touch-none to left items (draggable) when not in preview/feedback mode
        side === 'left' && !isPreview && !showFeedback && 'touch-none',
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
      <div className="flex flex-col sm:flex-row items-center gap-2">
        {/* Pair Badge - More compact on mobile */}
        {isPaired && !showFeedback && pairColor && (
          <div className={clsx(
            'flex-shrink-0 w-6 h-6 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm',
            pairColor.badge
          )}>
            {(pairIndex || 0) + 1}
          </div>
        )}

        {/* Image - UPDATED: increased to w-44 h-44 */}
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.text}
            className="flex-shrink-0 w-44 h-44 sm:w-44 sm:h-44 object-cover rounded-lg border-2 border-white shadow-sm transition-transform duration-200 hover:scale-105"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        ) : (
          <div className="flex-shrink-0 w-44 h-44 sm:w-44 sm:h-44 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-3xl sm:text-3xl">❓</span>
          </div>
        )}

        {/* Text - Centered on mobile, left-aligned on desktop */}
        <p className="flex-1 text-center sm:text-left text-xs sm:text-sm font-medium text-gray-800 line-clamp-2">
          {item.text}
        </p>

        {/* Feedback Icon */}
        {showFeedback && (
          <div className="flex-shrink-0">
            {isCorrect ? (
              <span className="text-lg sm:text-xl">✓</span>
            ) : (
              <span className="text-lg sm:text-xl">✗</span>
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
  previousState,
}: MatchingGameProps) {
  const [userPairs, setUserPairs] = useState<MatchingPair[]>(
    previousState?.userActions?.pairs ?? []
  );
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(!!previousState);
  const [isSubmitted, setIsSubmitted] = useState(!!previousState); 
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  
  const [resultData, setResultData] = useState<any>(
    previousState ? {
      success: previousState.result?.success ?? false,
      correctCount: previousState.result?.correctCount ?? 0,
      totalCount: config.pairs.length,
      earnedXp: previousState.result?.earnedXp,
      earnedPoints: previousState.result?.earnedPoints,
      attempts: previousState.result?.attempts ?? 0,
    } : null
  );
  
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 8 } 
    }),
    useSensor(TouchSensor, { 
      activationConstraint: { 
        delay: 300,  // Longer delay = easier to scroll without triggering drag
        tolerance: 5  // Reduced tolerance for more precise touch
      } 
    })
  );

  const getPairIndex = (leftId: string, rightId: string): number => {
    return userPairs.findIndex(p => (p.leftId === leftId && p.rightId === rightId));
  };

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

  const isUserPairCorrect = (userPair: MatchingPair): boolean => {
    return config.pairs.some(
      p => p.leftId === userPair.leftId && p.rightId === userPair.rightId
    );
  };

  const handleLeftClick = (leftId: string) => {
    if (isPreview || showFeedback) return;
    
    const existingPair = userPairs.find(p => p.leftId === leftId);
    if (existingPair) {
      setUserPairs(prev => prev.filter(p => p.leftId !== leftId));
      setSelectedLeftId(null);
      return;
    }
    
    if (selectedLeftId === leftId) {
      setSelectedLeftId(null);
    } else {
      setSelectedLeftId(leftId);
    }
  };

  const handleRightClick = (rightId: string) => {
    if (isPreview || showFeedback) return;
    
    const existingPair = userPairs.find(p => p.rightId === rightId);
    if (existingPair) {
      setUserPairs(prev => prev.filter(p => p.rightId !== rightId));
      return;
    }
    
    if (!selectedLeftId) return;

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
    
    const leftId = leftIdWithPrefix.replace('left_', '');
    const rightId = rightIdWithPrefix.replace('right_', '');
    
    if (!leftIdWithPrefix.startsWith('left_') || !rightIdWithPrefix.startsWith('right_')) {
      return;
    }

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
    
    const earnedReward = Math.round((correctCount / config.pairs.length) * (totalReward || 0));

    const resultPayload = {
      success: correctCount === config.pairs.length,
      correctCount,
      totalCount: config.pairs.length,
      earnedXp: isQuiz ? undefined : earnedReward,
      earnedPoints: isQuiz ? earnedReward : undefined,
      attempts: attempts + 1,
    };
    
    setResultData(resultPayload);

    if (isQuiz) {
      onComplete?.({
        ...resultPayload,
        timeSpent,
        userActions: { pairs: userPairs },
      });
    } else {
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
          ...resultPayload,
          timeSpent,
          userActions: { pairs: userPairs },
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setUserPairs([]);
    setShowFeedback(false);
    setIsSubmitted(false);
    setSelectedLeftId(null);
    setResultData(null);
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
      {/* Responsive Header */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Layout - Stacked */}
          <div className="md:hidden">
            {/* Top Row: Instruction Text */}
            <div className="px-4 py-3 text-center border-b border-gray-200">
              <p className="text-sm sm:text-base font-medium text-gray-700 leading-snug">
                {config.instruction}
              </p>
            </div>
            
            {/* Bottom Row: Info Icon + Progress */}
            <div className="px-4 py-2 flex items-center justify-between">
              {/* Left: Info Icon with Tooltip */}
              <div className="relative group">
                <motion.div
                  className="w-7 h-7 flex items-center justify-center cursor-help"
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
                  <span className="text-2xl font-bold text-blue-500">?</span>
                </motion.div>
                
                {/* Tooltip */}
                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="leading-relaxed">
                    <span className="sm:hidden">Tap a left item, then tap a right item to pair them. Tap again to unpair.</span>
                    <span className="hidden sm:inline">Drag items from the left column to match them with items on the right. You can also click to select a left item and then click a right item to pair them.</span>
                  </p>
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>

              {/* Right: Progress Counter */}
              <div className="flex items-center">
                {mode !== 'preview' && !isSubmitted && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Matched:</span>
                    <span className="font-bold text-base text-gray-800">
                      {userPairs.length} / {config.pairs.length}
                    </span>
                  </div>
                )}

                {mode === 'preview' && (
                  <div className="text-sm text-gray-500">
                    {config.pairs.length} pairs
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden md:flex items-center justify-between px-4 py-3">
            {/* Left: Info Icon with Tooltip */}
            <div className="relative group w-8 flex-shrink-0">
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
                <p className="leading-relaxed">Drag items from the left column to match them with items on the right. You can also click to select a left item and then click a right item to pair them.</p>
                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              </div>
            </div>

            {/* Center: Instruction Text */}
            <div className="text-center text-gray-700 font-medium flex-1 px-4">
              {config.instruction}
            </div>

            {/* Right: Progress Counter */}
            <div className="flex items-center justify-end min-w-[140px] flex-shrink-0">
              {mode !== 'preview' && !isSubmitted && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Matched:</span>
                  <span className="font-bold text-lg text-gray-800">
                    {userPairs.length} / {config.pairs.length}
                  </span>
                </div>
              )}

              {mode === 'preview' && (
                <div className="text-sm text-gray-500 text-right">
                  {config.pairs.length} pairs
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* UPDATED: custom collision — pointerWithin first, closestCorners fallback */}
      <DndContext 
        sensors={sensors} 
        collisionDetection={customCollisionDetection} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          {/* Left Column */}
          <div>
            <h3 className="text-xs sm:text-sm md:text-base font-bold mb-2 sm:mb-3 text-gray-700">Match From</h3>
            <div className="space-y-2 sm:space-y-3">
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
            <h3 className="text-xs sm:text-sm md:text-base font-bold mb-2 sm:mb-3 text-gray-700">Match To</h3>
            <div className="space-y-2 sm:space-y-3">
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
              <div className="bg-white border-4 border-blue-500 rounded-xl p-5 shadow-2xl max-w-xs">
                {draggedItem.imageUrl ? (
                  <img
                    src={draggedItem.imageUrl}
                    alt=""
                    className="w-44 h-44 object-cover rounded-xl mx-auto mb-3 shadow-lg"
                  />
                ) : (
                  <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-4xl">❓</span>
                  </div>
                )}
                <p className="text-center font-bold text-lg">
                  {draggedItem.text}
                </p>
              </div>
            ) : null;
          })()}
        </DragOverlay>
      </DndContext>

      {/* Submit Button - Bottom Right */}
      <div className="mt-6 flex justify-end">
        {mode !== 'preview' && !isSubmitted && (
          <motion.button
            onClick={handleSubmit}
            disabled={userPairs.length !== config.pairs.length}
            className={clsx(
              "px-6 py-2 rounded-lg font-semibold text-white shadow-lg transition-all",
              userPairs.length === config.pairs.length
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={userPairs.length === config.pairs.length ? { scale: 1.05 } : {}}
            whileTap={userPairs.length === config.pairs.length ? { scale: 0.95 } : {}}
          >
            Submit
          </motion.button>
        )}
      </div>

      {/* Results with Feedback */}
      {resultData && mode === 'lesson' && isSubmitted && showFeedback && (
        <MatchingResultsWithFeedbackCard
          success={resultData.success}
          metrics={{
            correctCount: resultData.correctCount,
            totalCount: resultData.totalCount,
            xpEarned: resultData.earnedXp,
            attempts: resultData.attempts,
          }}
          generalFeedback={config.generalFeedback}
          correctPairs={(() => {
            const pairs: any[] = [];
            userPairs.forEach((userPair) => {
              if (isUserPairCorrect(userPair)) {
                const leftItem = config.leftItems.find((i: any) => i.id === userPair.leftId);
                const rightItem = config.rightItems.find((i: any) => i.id === userPair.rightId);
                if (leftItem && rightItem) {
                  pairs.push({
                    leftText: leftItem.text,
                    rightText: rightItem.text,
                    explanation: leftItem.explanation
                  });
                }
              }
            });
            return pairs;
          })()}
          incorrectPairs={(() => {
            const pairs: any[] = [];
            userPairs.forEach((userPair) => {
              if (!isUserPairCorrect(userPair)) {
                const leftItem = config.leftItems.find((i: any) => i.id === userPair.leftId);
                const wrongRightItem = config.rightItems.find((i: any) => i.id === userPair.rightId);
                const correctPair = config.pairs.find((p: any) => p.leftId === userPair.leftId);
                const correctRightItem = correctPair 
                  ? config.rightItems.find((i: any) => i.id === correctPair.rightId) 
                  : null;
                
                if (leftItem && wrongRightItem) {
                  pairs.push({
                    leftText: leftItem.text,
                    rightText: wrongRightItem.text,
                    correctRightText: correctRightItem?.text,
                    explanation: leftItem.explanation
                  });
                }
              }
            });
            return pairs;
          })()}
          onTryAgain={handleTryAgain}
        />
      )}
    </div>
  );
}