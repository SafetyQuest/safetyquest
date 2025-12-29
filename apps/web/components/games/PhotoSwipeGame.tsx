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
  const [startTime, setStartTime] = useState(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastChoice, setLastChoice] = useState<{ correct: boolean; choice: 'safe' | 'unsafe' } | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [completedAllCards, setCompletedAllCards] = useState(false);

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
        handleComplete(false); // Pass false to indicate timeout
      }
    }, 100);

    return () => clearInterval(interval);
  }, [hasTimer, isPreview, isComplete, config.timeLimitSeconds, startTime]);

  // Complete game
  const handleComplete = useCallback((wasCompleted: boolean = false) => {
    if (isComplete) return;
    setIsComplete(true);

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const allCorrect = mistakes === 0 && wasCompleted;

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
        success: wasCompleted,
        earnedXp: isQuiz ? undefined : score,
        earnedPoints: isQuiz ? score : undefined,
        mistakes,
        timeSpent,
      });
    }, 1500);
  }, [isComplete, startTime, mistakes, isQuiz, score, onComplete]);

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

    // Check if this is the last card
    const isLastCard = currentIndex === config.cards.length - 1;

    // Always move to next card immediately (feedback only shown on result screen)
    setTimeout(() => {
      if (isLastCard) {
        // All cards completed
        setCompletedAllCards(true);
        setCurrentIndex(i => i + 1);
        handleComplete(true);
      } else {
        // More cards to go
        setCurrentIndex(i => i + 1);
        setShowFeedback(false);
        setLastChoice(null);
        x.set(0);
      }
    }, 600);
  }, [showFeedback, isComplete, currentCard, isQuiz, currentIndex, config.cards.length, handleComplete, x]);

  // Go to next card (not used anymore, but keeping for potential future use)
  const goNext = useCallback(() => {
    if (hasMoreCards) {
      setCurrentIndex(i => i + 1);
      setShowFeedback(false);
      setLastChoice(null);
      x.set(0);
    }
  }, [hasMoreCards, x]);

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

  const handleTryAgain = () => {
    setCurrentIndex(0);
    setScore(0);
    setMistakes(0);
    setIncorrectCards([]);
    setTimeLeft(config.timeLimitSeconds || 0);
    setStartTime(Date.now());
    setShowFeedback(false);
    setLastChoice(null);
    setIsComplete(false);
    setCompletedAllCards(false);
    x.set(0);
  };

  // Format time
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // Preview mode
  if (isPreview) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        {/* Compact Header */}
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
                <span className="text-3xl font-bold text-indigo-500">?</span>
              </motion.div>
              
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="leading-relaxed">{config.instruction}</p>
                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              </div>
            </div>

            {/* Preview Mode Info */}
            <div className="text-sm text-gray-500">
              Preview • Swipe right for Safe, left for Unsafe
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {config.cards.map((card, i) => (
            <div key={card.id} className="text-center">
              <div className="bg-gray-100 rounded-xl overflow-hidden shadow-md aspect-[3/4]">
                <img src={card.imageUrl} alt="" className="w-full h-full object-contain" />
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
        {/* Compact Header - Complete State */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 py-3 bg-white rounded-lg shadow-md">
            {/* Left: Info Icon */}
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
                <span className="text-3xl font-bold text-indigo-500">?</span>
              </motion.div>
              
              {/* Tooltip */}
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="leading-relaxed">{config.instruction}</p>
                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              </div>
            </div>

            {/* Center: Results (lesson mode) */}
            {!isQuiz && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
              >
                <span className="text-lg font-bold text-green-600">
                  {mistakes === 0 && completedAllCards ? '🎉 Perfect!' : completedAllCards ? '✅ Complete' : '⏰ Time Up'}
                </span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-lg font-semibold text-gray-700">
                  +{score} XP
                </span>
              </motion.div>
            )}

            {/* Right: Try Again Button (lesson mode) */}
            {mode === 'lesson' && (
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
          </div>
        </div>

        {/* Stats (lesson mode only) */}
        {!isQuiz && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">{config.cards.length - mistakes}</p>
                <p className="text-xs text-gray-600">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{mistakes}</p>
                <p className="text-xs text-gray-600">Mistakes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{formatTime(Math.floor((Date.now() - startTime) / 1000))}</p>
                <p className="text-xs text-gray-600">Time</p>
              </div>
            </div>
          </div>
        )}

        {/* Show incorrect cards with explanations */}
        {!isQuiz && incorrectCards.length > 0 && (
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
      </div>
    );
  }

  if (!currentCard) return null;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Compact Header - Playing State */}
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
              <span className="text-3xl font-bold text-indigo-500">?</span>
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">{config.instruction}</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Progress and Timer */}
          <div className="flex items-center gap-4">
            {/* Progress */}
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-200">
              <span className="text-sm font-bold text-indigo-600">
                {currentIndex + 1} / {config.cards.length}
              </span>
            </div>

            {/* Timer (if time attack mode) */}
            {hasTimer && (
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-lg">⏱️</span>
                <span className={clsx(
                  'text-sm font-bold',
                  timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-purple-600'
                )}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
          </div>

          {/* Right: Empty placeholder for alignment */}
          <div className="w-8"></div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full"
            animate={{ width: `${((currentIndex + 1) / config.cards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Card Stack with Side Indicators */}
      <div className="relative h-[500px] flex items-center justify-center mb-6">
        {/* Left Side Indicator - UNSAFE */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="writing-mode-vertical text-6xl font-black text-red-500 opacity-30 select-none tracking-widest">
            UNSAFE
          </div>
        </div>

        {/* Right Side Indicator - SAFE */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="writing-mode-vertical text-6xl font-black text-green-500 opacity-30 select-none tracking-widest">
            SAFE
          </div>
        </div>

        <AnimatePresence>
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
                className="w-full aspect-[3/4] object-contain bg-gray-100 select-none pointer-events-none"
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

      {/* CSS for vertical text */}
      <style jsx>{`
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          text-orientation: upright;
        }
      `}</style>
    </div>
  );
}