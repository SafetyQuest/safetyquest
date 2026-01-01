// apps/web/components/games/DragDropGame.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  UniqueIdentifier,
  useDroppable,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

type DragDropItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
  xp?: number;
  points?: number;
};

type DragDropTarget = {
  id: string;
  label: string;
};

type DragDropGameConfig = {
  instruction: string;
  items: DragDropItem[];
  targets: DragDropTarget[];
  totalXp?: number;
  totalPoints?: number;
};

type DragDropGameProps = {
  config: DragDropGameConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    correctCount: number;
    totalCount: number;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
    timeSpent: number;
    userActions?: any;  // ✅ NEW
  }) => void;
  previousState?: any | null;  // ✅ NEW
};

// Draggable Item Card (in the top horizontal scroll area)
function DraggableItemCard({
  item,
  isPreview,
}: {
  item: DragDropItem;
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
        !isPreview && 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg',
        isPreview && 'border-blue-500 bg-blue-50 cursor-default'
      )}
      {...(isPreview ? {} : attributes)}
      {...(isPreview ? {} : listeners)}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.content}
          className="w-16 h-16 object-cover rounded-lg mx-auto mb-2"
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
  item: DragDropItem;
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
    disabled: isPreview || showFeedback || isAnyItemDragging, // Disable when ANY item is dragging
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
        'relative flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all w-full',
        isDragging && 'opacity-50 scale-110 shadow-lg z-50',
        showFeedback && isCorrect === true && 'bg-green-100 border-2 border-green-500 text-green-700',
        showFeedback && isCorrect === false && 'bg-red-100 border-2 border-red-500 text-red-700',
        !showFeedback && !isPreview && 'bg-blue-50 border-2 border-blue-300 text-blue-700 cursor-move hover:bg-blue-100',
        isPreview && 'bg-blue-100 border-2 border-blue-400 text-blue-800 cursor-default'
      )}
      {...(isPreview || showFeedback || isAnyItemDragging ? {} : attributes)}
      {...(isPreview || showFeedback || isAnyItemDragging ? {} : listeners)}
    >
      <span className="flex-1">{item.content}</span>
      
      <div className="flex items-center gap-1">
        {showFeedback && (
          <span className="text-lg">
            {isCorrect ? '✓' : '✗'}
          </span>
        )}
        
        {!isPreview && !showFeedback && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
            title="Remove from zone"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Droppable Target Zone
function DroppableZone({
  target,
  itemsInTarget,
  isPreview,
  onRemoveItem,
  showFeedback,
  config,
  isAnyItemDragging,
}: {
  target: DragDropTarget;
  itemsInTarget: DragDropItem[];
  isPreview: boolean;
  onRemoveItem: (itemId: string) => void;
  showFeedback: boolean;
  config: DragDropGameConfig;
  isAnyItemDragging: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `target_${target.id}`,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'flex-shrink-0 min-w-[220px] max-w-[280px] min-h-[200px] rounded-xl border-3 border-dashed p-4 transition-all',
        isOver && !isPreview && 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg',
        !isOver && !isPreview && 'border-gray-300 bg-gray-50',
        isPreview && 'border-blue-400 bg-blue-50/50 cursor-default'
      )}
    >
      <h3 className="font-bold text-base text-gray-800 mb-3 text-center">{target.label}</h3>

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
        <p className="text-gray-400 text-sm text-center py-8">Drop items here</p>
      )}
    </div>
  );
}

