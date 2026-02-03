// apps/web/components/games/TimeAttackSortingGame.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  rectIntersection,
  KeyboardSensor,
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
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import TimeAttackSortingResultsCard from './shared/TimeAttackSortingResultsCard';
import { calculateTimerPhase, TimerState } from './utils/timerUtils';

export type TimeAttackSortingItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
  explanation?: string;  // ✅ Per-item explanation
  xp?: number;
  points?: number;
};

export type TimeAttackSortingTarget = {
  id: string;
  label: string;
};

export type TimeAttackSortingConfig = {
  instruction: string;
  items: TimeAttackSortingItem[];
  targets: TimeAttackSortingTarget[];
  timeLimitSeconds: number;
  generalFeedback?: string;  // ✅ General feedback
  totalXp?: number;
  totalPoints?: number;
};

type Props = {
  config: TimeAttackSortingConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    correctCount: number;
    totalCount: number;
    earnedXp?: number;
    earnedPoints?: number;
    timeSpent: number;
    userActions?: any;
  }) => void;
  previousState?: any | null;
  onTimerUpdate?: (state: TimerState | null) => void;  // ⏱️ ADD THIS
};

// Draggable Item Card (in the top horizontal scroll area)
function DraggableItemCard({
  item,
  isPreview,
}: {
  item: TimeAttackSortingItem;
  isPreview: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={clsx(
        'relative border-2 rounded-xl p-4 cursor-move transition-all select-none min-w-[140px] flex-shrink-0',
        isDragging && 'opacity-50 scale-110 shadow-2xl z-50',
        !isPreview && 'border-orange-300 bg-white hover:border-orange-500 hover:shadow-lg',
        isPreview && 'border-orange-500 bg-orange-50 cursor-default'
      )}
      {...(isPreview ? {} : attributes)}
      {...(isPreview ? {} : listeners)}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.content}
          className="w-14 h-14 md:w-32 md:h-32 object-cover rounded-lg mx-auto mb-2"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <p className="text-center text-sm font-medium text-gray-800">{item.content}</p>
    </motion.div>
  );
}

// Compact Item Chip (inside zones)
function ItemChip({
  item,
  onRemove,
  isCorrect,
  showFeedback,
  isPreview,
  isAnyItemDragging,
}: {
  item: TimeAttackSortingItem;
  onRemove: () => void;
  isCorrect?: boolean;
  showFeedback: boolean;
  isPreview: boolean;
  isAnyItemDragging: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id: `placed_${item.id}`,
    disabled: isPreview || showFeedback || isAnyItemDragging,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    pointerEvents: isAnyItemDragging ? ('none' as const) : ('auto' as const),
  } : {
    pointerEvents: isAnyItemDragging ? ('none' as const) : ('auto' as const),
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className={clsx(
        'relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        isDragging && 'opacity-50 scale-110 shadow-lg z-50',
        showFeedback && isCorrect === true && 'bg-green-100 border-2 border-green-500 text-green-700',
        showFeedback && isCorrect === false && 'bg-red-100 border-2 border-red-500 text-red-700',
        !showFeedback && !isPreview && 'bg-orange-50 border-2 border-orange-300 text-orange-700 cursor-move hover:bg-orange-100',
        isPreview && 'bg-orange-100 border-2 border-orange-400 text-orange-800 cursor-default'
      )}
      {...(isPreview || showFeedback || isAnyItemDragging ? {} : attributes)}
      {...(isPreview || showFeedback || isAnyItemDragging ? {} : listeners)}
    >
      <span>{item.content}</span>
      
      {!isPreview && !showFeedback && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-orange-200 rounded-full p-0.5 transition-colors"
          title="Remove from category"
        >
          <X size={14} />
        </button>
      )}
      
      {showFeedback && (
        <span className="text-lg">
          {isCorrect ? '✓' : '✗'}
        </span>
      )}
    </motion.div>
  );
}

