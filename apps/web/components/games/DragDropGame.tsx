// apps/web/components/games/DragDropGame.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  UniqueIdentifier,
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import clsx from 'clsx';

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

// Draggable Item
function DraggableItem({
  item,
  isPlaced,
  isCorrect,
  showFeedback,
  isPreview,
}: {
  item: DragDropItem;
  isPlaced: boolean;
  isCorrect?: boolean;
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
      animate={{ scale: 1, opacity: isPlaced && !isPreview ? 0.4 : 1 }}
      className={clsx(
        'relative border-2 rounded-xl p-5 cursor-move transition-all select-none',
        isDragging && 'opacity-50 scale-110 shadow-2xl z-50',
        showFeedback && isCorrect === true && 'border-green-500 bg-green-50 shadow-green-200',
        showFeedback && isCorrect === false && 'border-red-500 bg-red-50 shadow-red-200',
        !showFeedback && !isPreview && 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg',
        isPreview && 'border-blue-500 bg-blue-50 cursor-default',
        isPlaced && !isPreview && !showFeedback && 'opacity-40'
      )}
      {...(isPreview ? {} : attributes)}
      {...(isPreview ? {} : listeners)}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.content}
          className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      )}
      <p className="text-center font-medium text-gray-800">{item.content}</p>

      {showFeedback && (
        <div className="absolute -top-3 -right-3">
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

// Droppable Target
function DroppableTarget({
  target,
  itemsInTarget,
  isPreview,
}: {
  target: DragDropTarget;
  itemsInTarget: DragDropItem[];
  isPreview: boolean;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: `target_${target.id}`,
    data: { type: 'target' },
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-48 rounded-xl border-4 border-dashed p-6 transition-all text-center',
        isOver && !isPreview && 'border-blue-500 bg-blue-50 scale-105 shadow-xl',
        !isOver && !isPreview && 'border-gray-300 bg-gray-50',
        isPreview && 'border-blue-400 bg-blue-50/50 cursor-default'
      )}
    >
      <h3 className="font-bold text-lg text-gray-800 mb-4">{target.label}</h3>

      {itemsInTarget.length > 0 ? (
        <div className="space-y-3">
          {itemsInTarget.map((item) => (
            <motion.div
              key={item.id}
              layoutId={item.id}
              className="bg-white rounded-lg p-3 shadow-md border"
            >
              {item.imageUrl && (
                <img
                  src={item.imageUrl}
                  alt={item.content}
                  className="w-12 h-12 object-cover rounded mx-auto mb-2"
                />
              )}
              <p className="text-sm font-medium">{item.content}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-gray-400 text-sm">Drop items here</p>
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
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
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

  const handleDragStart = (e: DragStartEvent) => {
    if (isPreview) return;
    setActiveId(e.active.id);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    if (isPreview) return;
    const { active, over } = e;
    if (over && String(over.id).startsWith('target_')) {
      const targetId = over.id.toString().replace('target_', '');
      setUserAssignments((prev) => {
        const next = new Map(prev);
        next.set(active.id.toString(), targetId);
        return next;
      });
      toast.success('Item placed!', { duration: 1200 });
    }
    setActiveId(null);
  };

  const checkAnswers = () => {
    if (isPreview) return;

    let correctCount = 0;
    config.items.forEach((item) => {
      if (userAssignments.get(item.id) === item.correctTargetId) correctCount++;
    });

    const allCorrect = correctCount === config.items.length;
    setAttempts((a) => a + 1);
    setShowFeedback(true);

    if (allCorrect) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      toast.success('Perfect! All items matched correctly!', { duration: 4000, icon: 'Excellent' });

      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const reward = isQuiz ? config.totalPoints : config.totalXp;

      setTimeout(() => {
        onComplete?.({
          success: true,
          correctCount,
          totalCount: config.items.length,
          earnedXp: isQuiz ? undefined : reward,
          earnedPoints: isQuiz ? reward : undefined,
          attempts: attempts + 1,
          timeSpent,
        });
      }, 2200);
    } else {
      toast.error(`${correctCount}/${config.items.length} correct. Try again!`, { duration: 3000 });
    }
  };

  const reset = () => {
    setUserAssignments(new Map());
    setShowFeedback(false);
  };

  const activeItem = activeId ? config.items.find((i) => i.id === activeId) : null;

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      {/* Instruction */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center p-6 bg-blue-50 border border-blue-200 rounded-xl"
      >
        <h2 className="text-2xl font-bold text-gray-800">{config.instruction}</h2>
        {isPreview && (
          <p className="mt-2 text-sm text-blue-700 font-medium">
            Preview Mode • {config.items.length} items • {config.targets.length} targets
          </p>
        )}
      </motion.div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Items */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">Draggable Items</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-4">
              {config.items.map((item) => {
                const placedTarget = userAssignments.get(item.id);
                const isCorrect = placedTarget === item.correctTargetId;

                return (
                  <DraggableItem
                    key={item.id}
                    item={item}
                    isPlaced={!!placedTarget}
                    isCorrect={showFeedback ? isCorrect : undefined}
                    showFeedback={showFeedback}
                    isPreview={isPreview}
                  />
                );
              })}
            </div>
          </div>

          {/* Targets */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">Target Zones</h3>
            <div className="space-y-6">
              {config.targets.map((target) => (
                <DroppableTarget
                  key={target.id}
                  target={target}
                  itemsInTarget={itemsInTargets.get(target.id) || []}
                  isPreview={isPreview}
                />
              ))}
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeItem && !isPreview && (
            <div className="bg-white border-4 border-blue-500 rounded-xl p-6 shadow-2xl">
              {activeItem.imageUrl && (
                <img src={activeItem.imageUrl} alt={activeItem.content} className="w-24 h-24 object-cover rounded-lg mx-auto mb-3" />
              )}
              <p className="text-center font-bold text-lg">{activeItem.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Buttons */}
      <div className="mt-10 flex justify-center gap-4">
        {!isPreview && (
          <>
            <button
              onClick={checkAnswers}
              disabled={userAssignments.size !== config.items.length}
              className={clsx(
                'px-10 py-4 rounded-xl font-bold text-lg transition-all',
                userAssignments.size === config.items.length
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              )}
            >
              Check Answer
            </button>

            {showFeedback && (
              <button onClick={reset} className="px-8 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-bold">
                Try Again
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}