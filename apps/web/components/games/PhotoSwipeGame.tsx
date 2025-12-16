// apps/web/components/games/PhotoSwipeGame.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
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

export default function PhotoSwipeGame({ config, mode, onComplete }: Props) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';
  const hasTimer = config.timeAttackMode && !isPreview;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [incorrectCards, setIncorrectCards] = useState<PhotoSwipeCard[]>([]);
  const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds || 0);
  const [startTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<{ correct: boolean; choice: 'safe' | 'unsafe' } | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  // Motion values for drag (ALWAYS declare, even if not used)
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const leftOpacity = useTransform(x, [-200, -50, 0], [1, 0.5, 0]);
  const rightOpacity = useTransform(x, [0, 50, 200], [0, 0.5, 1]);

  const currentCard = config.cards[currentIndex];
  const hasMoreCards = currentIndex < config.cards.length - 1;

  // Timer
  useEffect(() => {
    if (!hasTimer || isPreview || isComplete) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, (config.timeLimitSeconds || 0) - elapsed);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        handleComplete();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [hasTimer, isPreview, isComplete, config.timeLimitSeconds, startTime]);

  // Complete game
  const handleComplete = useCallback(() => {
    if (isComplete) return;
    setIsComplete(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const allCorrect = mistakes === 0;

    if (!isQuiz && allCorrect) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#86efac'],
      });
    }

    setTimeout(() => {
      onComplete?.({
        success: currentIndex === config.cards.length || allCorrect,
        earnedXp: isQuiz ? undefined : score,
        earnedPoints: isQuiz ? score : undefined,
        mistakes,
        timeSpent,
      });
    }, 1500);
  }, [isComplete, startTime, mistakes, isQuiz, score, currentIndex, config.cards.length, onComplete]);

  // Handle choice
  const handleChoice = useCallback((choice: 'safe' | 'unsafe') => {
    if (showFeedback || isComplete || !currentCard) return;

    const isCorrect = choice === currentCard.isCorrect;
    setLastChoice({ correct: isCorrect, choice });

    if (isCorrect) {
      const reward = isQuiz ? (currentCard.points || 10) : (currentCard.xp || 10);
      setScore(s => s + reward);
    } else {
      setMistakes(m => m + 1);
      // Track incorrect card for results screen
      setIncorrectCards(prev => [...prev, currentCard]);
    }

    // Always move to next card immediately (feedback only shown on result screen)
    setTimeout(() => {
      goNext();
    }, 600);
  }, [showFeedback, isComplete, currentCard, isQuiz, config.timeAttackMode, mode]);

  // Go to next card
  const goNext = useCallback(() => {
    if (hasMoreCards) {
      setCurrentIndex(i => i + 1);
      setShowFeedback(false);
      setLastChoice(null);
      x.set(0);
    } else {
      handleComplete();
    }
  }, [hasMoreCards, x, handleComplete]);

  // Handle drag end
  const handleDragEnd = useCallback((event: any, info: any) => {
    const threshold = 100;
    const velocity = info.velocity.x;

    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      const direction = info.offset.x > 0 || velocity > 0 ? 'safe' : 'unsafe';
      
      // Animate card out
      x.set(info.offset.x > 0 ? 500 : -500);
      
      setTimeout(() => {
        handleChoice(direction);
      }, 200);
    } else {
      // Snap back
      x.set(0);
    }
  }, [x, handleChoice]);

  // Format time
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Preview mode
  if (isPreview) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Photo Swipe Game</h3>
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • Swipe right for Safe, left for Unsafe
          </p>
        </div>

        <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 rounded-xl">
          <p className="text-lg leading-relaxed text-gray-800">
            {config.instruction}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {config.cards.map((card, i) => (
            <div key={card.id} className="text-center">
              <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md aspect-[3/4]">
                <img src={card.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <p className="mt-2 text-sm font-medium">
                {i + 1}.{' '}
                <span className={card.isCorrect === 'safe' ? 'text-green-600' : 'text-red-600'}>
                  {card.isCorrect === 'safe' ? '✓ Safe' : '✗ Unsafe'}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Complete screen
  if (isComplete) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {config.instruction}
          </h3>
        </div>

        {!isQuiz && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 text-center"
            >
              <p className="text-3xl font-bold text-green-600 mb-2">
                {mistakes === 0 ? '🎉 Perfect Score!' : '✅ Complete!'}
              </p>
              <p className="text-2xl font-semibold text-gray-700">
                +{score} XP
              </p>
              <div className="mt-4 text-sm text-gray-600">
                <p>Correct: {config.cards.length - mistakes} / {config.cards.length}</p>
                <p>Mistakes: {mistakes}</p>
                <p>Time: {formatTime(Math.floor((Date.now() - startTime) / 1000))}</p>
              </div>
            </motion.div>

            {/* Show incorrect cards with explanations */}
            {incorrectCards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <h4 className="text-lg font-bold text-gray-800 mb-4 text-center">
                  Review Incorrect Answers
                </h4>
                <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                  {incorrectCards.map((card, index) => (
                    <motion.div
                      key={`${card.id}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white rounded-xl border-2 border-red-200 overflow-hidden shadow-md"
                    >
                      <div className="flex gap-4 p-4">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={card.imageUrl}
                            alt=""
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">❌</span>
                            <span className={clsx(
                              'px-3 py-1 rounded-full text-sm font-bold',
                              card.isCorrect === 'safe' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            )}>
                              Correct: {card.isCorrect === 'safe' ? 'SAFE ✓' : 'UNSAFE ✗'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {card.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {config.instruction}
          </h3>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span className="font-semibold">{currentIndex + 1} / {config.cards.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
              animate={{ width: `${((currentIndex + 1) / config.cards.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Timer (if time attack mode) */}
        {hasTimer && (
          <div className="text-center">
            <div className={clsx(
              'inline-block px-6 py-2 rounded-full bg-white shadow-md',
              timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-gray-800'
            )}>
              <span className="text-sm font-medium">⏱️ Time: </span>
              <span className="text-lg font-bold">{formatTime(timeLeft)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Stack */}
      <div className="relative h-[500px] flex items-center justify-center mb-6">
        <AnimatePresence>
          {/* Next card (background) */}
          {hasMoreCards && config.cards[currentIndex + 1] && (
            <motion.div
              key={`next-${currentIndex + 1}`}
              className="absolute w-full max-w-sm"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 0.95, y: 10 }}
            >
              <div className="rounded-2xl overflow-hidden shadow-lg opacity-50">
                <img
                  src={config.cards[currentIndex + 1].imageUrl}
                  alt=""
                  className="w-full aspect-[3/4] object-cover"
                />
              </div>
            </motion.div>
          )}

          {/* Current card */}
          <motion.div
            key={`current-${currentIndex}`}
            style={{ x, rotate, opacity }}
            drag
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className="absolute w-full max-w-sm cursor-grab active:cursor-grabbing"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={currentCard.imageUrl}
                alt="Safety scenario"
                className="w-full aspect-[3/4] object-cover select-none pointer-events-none"
              />

              {/* Swipe indicators */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ opacity: leftOpacity }}
              >
                <div className="bg-red-500 text-white px-6 py-3 rounded-full text-2xl font-bold rotate-12 border-4 border-white">
                  UNSAFE ✗
                </div>
              </motion.div>

              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ opacity: rightOpacity }}
              >
                <div className="bg-green-500 text-white px-6 py-3 rounded-full text-2xl font-bold -rotate-12 border-4 border-white">
                  SAFE ✓
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Swipe hint */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500">
          ← Swipe left for Unsafe • Swipe right for Safe →
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-6">
          <motion.button
            onClick={() => {
              x.set(-500);
              setTimeout(() => handleChoice('unsafe'), 200);
            }}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg flex items-center justify-center text-2xl font-bold transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✗
          </motion.button>

          <motion.button
            onClick={() => {
              x.set(500);
              setTimeout(() => handleChoice('safe'), 200);
            }}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg flex items-center justify-center text-2xl font-bold transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            ✓
          </motion.button>
        </div>

      {/* Correct feedback flash */}
      <AnimatePresence>
        {lastChoice && lastChoice.correct && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 bg-green-500 text-white px-8 py-4 rounded-full text-xl font-bold shadow-2xl z-40"
          >
            ✓ Correct!
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}