// Droppable Category (Horizontal Scroll)
function DroppableCategory({
  target,
  itemsInTarget,
  isPreview,
  onRemoveItem,
  showFeedback,
  isAnyItemDragging,
}: {
  target: TimeAttackSortingTarget;
  itemsInTarget: TimeAttackSortingItem[];
  isPreview: boolean;
  onRemoveItem: (itemId: string) => void;
  showFeedback: boolean;
  isAnyItemDragging: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `target_${target.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex-shrink-0 min-w-[220px] max-w-[280px] min-h-[160px] rounded-xl border-3 border-dashed p-3 transition-all',
        isOver && !isPreview && 'border-orange-500 bg-orange-100 scale-[1.02] shadow-lg',
        !isOver && !isPreview && 'border-orange-300 bg-orange-50/50 hover:border-orange-400',
        isPreview && 'border-orange-400 bg-orange-50 cursor-default'
      )}
    >
      <h3 className="font-bold text-sm text-orange-800 mb-2 text-center border-b-2 border-orange-200 pb-2">
        {target.label}
      </h3>

      {itemsInTarget.length > 0 ? (
        <div 
          className="flex flex-col gap-2"
          style={{ pointerEvents: isAnyItemDragging ? 'none' : 'auto' }}
        >
          {itemsInTarget.map((item) => {
            const isCorrect = item.correctTargetId === target.id;
            return (
              <ItemChip
                key={item.id}
                item={item}
                onRemove={() => onRemoveItem(item.id)}
                isCorrect={showFeedback ? isCorrect : undefined}
                showFeedback={showFeedback}
                isPreview={isPreview}
                isAnyItemDragging={isAnyItemDragging}
              />
            );
          })}
        </div>
      ) : (
        <p className="text-orange-400 text-xs text-center py-4">Drop cards here</p>
      )}
    </div>
  );
}

export default function TimeAttackSortingGame({
  config,
  mode,
  onComplete,
  previousState,
  onTimerUpdate,
}: Props) {
  // ✅ Initialize from previousState if available
  const [userPlacements, setUserPlacements] = useState<Map<string, string>>(() => {
    if (previousState?.userActions?.placements) {
      return new Map(Object.entries(previousState.userActions.placements));
    }
    return new Map();
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(!!previousState);
  const [isSubmitted, setIsSubmitted] = useState(!!previousState);
  const [timeRemaining, setTimeRemaining] = useState(config.timeLimitSeconds);
  const [startTime, setStartTime] = useState(Date.now());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // ✅ Store result data with detailed metrics
  const [resultData, setResultData] = useState<{
    success: boolean;
    correctCount: number;
    incorrectCount: number;
    missedCount: number;
    totalCount: number;
    earnedXp?: number;
    earnedPoints?: number;
    timeSpent: number;
    userActions?: { placements: Record<string, string> };
  } | null>(
    previousState ? {
      success: previousState.result?.success ?? false,
      correctCount: previousState.result?.correctCount ?? 0,
      incorrectCount: previousState.result?.incorrectCount ?? 0,
      missedCount: previousState.result?.missedCount ?? 0,
      totalCount: config.items.length,
      earnedXp: previousState.result?.earnedXp,
      earnedPoints: previousState.result?.earnedPoints,
      timeSpent: previousState.result?.timeSpent ?? 0,
      userActions: previousState.userActions,
    } : null
  );
  
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const itemsInTargets = useMemo(() => {
    const map = new Map<string, TimeAttackSortingItem[]>();
    config.targets.forEach((t) => map.set(t.id, []));
    config.items.forEach((item) => {
      const targetId = userPlacements.get(item.id);
      if (targetId) map.get(targetId)!.push(item);
    });
    return map;
  }, [userPlacements, config.items, config.targets]);

  const unplacedItems = config.items.filter((i) => !userPlacements.has(i.id));

  // Timer
  useEffect(() => {
    if (isPreview || isSubmitted) return;

    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, config.timeLimitSeconds - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleTimeout();
      }
    }, 100);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPreview, isSubmitted, config.timeLimitSeconds, startTime]);

  // ⏱️ Notify parent of timer state
  useEffect(() => {
    if (isPreview || isSubmitted) {
      onTimerUpdate?.(null);
      return;
    }
    
    const timerPhase = calculateTimerPhase(timeRemaining);
    onTimerUpdate?.({
      timeRemaining,
      timeLimit: config.timeLimitSeconds,
      timerPhase,
    });
    
    return () => {
      onTimerUpdate?.(null);
    };
  }, [timeRemaining, isPreview, isSubmitted, config.timeLimitSeconds, onTimerUpdate]);

  // Custom collision detection
  const customCollisionDetection = (args: any) => {
    const rectIntersectionCollisions = rectIntersection(args);
    const targetCollisions = rectIntersectionCollisions.filter((collision: any) =>
      String(collision.id).startsWith('target_')
    );
    
    if (targetCollisions.length > 0) {
      return targetCollisions;
    }
    
    return rectIntersectionCollisions;
  };

  const handleDragStart = (e: DragStartEvent) => {
    if (isPreview || isSubmitted) return;
    setActiveId(e.active.id as string);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (isPreview || isSubmitted) return;
    const { active, over } = e;
    
    if (over && String(over.id).startsWith('target_')) {
      const targetId = over.id.toString().replace('target_', '');
      const itemId = active.id.toString().replace('placed_', '');
      
      setUserPlacements((prev) => {
        const next = new Map(prev);
        next.set(itemId, targetId);
        return next;
      });
    }
    setActiveId(null);
  };

  const handleRemoveFromZone = (itemId: string) => {
    if (isPreview || isSubmitted) return;
    setUserPlacements((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleTimeout = () => {
    if (isSubmitted) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // ✅ Calculate detailed metrics
    let correctCount = 0;
    let incorrectCount = 0;
    config.items.forEach((item) => {
      const placement = userPlacements.get(item.id);
      if (placement === item.correctTargetId) {
        correctCount++;
      } else if (placement) {
        incorrectCount++;
      }
    });
    const missedCount = config.items.length - correctCount - incorrectCount;

    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = config.timeLimitSeconds;
    const totalReward = isQuiz ? config.totalPoints : config.totalXp;
    const earnedReward = Math.round((correctCount / config.items.length) * (totalReward || 0));
    const placements = Object.fromEntries(userPlacements);

    // ✅ Store result data with detailed metrics
    const resultPayload = {
      success: false,
      correctCount,
      incorrectCount,
      missedCount,
      totalCount: config.items.length,
      earnedXp: isQuiz ? undefined : earnedReward,
      earnedPoints: isQuiz ? earnedReward : undefined,
      timeSpent,
      userActions: { placements },
    };
    
    setResultData(resultPayload);

    onComplete?.({
      ...resultPayload,
      userActions: { placements },
    });
  };

  const handleSubmit = () => {
    if (isPreview || isSubmitted) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // ✅ Calculate detailed metrics
    let correctCount = 0;
    let incorrectCount = 0;
    config.items.forEach((item) => {
      const placement = userPlacements.get(item.id);
      if (placement === item.correctTargetId) {
        correctCount++;
      } else if (placement) {
        incorrectCount++;
      }
    });
    const missedCount = config.items.length - correctCount - incorrectCount;

    const allCorrect = correctCount === config.items.length;
    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalReward = isQuiz ? config.totalPoints : config.totalXp;
    const earnedReward = Math.round((correctCount / config.items.length) * (totalReward || 0));
    const placements = Object.fromEntries(userPlacements);

    // ✅ Store result data with detailed metrics
    const resultPayload = {
      success: allCorrect,
      correctCount,
      incorrectCount,
      missedCount,
      totalCount: config.items.length,
      earnedXp: isQuiz ? undefined : earnedReward,
      earnedPoints: isQuiz ? earnedReward : undefined,
      timeSpent,
      userActions: { placements },
    };
    
    setResultData(resultPayload);

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        ...resultPayload,
        userActions: { placements },
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
          userActions: { placements },
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setUserPlacements(new Map());
    setShowFeedback(false);
    setIsSubmitted(false);
    setTimeRemaining(config.timeLimitSeconds);
    setStartTime(Date.now());
    setResultData(null);
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const activeItem = activeId 
    ? config.items.find((i) => i.id === activeId || i.id === activeId.toString().replace('placed_', '')) 
    : null;

  // Instruction for game mechanics
  const gameMechanicsInstruction = "Organize all cards into the correct categories before time runs out";

  return (
    <div className="w-full max-w-6xl mx-auto relative">

      {/* Compact Header - Single Line */}
      <div className="mb-4">
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md">
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
              <span className="text-3xl font-bold text-orange-500">?</span>
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">{gameMechanicsInstruction}</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: DB Instruction Text - Always Visible */}
          <div className="text-center flex-1 px-4">
            <p className="text-sm text-gray-700 truncate">
              {config.instruction}
            </p>
          </div>

          {/* Preview Mode Info */}
          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • {config.items.length} cards • {config.targets.length} categories • {config.timeLimitSeconds}s
            </div>
          )}
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={customCollisionDetection} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
      >
        {/* Cards to Sort - Horizontal Scroll (TOP) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-gray-700 flex items-center gap-2">
              <span className="text-orange-500">🎴</span> Cards to Sort
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft size={18} className="text-orange-600" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight size={18} className="text-orange-600" />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100"
            style={{ scrollbarWidth: 'thin' }}
          >
            {unplacedItems.length > 0 ? (
              unplacedItems.map((item) => (
                <DraggableItemCard
                  key={item.id}
                  item={item}
                  isPreview={isPreview}
                />
              ))
            ) : (
              <div className="w-full text-center py-8 bg-green-50 border-2 border-green-300 rounded-xl">
                <span className="text-4xl">✅</span>
                <p className="text-green-700 font-semibold mt-2">All cards sorted!</p>
              </div>
            )}
          </div>
        </div>

        {/* Categories - Horizontal Scroll (BOTTOM) */}
        <div>
          <h3 className="text-base font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span className="text-orange-500">📦</span> Categories
          </h3>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100">
            {config.targets.map((target) => (
              <DroppableCategory
                key={target.id}
                target={target}
                itemsInTarget={itemsInTargets.get(target.id) || []}
                isPreview={isPreview}
                onRemoveItem={handleRemoveFromZone}
                showFeedback={showFeedback}
                isAnyItemDragging={!!activeId}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeItem && !isPreview && (
            <div className="bg-white border-4 border-orange-500 rounded-xl p-4 shadow-2xl min-w-[140px]">
              {activeItem.imageUrl && (
                <img 
                  src={activeItem.imageUrl} 
                  alt={activeItem.content} 
                  className="w-14 h-14 md:w-32 md:h-32 object-cover rounded-lg mx-auto mb-2" 
                />
              )}
              <p className="text-center font-bold text-sm">{activeItem.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Submit Button - Bottom Right */}
      <div className="mt-6 flex justify-end">
        {mode !== 'preview' && !isSubmitted && (
          <motion.button
            onClick={handleSubmit}
            disabled={userPlacements.size !== config.items.length}
            className={clsx(
              "px-6 py-2 rounded-lg font-semibold text-white shadow-lg transition-all",
              userPlacements.size === config.items.length
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={userPlacements.size === config.items.length ? { scale: 1.05 } : {}}
            whileTap={userPlacements.size === config.items.length ? { scale: 0.95 } : {}}
          >
            Finish
          </motion.button>
        )}
      </div>

      {/* ✅ Feedback Card (Lesson Mode) */}
      {mode === 'lesson' && resultData && (
        <TimeAttackSortingResultsCard
          config={{
            items: config.items,
            targets: config.targets,
            generalFeedback: config.generalFeedback,
            timeLimitSeconds: config.timeLimitSeconds,
          }}
          userActions={resultData.userActions}
          metrics={{
            correctCount: resultData.correctCount,
            incorrectCount: resultData.incorrectCount,
            missedCount: resultData.missedCount,
            totalCount: resultData.totalCount,
            earnedXp: resultData.earnedXp,
            earnedPoints: resultData.earnedPoints,
            timeSpent: resultData.timeSpent,
          }}
          mode={mode}
          onTryAgain={handleTryAgain}
        />
      )}

      {/* ✅ QUIZ MODE: Silent submission - NO feedback */}
    </div>
  );
}