// apps/web/components/games/MemoryFlipGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import GameResultCard from './GameResultCard';

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
    userActions?: any;  // ✅ NEW
  }) => void;
  previousState?: any | null;
};

export default function MemoryFlipGame({ config, mode, onComplete, previousState }: Props) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

// ✅ NEW: Initialize from previousState if available
const [gameState, setGameState] = useState<'playing' | 'complete'>(
  previousState ? 'complete' : 'playing'
);
const [shuffled, setShuffled] = useState<MemoryFlipCard[]>([]);
const [revealed, setRevealed] = useState<Set<string>>(new Set());
const [matched, setMatched] = useState<Set<string>>(() => {
  // ✅ Load previously matched cards
  if (!previousState?.userActions?.matches) return new Set();
  // matches is an array of matched card IDs
  return new Set(previousState.userActions.matches);
});
const [mistakes, setMistakes] = useState(
  previousState?.userActions?.mistakes ?? 0  // ✅ Load previous mistakes
);
const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds);
const [startTime, setStartTime] = useState<number | null>(null);

// ✅ NEW: Track matched pairs for persistence (separate from matched Set)
const [matchedPairIds, setMatchedPairIds] = useState<string[]>(
  previousState?.userActions?.matches ?? []
);

// ✅ NEW: Store result data for GameResultCard
const [resultData, setResultData] = useState<any>(
  previousState ? {
    success: previousState.result?.success ?? false,
    earnedXp: previousState.result?.earnedXp,
    earnedPoints: previousState.result?.earnedPoints,
    mistakes: previousState.userActions?.mistakes ?? 0,
    timeSpent: previousState.result?.timeSpent ?? 0,
    matches: previousState.userActions?.matches?.length / 2 ?? 0, // Divide by 2 since each match has 2 cards
  } : null
);

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
        
        // ✅ Store result data for GameResultCard
        const resultPayload = {
          success: false,
          earnedXp: isQuiz ? undefined : 0,
          earnedPoints: isQuiz ? 0 : undefined,
          mistakes,
          timeSpent: config.timeLimitSeconds,
          matches: matched.size / 2, // Use matched.size directly (each match = 2 cards)
        };
        
        setResultData(resultPayload);
        
        onComplete?.({
          ...resultPayload,
          userActions: { matches: matchedPairIds, mistakes },
        });
      }
    }, 100);

    return () => clearInterval(id);
  }, [gameState, startTime, config.timeLimitSeconds, mistakes, matched, matchedPairIds, isQuiz, isPreview, onComplete]);

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

      // ✅ Store result data for GameResultCard
      const resultPayload = {
        success: true,
        earnedXp: isQuiz ? undefined : reward,
        earnedPoints: isQuiz ? reward : undefined,
        mistakes,
        timeSpent,
        matches: config.pairs.length,
      };
      
      setResultData(resultPayload);

      setTimeout(() => {
        onComplete?.({
          ...resultPayload,
          userActions: { matches: matchedPairIds, mistakes },
        });
      }, 1500);
    }
  }, [matched.size, config.cards.length, gameState, mistakes, perfectReward, baseReward, startTime, isQuiz, matchedPairIds, onComplete]);

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
        setMatchedPairIds(prev => [...prev, a, b]);  // ✅ NEW: Track for persistence
        setRevealed(new Set());
      } else {
        // No match
        setMistakes(m => m + 1);
        setTimeout(() => setRevealed(new Set()), 1000);
      }
    }
  }, [gameState, revealed, matched, isPreview, config.pairs]);

  const handleTryAgain = () => {
    const shuffledCards = shuffleCards(config.cards);
    setShuffled(shuffledCards);
    setRevealed(new Set());
    setMatched(new Set());
    setMatchedPairIds([]);
    setMistakes(0);
    setTimeLeft(config.timeLimitSeconds);
    setStartTime(Date.now());
    setGameState('playing');
    setResultData(null); // ✅ Clear result data
  };

  // Calculate grid layout - adaptive for even cards, max 6 rows
  const getGridLayout = (totalCards: number) => {
    // Try to find best layout keeping rows ≤ 6
    for (let rows = 2; rows <= 6; rows++) {
      if (totalCards % rows === 0) {
        const cols = totalCards / rows;
        if (cols <= 6) {
          return { rows, cols };
        }
      }
    }
    // Fallback: 6 rows
    return { rows: 6, cols: Math.ceil(totalCards / 6) };
  };

  const { rows, cols } = getGridLayout(config.cards.length);

  // Format time
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-4xl mx-auto">
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
              <span className="text-3xl font-bold text-purple-500">?</span>
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">{config.instruction}</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Stats (if playing and not preview) */}
          {!isPreview && gameState === 'playing' && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-lg border border-purple-200">
                <span className="text-lg">⏱️</span>
                <span className={clsx(
                  'text-sm font-bold',
                  timeLeft <= 10 ? 'text-red-600 animate-pulse' : 'text-purple-600'
                )}>
                  {formatTime(timeLeft)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-red-50 rounded-lg border border-red-200">
                <span className="text-lg">❌</span>
                <span className="text-sm font-bold text-red-600">{mistakes}</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                <span className="text-lg">✅</span>
                <span className="text-sm font-bold text-green-600">{matched.size / 2}/{config.pairs.length}</span>
              </div>
            </div>
          )}

          {/* Preview Mode Info */}
          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • Click cards to flip
            </div>
          )}
        </div>
      </div>

      {/* Card Grid - Centered with medium-sized cards */}
      <div
        className="grid gap-2 mx-auto"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          maxWidth: `${cols * 100}px`, // 100px per card including gap
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
                style={{ aspectRatio: '1 / 1' }}
              >
                <div
                  onClick={() => handleClick(card.id)}
                  className={clsx(
                    'flip-card h-full rounded cursor-pointer transition-all',
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
                      className="flip-card-front absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-md flex items-center justify-center"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-white text-3xl font-bold">?</span>
                    </div>

                    {/* Back (card content) */}
                    <div
                      className={clsx(
                        'flip-card-back absolute w-full h-full bg-white border rounded-md p-2 flex flex-col items-center justify-center',
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
                          className="max-w-full max-h-10 object-contain mb-1"
                        />
                      )}
                      {card.text && (
                        <p className="text-center font-medium text-gray-800 text-[10px] leading-tight line-clamp-2">
                          {card.text}
                        </p>
                      )}
                      {isMatched && (
                        <div className="absolute top-1 right-1">
                          <span className="text-base">✓</span>
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

      {/* ✅ Game Result Card */}
      {resultData && (
        <GameResultCard
          mode={mode}
          success={resultData.success}
          metrics={{
            matches: resultData.matches,
            mistakes: resultData.mistakes,
            timeSpent: resultData.timeSpent, // This game IS time-dependent
            xpEarned: resultData.earnedXp,
            pointsEarned: resultData.earnedPoints,
          }}
          onTryAgain={handleTryAgain}
        />
      )}

      <style jsx>{`
        .flip-card-inner.flipped {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}