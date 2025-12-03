// apps/web/components/games/TimeAttackSortingPlayer.tsx
'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  DragOverlay,           // ← THIS WAS MISSING
} from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export type TimeAttackSortingItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
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
  totalXp?: number;
  totalPoints?: number;
};

type TimeAttackSortingPlayerProps = {
  config: TimeAttackSortingConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    score: number;
    timeSpent: number;
  }) => void;
};

// Helper: format seconds → MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Sortable Item (draggable)
function SortableItem({
  item,
  isPlaced,
  isPreview,
}: {
  item: TimeAttackSortingItem;
  isPlaced: boolean;
  isPreview: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: isPreview,
  });

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
        'relative border-2 rounded-xl p-5 cursor-move transition-all select-none bg-white shadow-md',
        isDragging && 'opacity-50 scale-110 shadow-2xl z-50 border-blue-500',
        !isPreview && 'hover:border-blue-400 hover:shadow-lg',
        isPreview && 'cursor-default border-gray-300',
        isPlaced && !isPreview && 'opacity-40'
      )}
      {...(isPreview ? {} : attributes)}
      {...(isPreview ? {} : listeners)}
    >
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.content}
          className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      )}
      <p className="text-center font-medium text-gray-800">{item.content}</p>
    </motion.div>
  );
}

// Droppable Target Zone
function DroppableTarget({
  target,
  itemsInTarget,
  isPreview,
}: {
  target: TimeAttackSortingTarget;
  itemsInTarget: TimeAttackSortingItem[];
  isPreview: boolean;
}) {
  const { setNodeRef, isOver } = useSortable({
    id: `target_${target.id}`,
    data: { type: 'target' },
    disabled: true,
  });

  return (
    <div
      ref={setNodeRef}
      className={clsx(
        'min-h-64 rounded-xl border-4 border-dashed p-6 transition-all text-center bg-gray-50',
        isOver && !isPreview && 'border-blue-500 bg-blue-50 scale-105 shadow-xl',
        !isOver && !isPreview && 'border-gray-300',
        isPreview && 'border-gray-400 bg-gray-100 cursor-default'
      )}
    >
      <h3 className="font-bold text-xl text-gray-800 mb-4">{target.label}</h3>

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
        <p className="text-gray-400 text-sm mt-8">Drop items here</p>
      )}
    </div>
  );
}

export default function TimeAttackSortingPlayer({
  config,
  mode,
  onComplete,
}: TimeAttackSortingPlayerProps) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const [timeRemaining, setTimeRemaining] = useState(config.timeLimitSeconds);
  const [userPlacements, setUserPlacements] = useState<Map<string, string>>(new Map());
  const [gameState, setGameState] = useState<'playing' | 'success' | 'timeout'>('playing');
  const [score, setScore] = useState(0);
  const [activeId, setActiveId] = useState<string | null>(null);
  const startTime = useRef(Date.now());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const activeItem = useMemo(() => {
    if (!activeId) return null;
    return config.items.find((item) => item.id === activeId) || null;
  }, [activeId, config.items]);

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
    if (gameState !== 'playing' || isPreview) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      const remaining = Math.max(0, config.timeLimitSeconds - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        clearInterval(interval);
        handleTimeout();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, isPreview, config.timeLimitSeconds]);

  const calculateScore = () => {
    let total = 0;
    config.items.forEach((item) => {
      if (userPlacements.get(item.id) === item.correctTargetId) {
        total += isQuiz ? (item.points || 0) : (item.xp || 0);
      }
    });
    return total;
  };

  const checkAllCorrect = () => {
    return config.items.every((item) => userPlacements.get(item.id) === item.correctTargetId);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id.toString();

    if (overId.startsWith('target_')) {
      const targetId = overId.replace('target_', '');
      setUserPlacements((prev) => {
        const next = new Map(prev);
        next.set(itemId, targetId);
        return next;
      });
      toast.success('Item placed!', { duration: 800 });
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleSubmit = () => {
    if (userPlacements.size !== config.items.length) {
      toast.error('Place all items before submitting!');
      return;
    }

    const calculatedScore = calculateScore();
    setScore(calculatedScore);

    if (checkAllCorrect()) {
      setGameState('success');
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#10B981', '#34D399', '#6EE7B7B7'],
      });
      toast.success('Perfect! All sorted correctly!');

      const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
      onComplete?.({ success: true, score: calculatedScore, timeSpent });
    } else {
      toast.error('Some items are misplaced. Try again!');
    }
  };

  const handleTimeout = () => {
    setGameState('timeout');
    const calculatedScore = calculateScore();
    setScore(calculatedScore);
    toast.error('Time’s up!', { duration: 3000 });
    const timeSpent = config.timeLimitSeconds;
    onComplete?.({ success: false, score: calculatedScore, timeSpent });
  };

  const resetGame = () => {
    setUserPlacements(new Map());
    setGameState('playing');
    setTimeRemaining(config.timeLimitSeconds);
    setScore(0);
    startTime.current = Date.now();
  };

  // Preview Mode
