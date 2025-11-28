// apps/web/components/games/PhotoSwipePlayer.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export type PhotoSwipeCard = {
  id: string;
  imageUrl: string;
  isCorrect: 'safe' | 'unsafe';
  explanation: string;
  xp?: number;
  points?: number;
};

export type PhotoSwipeGameConfig = {
  instruction: string;
  cards: PhotoSwipeCard[];
  timeAttackMode: boolean;
  timeLimitSeconds?: number;
  totalXp?: number;
  totalPoints?: number;
};

type Props = {
  config: PhotoSwipeGameConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    earnedXp?: number;
    earnedPoints?: number;
    mistakes: number;
    timeSpent: number;
  }) => void;
};

export default function PhotoSwipePlayer({ config, mode, onComplete }: Props) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';
  const hasTimer = config.timeAttackMode && !isPreview;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds || 0);
  const [startTime] = useState<Date>(new Date());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoiceCorrect, setLastChoiceCorrect] = useState<boolean | null>(null);

  // LIVE DRAG STATE
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const currentCard = config.cards[currentIndex];

  // Timer
  useEffect(() => {
    if (!hasTimer || isPreview) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
      const remaining = Math.max(0, (config.timeLimitSeconds || 0) - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) endGame();
    }, 100);
    return () => clearInterval(interval);
  }, [hasTimer, isPreview, config.timeLimitSeconds]);

  const endGame = () => {
    const timeSpent = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    if (mistakes === 0 && currentIndex === config.cards.length) {
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
      toast.success('Perfect! No mistakes!');
    }
    onComplete?.({
      success: currentIndex === config.cards.length,
      earnedXp: isQuiz ? undefined : score,
      earnedPoints: isQuiz ? score : undefined,
      mistakes,
      timeSpent,
    });
  };

  const handleChoice = (choice: 'safe' | 'unsafe') => {
    if (showFeedback) return;

    const isCorrect = choice === currentCard.isCorrect;
    setLastChoiceCorrect(isCorrect);

    if (isCorrect) {
      const reward = isQuiz ? (currentCard.points || 10) : (currentCard.xp || 10);
      setScore(s => s + reward);
    } else {
      setMistakes(m => m + 1);
    }

    if (config.timeAttackMode || isPreview || isCorrect) {
      setTimeout(goNext, 600);
    } else {
      setShowFeedback(true);
    }
  };

  const goNext = () => {
    if (currentIndex < config.cards.length - 1) {
      setCurrentIndex(i => i + 1);
      setShowFeedback(false);
      setLastChoiceCorrect(null);
      setDragX(0);
      setIsDragging(false);
    } else {
      endGame();
      setShowFeedback(false);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Drag handlers
  const onDrag = (e: any, info: { offset: { x: number } }) => {
    setDragX(info.offset.x);
    setIsDragging(true);
  };

  const onDragEnd = (e: any, info: { offset: { x: number } }) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      handleChoice(info.offset.x > 0 ? 'safe' : 'unsafe');
    } else {
      setDragX(0);
    }
    setIsDragging(false);
  };

  // Preview mode
  if (isPreview) {
    return (
      <div className="w-full max-w-4xl mx-auto p-8 text-center">
        <h2 className="text-4xl font-bold mb-6">Photo Swipe Game</h2>
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 mb-10">
          <p className="text-xl font-medium text-gray-800">{config.instruction}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {config.cards.map((card, i) => (
            <div key={card.id} className="text-center">
              <div className="bg-gray-100 rounded-2xl overflow-hidden shadow-lg">
                <img src={card.imageUrl} alt="" className="w-full h-48 object-cover" />
              </div>
              <p className="mt-3 text-lg font-medium">
                {i + 1}.{' '}
                <span className={card.isCorrect === 'safe' ? 'text-green-600' : 'text-red-600'}>
                  {card.isCorrect === 'safe' ? 'Safe' : 'Unsafe'}
                </span>
              </p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-xl text-purple-700 font-bold">Preview Mode — Swipe works in real game</p>
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="relative w-full h-screen max-w-4xl mx-auto flex flex-col">

      {/* Header */}
      <div className="p-6 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
          {config.instruction}
        </h2>
        <div className="flex justify-between items-center max-w-2xl mx-auto">
          <div className="text-2xl font-bold">Card {currentIndex + 1} / {config.cards.length}</div>
          {hasTimer && (
            <div className={clsx('text-4xl font-bold', timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800')}>
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="text-2xl font-bold text-green-600">
            {isQuiz ? `${score} pts` : `${score} XP`}
          </div>
        </div>
      </div>

      {/* Draggable Card */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <motion.div
          drag={!showFeedback && !isPreview}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.6}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
          animate={{
            x: isDragging ? dragX : 0,
            rotate: isDragging ? dragX / 20 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative max-w-lg w-full cursor-grab active:cursor-grabbing"
        >
          <motion.div className="rounded-3xl overflow-hidden shadow-2xl">
            <img
              src={currentCard.imageUrl}
              alt="Safety scenario"
              className="w-full h-96 md:h-[520px] object-cover select-none"
              draggable={false}
            />

            {/* Live swipe overlay */}
            <AnimatePresence>
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: Math.min(Math.abs(dragX) / 100, 0.9) }}
                  className={clsx(
                    'absolute inset-0 flex items-center justify-center text-9xl font-black text-white',
                    dragX > 0 ? 'bg-green-600' : 'bg-red-600'
                  )}
                >
                  {dragX > 0 ? 'Safe' : 'Unsafe'}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>

      {/* Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-8 flex justify-center gap-12 bg-gradient-to-t from-black/20">
        <button
          onClick={() => handleChoice('unsafe', 'left')}
          className="px-12 py-8 rounded-3xl bg-red-600 hover:bg-red-700 text-white text-4xl font-bold shadow-2xl transform hover:scale-105 transition"
        >
          Unsafe
        </button>
        <button
          onClick={() => handleChoice('safe', 'right')}
          className="px-12 py-8 rounded-3xl bg-green-600 hover:bg-green-700 text-white text-4xl font-bold shadow-2xl transform hover:scale-105 transition"
        >
          Safe
        </button>
      </div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && !config.timeAttackMode && lastChoiceCorrect === false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-8 z-50"
            onClick={goNext}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl p-10 max-w-2xl text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-red-600 text-8xl mb-6">Incorrect</div>
              <p className="text-2xl text-gray-800 leading-relaxed mb-10">
                {currentCard.explanation}
              </p>
              <button
                onClick={goNext}
                className="px-12 py-5 bg-purple-600 hover:bg-purple-700 text-white text-2xl font-bold rounded-2xl"
              >
                Continue →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correct Flash */}
      <AnimatePresence>
        {lastChoiceCorrect === true && !showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-32 left-1/2 -translate-x-1/2 bg-green-600 text-white px-12 py-6 rounded-full text-4xl font-bold shadow-2xl z-40"
          >
            Correct! +{(isQuiz ? currentCard.points : currentCard.xp) || 10}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}