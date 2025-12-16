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
  }) => void;
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
        'relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all',
        isDragging && 'opacity-50 scale-110 shadow-lg z-50',
        showFeedback && isCorrect === true && 'bg-green-100 border-2 border-green-500 text-green-700',
        showFeedback && isCorrect === false && 'bg-red-100 border-2 border-red-500 text-red-700',
        !showFeedback && !isPreview && 'bg-blue-50 border-2 border-blue-300 text-blue-700 cursor-move hover:bg-blue-100',
        isPreview && 'bg-blue-100 border-2 border-blue-400 text-blue-800 cursor-default'
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
          className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
          title="Remove from zone"
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
        'min-h-24 rounded-xl border-3 border-dashed p-4 transition-all',
        isOver && !isPreview && 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg',
        !isOver && !isPreview && 'border-gray-300 bg-gray-50',
        isPreview && 'border-blue-400 bg-blue-50/50 cursor-default'
      )}
    >
      <h3 className="font-bold text-base text-gray-800 mb-3">{target.label}</h3>

      {itemsInTarget.length > 0 ? (
        <div 
          className="flex flex-wrap gap-2"
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
        <p className="text-gray-400 text-sm text-center py-2">Drop items here</p>
      )}
    </div>
  );
}

export default function DragDropGame({
  config,
  mode,
  onComplete,
}: DragDropGameProps) {
  const [userAssignments, setUserAssignments] = useState<Map<string, string>>(new Map());
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
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

    if (isQuiz) {
      // Quiz mode: silent submission
      onComplete?.({
        success: allCorrect,
        correctCount,
        totalCount: config.items.length,
        earnedPoints: earnedReward,
        attempts: attempts + 1,
        timeSpent,
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
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.instruction}
        </h3>

        {isPreview && (
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • {config.items.length} items • {config.targets.length} targets
          </p>
        )}

        {/* Progress Counter (not submitted yet) */}
        {mode !== 'preview' && !isSubmitted && (
          <div className="max-w-md mx-auto mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Items Placed</span>
              <span className="font-semibold text-gray-800">
                {userAssignments.size} / {config.items.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: 0 }}
                animate={{ width: `${(userAssignments.size / config.items.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Drag items to the correct zones below
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
              {correctCount} / {config.items.length} Correct!
            </p>
            <p className="text-lg font-semibold text-gray-700 mt-2">
              +{Math.round((correctCount / config.items.length) * (config.totalXp || 0))} XP
            </p>
          </motion.div>
        )}
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

        {/* Drop Zones */}
        <div>
          <h3 className="text-lg font-bold text-gray-700 mb-4">Drop Zones</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Submit Button */}
      {mode !== 'preview' && !isSubmitted && (
        <div className="mt-6 text-center">
          <motion.button
            onClick={handleSubmit}
            disabled={userAssignments.size !== config.items.length}
            className={clsx(
              "px-8 py-3 rounded-lg font-semibold text-white text-lg shadow-lg transition-all",
              userAssignments.size === config.items.length
                ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:shadow-xl hover:scale-105"
                : "bg-gray-400 cursor-not-allowed"
            )}
            whileHover={userAssignments.size === config.items.length ? { scale: 1.05 } : {}}
            whileTap={userAssignments.size === config.items.length ? { scale: 0.95 } : {}}
          >
            Submit Answers ({userAssignments.size} placed)
          </motion.button>
          
          {userAssignments.size < config.items.length && (
            <p className="mt-2 text-sm text-gray-500">
              Place all {config.items.length} items before submitting
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