export default function DragDropGame({
  config,
  mode,
  onComplete,
  previousState,
}: DragDropGameProps) {
  const [userAssignments, setUserAssignments] = useState<Map<string, string>>(
    previousState?.userActions?.placements 
      ? new Map(Object.entries(previousState.userActions.placements))  // ✅ Load previous placements
      : new Map()
  );
  const [showFeedback, setShowFeedback] = useState(!!previousState);  // ✅ Show feedback if has previous state
  const [isSubmitted, setIsSubmitted] = useState(!!previousState);  // ✅ Mark as submitted if has previous state
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const itemsInTargets = useMemo(() => {
    const map = new Map<string, DragDropItem[]>();
    config.targets.forEach((t) => map.set(t.id, []));
    config.items.forEach((item) => {
      const targetId = userAssignments.get(item.id);
      if (targetId) map.get(targetId)!.push(item);
    });
    return map;
  }, [userAssignments, config.items, config.targets]);

  const unplacedItems = config.items.filter((i) => !userAssignments.has(i.id));

  // Custom collision detection that prioritizes drop zones
  const customCollisionDetection = (args: any) => {
    // First, check if we're over any target zones
    const rectIntersectionCollisions = rectIntersection(args);
    const targetCollisions = rectIntersectionCollisions.filter((collision: any) =>
      String(collision.id).startsWith('target_')
    );
    
    // If we found target collisions, return only those
    if (targetCollisions.length > 0) {
      return targetCollisions;
    }
    
    // Otherwise, return all collisions
    return rectIntersectionCollisions;
  };

  const handleDragStart = (e: DragStartEvent) => {
    if (isPreview || isSubmitted) return;
    setActiveId(e.active.id);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (isPreview || isSubmitted) return;
    const { active, over } = e;
    
    if (over && String(over.id).startsWith('target_')) {
      const targetId = over.id.toString().replace('target_', '');
      const itemId = active.id.toString().replace('placed_', '');
      
      setUserAssignments((prev) => {
        const next = new Map(prev);
        next.set(itemId, targetId);
        return next;
      });
    }
    setActiveId(null);
  };

  const handleRemoveFromZone = (itemId: string) => {
    if (isPreview || isSubmitted) return;
    setUserAssignments((prev) => {
      const next = new Map(prev);
      next.delete(itemId);
      return next;
    });
  };

  const handleSubmit = () => {
    if (isPreview || isSubmitted) return;

    let correctCount = 0;
    config.items.forEach((item) => {
      if (userAssignments.get(item.id) === item.correctTargetId) correctCount++;
    });

    const allCorrect = correctCount === config.items.length;
    setAttempts((a) => a + 1);
    setShowFeedback(true);
    setIsSubmitted(true);

    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    const totalReward = isQuiz ? config.totalPoints : config.totalXp;
    
    // Calculate proportional reward based on correct answers
    const earnedReward = Math.round((correctCount / config.items.length) * (totalReward || 0));

    const placements = Object.fromEntries(userAssignments);

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        success: allCorrect,
        correctCount,
        totalCount: config.items.length,
        earnedPoints: earnedReward,
        attempts: attempts + 1,
        timeSpent,
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
          success: allCorrect,
          correctCount,
          totalCount: config.items.length,
          earnedXp: earnedReward,
          attempts: attempts + 1,
          timeSpent,
          userActions: { placements }, 
        });
      }, 1500);
    }
  };

  const handleTryAgain = () => {
    setUserAssignments(new Map());
    setShowFeedback(false);
    setIsSubmitted(false);
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

  const correctCount = useMemo(() => {
    if (!showFeedback) return 0;
    let count = 0;
    config.items.forEach((item) => {
      if (userAssignments.get(item.id) === item.correctTargetId) count++;
    });
    return count;
  }, [showFeedback, config.items, userAssignments]);

  return (
    <div className="w-full max-w-6xl mx-auto">
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
              <span className="text-3xl font-bold text-blue-500">?</span>
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">{config.instruction}</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Progress Counter (if not submitted and not preview) */}
          {mode !== 'preview' && !isSubmitted && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Placed:</span>
              <span className="font-bold text-lg text-gray-800">
                {userAssignments.size} / {config.items.length}
              </span>
            </div>
          )}

          {/* Center: Results (lesson mode, after submission) */}
          {!isQuiz && isSubmitted && showFeedback && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
            >
              <span className="text-lg font-bold text-green-600">
                {correctCount} / {config.items.length}
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-lg font-semibold text-gray-700">
                +{Math.round((correctCount / config.items.length) * (config.totalXp || 0))} XP
              </span>
            </motion.div>
          )}

          {/* Right: Submit Button (if not submitted and not preview) */}
          {mode !== 'preview' && !isSubmitted && (
            <motion.button
              onClick={handleSubmit}
              disabled={userAssignments.size !== config.items.length}
              className={clsx(
                "px-6 py-2 rounded-lg font-semibold text-white shadow-lg transition-all",
                userAssignments.size === config.items.length
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  : "bg-gray-400 cursor-not-allowed"
              )}
              whileHover={userAssignments.size === config.items.length ? { scale: 1.05 } : {}}
              whileTap={userAssignments.size === config.items.length ? { scale: 0.95 } : {}}
            >
              Submit
            </motion.button>
          )}

          {/* Right: Try Again Button (lesson mode, after submission) */}
          {mode === 'lesson' && isSubmitted && showFeedback && (
            <motion.button
              onClick={handleTryAgain}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-2 rounded-lg font-semibold text-white shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Try Again
            </motion.button>
          )}

          {/* Preview Mode Info */}
          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • {config.items.length} items • {config.targets.length} targets
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
        {/* Horizontal Scrollable Items */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-700">Available Items</h3>
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
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
              <div className="w-full text-center py-8 text-gray-400">
                All items have been placed
              </div>
            )}
          </div>
        </div>

        {/* Drop Zones - Horizontal Row */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">Drop Zones</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {config.targets.map((target) => (
              <DroppableZone
                key={target.id}
                target={target}
                itemsInTarget={itemsInTargets.get(target.id) || []}
                isPreview={isPreview}
                onRemoveItem={handleRemoveFromZone}
                showFeedback={showFeedback}
                config={config}
                isAnyItemDragging={!!activeId}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeItem && !isPreview && (
            <div className="bg-white border-4 border-blue-500 rounded-xl p-4 shadow-2xl min-w-[140px]">
              {activeItem.imageUrl && (
                <img 
                  src={activeItem.imageUrl} 
                  alt={activeItem.content} 
                  className="w-16 h-16 object-cover rounded-lg mx-auto mb-2" 
                />
              )}
              <p className="text-center font-bold text-sm">{activeItem.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}