// Preview Mode — NOW 100% VISUALLY IDENTICAL TO GAME MODE
if (isPreview) {
    return (
      <div className="w-full max-w-6xl mx-auto p-8">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">Time-Attack Sorting Game</h2>
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 shadow-lg border-2 border-purple-200">
            <p className="text-2xl font-semibold text-gray-800 leading-relaxed">
              {config.instruction}
            </p>
          </div>
        </div>
  
        <div className="text-center mb-12">
          <p className="text-3xl font-bold text-purple-700">
            Time Limit: <span className="text-red-600">{config.timeLimitSeconds}s</span> • {config.items.length} items
          </p>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Items — EXACT SAME DESIGN AS IN GAME */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Items to Sort</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {config.items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: config.items.indexOf(item) * 0.05 }}
                  className="relative border-2 rounded-xl p-5 cursor-default transition-all select-none bg-white shadow-md border-gray-300"
                >
                  {item.imageUrl && (
                    <img
                      src={item.imageUrl}
                      alt={item.content}
                      className="w-20 h-20 object-cover rounded-lg mx-auto mb-3"
                      onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                    />
                  )}
                  <p className="text-center font-medium text-gray-800">{item.content}</p>
                </motion.div>
              ))}
            </div>
          </div>
  
          {/* Target Zones — Clean & Clear */}
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Target Zones</h3>
            <div className="space-y-8">
              {config.targets.map((target, index) => (
                <motion.div
                  key={target.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="min-h-64 rounded-xl border-4 border-dashed p-10 text-center bg-gray-50 border-gray-400"
                >
                  <h4 className="text-2xl font-bold text-gray-800 mb-4">{target.label}</h4>
                  <p className="text-gray-500 italic">Players will drag items here</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
  
        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-14 py-7 rounded-full text-2xl font-bold shadow-2xl">
            Sort all items correctly before time runs out!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">{config.instruction}</h2>
        <div className="flex justify-center gap-16 text-2xl font-bold">
          <div className={clsx(timeRemaining <= 10 && 'text-red-600 animate-pulse')}>
            Time: {formatTime(timeRemaining)}
          </div>
          <div className="text-green-600">Score: {score}</div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Items Panel */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">Items to Sort</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {unplacedItems.map((item) => (
                <SortableItem key={item.id} item={item} isPlaced={false} isPreview={isPreview} />
              ))}
            </div>
          </div>

          {/* Targets Panel */}
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

        {/* Fixed: DragOverlay is now imported */}
        <DragOverlay>
          {activeItem && (
            <div className="bg-white border-4 border-blue-500 rounded-xl p-6 shadow-2xl transform rotate-3">
              {activeItem.imageUrl && (
                <img
                  src={activeItem.imageUrl}
                  alt={activeItem.content}
                  className="w-24 h-24 object-cover rounded-lg mx-auto mb-3 shadow-md"
                />
              )}
              <p className="text-center font-bold text-lg text-gray-800">{activeItem.content}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Submit Button */}
      <div className="mt-12 text-center">
        <button
          onClick={handleSubmit}
          disabled={userPlacements.size !== config.items.length}
          className={clsx(
            'px-20 py-6 rounded-3xl font-bold text-3xl shadow-2xl transition-all',
            userPlacements.size === config.items.length
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white hover:from-teal-700 hover:to-cyan-700 active:scale-95'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          )}
        >
          Submit Answer
        </button>
      </div>

      {/* Timeout Overlay */}
      <AnimatePresence>
        {gameState === 'timeout' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-10 text-center max-w-md shadow-2xl"
            >
              <h2 className="text-5xl font-bold text-red-600 mb-4">Time’s Up!</h2>
              <p className="text-3xl mb-6">
                Final Score: <span className="text-green-600">{score}</span>
              </p>
              <button
                onClick={resetGame}
                className="px-12 py-4 bg-purple-600 hover:bg-purple-700 text-white text-xl font-bold rounded-xl shadow-lg"
              >
                Try Again
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}