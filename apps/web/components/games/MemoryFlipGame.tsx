// apps/web/components/games/MemoryFlipGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

export type MemoryFlipCard = { 
  id: string; 
  text?: string; 
  imageUrl?: string; 
};

export type MemoryFlipPair = { 
  leftId: string; 
  rightId: string; 
  xp: number; 
  points?: number; 
};

export type MemoryFlipGameConfig = {
  instruction: string;
  cards: MemoryFlipCard[];
  pairs: MemoryFlipPair[];
  timeLimitSeconds: number;
  perfectGameMultiplier: number;
  totalXp?: number;
  totalPoints?: number;
};

type Props = {
  config: MemoryFlipGameConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: {
    success: boolean;
    earnedXp?: number;
    earnedPoints?: number;
    mistakes: number;
    timeSpent: number;
  }) => void;
};

export default function MemoryFlipGame({ config, mode, onComplete }: Props) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const [gameState, setGameState] = useState<'playing' | 'complete'>('playing');
  const [shuffled, setShuffled] = useState<MemoryFlipCard[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds);
  const [startTime, setStartTime] = useState<number | null>(null);

  const baseReward = useMemo(() => 
    config.pairs.reduce((s, p) => s + (isQuiz ? (p.points || p.xp) : p.xp), 0),
    [config.pairs, isQuiz]
  );
  
  const perfectReward = useMemo(() => 
    baseReward * config.perfectGameMultiplier,
    [baseReward, config.perfectGameMultiplier]
  );

  // Fisher-Yates shuffle
  const shuffleCards = useCallback((cards: MemoryFlipCard[]) => {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  // Initialize game on mount (only once)
  useEffect(() => {
    const shuffledCards = shuffleCards(config.cards);
    setShuffled(shuffledCards);
    if (!isPreview) {
      setStartTime(Date.now());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty array means run only once on mount

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || !startTime || isPreview) return;

    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, config.timeLimitSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        setGameState('complete');
        onComplete?.({
          success: false,
          earnedXp: isQuiz ? undefined : 0,
          earnedPoints: isQuiz ? 0 : undefined,
          mistakes,
          timeSpent: config.timeLimitSeconds,
        });
      }
    }, 100);

    return () => clearInterval(id);
  }, [gameState, startTime, config.timeLimitSeconds, mistakes, isQuiz, isPreview, onComplete]);

  // Check if game is complete
  useEffect(() => {
    if (gameState === 'playing' && matched.size === config.cards.length && matched.size > 0) {
      const timeSpent = Math.round((Date.now() - (startTime || Date.now())) / 1000);
      const reward = mistakes === 0 ? perfectReward : baseReward;

      setGameState('complete');

      if (!isQuiz && mistakes === 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#86efac'],
        });
      }

      setTimeout(() => {
        onComplete?.({
          success: true,
          earnedXp: isQuiz ? undefined : reward,
          earnedPoints: isQuiz ? reward : undefined,
          mistakes,
          timeSpent,
        });
      }, 1500);
    }
  }, [matched.size, config.cards.length, gameState, mistakes, perfectReward, baseReward, startTime, isQuiz, onComplete]);

  // Handle card click
  const handleClick = useCallback((id: string) => {
    if (gameState !== 'playing') return;
    if (matched.has(id)) return;

    if (isPreview) {
      // Preview: just toggle flip
      setRevealed(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    // Already 2 cards revealed, ignore
    if (revealed.size >= 2) return;

    const newRevealed = new Set(revealed).add(id);
    setRevealed(newRevealed);

    // Check for match if 2 cards revealed
    if (newRevealed.size === 2) {
      const [a, b] = Array.from(newRevealed);
      const isMatch = config.pairs.some(
        p => (p.leftId === a && p.rightId === b) || (p.leftId === b && p.rightId === a)
      );

      if (isMatch) {
        // Match found!
        setMatched(prev => new Set([...prev, a, b]));
        setRevealed(new Set());
      } else {
        // No match
        setMistakes(m => m + 1);
        setTimeout(() => setRevealed(new Set()), 1000);
      }
    }
  }, [gameState, revealed, matched, isPreview, config.pairs]);

  // Calculate grid layout
  const cols = Math.ceil(Math.sqrt(config.cards.length));
  const rows = Math.ceil(config.cards.length / cols);

  // Format time
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.instruction}
        </h3>

        {isPreview && (
          <p className="text-sm text-blue-600 font-medium">
            Preview Mode • Click cards to test flip animation
          </p>
        )}

        {/* Results Card (Lesson mode only, after complete) */}
        {!isQuiz && gameState === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto mt-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200"
          >
            <p className="text-3xl font-bold text-green-600 mb-2">
              {mistakes === 0 ? '🎉 Perfect Game!' : '✅ Complete!'}
            </p>
            <p className="text-2xl font-semibold text-gray-700">
              +{mistakes === 0 ? perfectReward : baseReward} XP
            </p>
            {mistakes === 0 && (
              <p className="text-sm text-green-700 mt-2">
                Zero mistakes! {config.perfectGameMultiplier}× bonus applied!
              </p>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <p>Mistakes: {mistakes}</p>
              <p>Time: {formatTime(config.timeLimitSeconds - timeLeft)}</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Header with Stats */}
      {!isPreview && gameState === 'playing' && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-lg font-bold text-gray-800">{formatTime(timeLeft)}</div>
            <div className="text-xs text-gray-500">Time Left</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl mb-1">❌</div>
            <div className="text-lg font-bold text-red-600">{mistakes}</div>
            <div className="text-xs text-gray-500">Mistakes</div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-md text-center">
            <div className="text-2xl mb-1">✅</div>
            <div className="text-lg font-bold text-green-600">{matched.size / 2} / {config.pairs.length}</div>
            <div className="text-xs text-gray-500">Pairs Matched</div>
          </div>
        </div>
      )}

      {/* Card Grid */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(140px, 1fr))`,
        }}
      >
        <AnimatePresence>
          {shuffled.map(card => {
            const isRevealed = revealed.has(card.id);
            const isMatched = matched.has(card.id);
            const shouldFlip = isRevealed || isMatched;

            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div
                  onClick={() => handleClick(card.id)}
                  className={clsx(
                    'flip-card h-full rounded-xl shadow-lg cursor-pointer transition-all',
                    isMatched && 'pointer-events-none opacity-90'
                  )}
                  style={{ perspective: '1000px' }}
                >
                  <div
                    className={clsx('flip-card-inner h-full', shouldFlip && 'flipped')}
                    style={{
                      transformStyle: 'preserve-3d',
                      transition: 'transform 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    }}
                  >
                    {/* Front (back of card) */}
                    <div
                      className="flip-card-front absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-white text-6xl font-bold">?</span>
                    </div>

                    {/* Back (card content) */}
                    <div
                      className={clsx(
                        'flip-card-back absolute w-full h-full bg-white border-4 rounded-xl p-4 flex flex-col items-center justify-center',
                        isMatched ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      )}
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                      }}
                    >
                      {card.imageUrl && (
                        <img
                          src={card.imageUrl}
                          alt={card.text || 'Card image'}
                          className="max-w-full max-h-24 object-contain mb-2"
                        />
                      )}
                      {card.text && (
                        <p className="text-center font-semibold text-gray-800 text-sm line-clamp-3">
                          {card.text}
                        </p>
                      )}
                      {isMatched && (
                        <div className="absolute top-2 right-2">
                          <span className="text-2xl">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}