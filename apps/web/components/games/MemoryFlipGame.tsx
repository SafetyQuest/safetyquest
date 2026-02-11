// apps/web/components/games/MemoryFlipGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';
import GameResultCard from './shared/GameResultCard';
import MemoryFlipResultsCard from './shared/MemoryFlipResultsCard';
import { calculateTimerPhase, TimerState } from './utils/timerUtils';

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
    userActions?: any;
  }) => void;
  previousState?: any | null;
  onTimerUpdate?: (state: TimerState | null) => void;
};

export default function MemoryFlipGame({ config, mode, onComplete, previousState, onTimerUpdate }: Props) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  // Calculate initial grid layout
  const getGridLayout = (totalCards: number, screenWidth: number) => {
    // Mobile: ALWAYS 3 columns, Desktop: ALWAYS 6 columns
    const cols = screenWidth < 768 ? 3 : 6;
    const rows = Math.ceil(totalCards / cols);
    
    return { rows, cols };
  };

  const [gridLayout, setGridLayout] = useState(() => 
    getGridLayout(config.cards.length, typeof window !== 'undefined' ? window.innerWidth : 1024)
  );

const [gameState, setGameState] = useState<'playing' | 'complete'>(
  previousState ? 'complete' : 'playing'
);
const [shuffled, setShuffled] = useState<MemoryFlipCard[]>([]);
const [revealed, setRevealed] = useState<Set<string>>(new Set());
const [matched, setMatched] = useState<Set<string>>(() => {
  if (!previousState?.userActions?.matches) return new Set();
  return new Set(previousState.userActions.matches);
});
const [mistakes, setMistakes] = useState(
  previousState?.userActions?.mistakes ?? 0
);
const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds);
const [startTime, setStartTime] = useState<number | null>(null);

const [matchedPairIds, setMatchedPairIds] = useState<string[]>(
  previousState?.userActions?.matches ?? []
);

const [resultData, setResultData] = useState<any>(
  previousState ? {
    success: previousState.result?.success ?? false,
    earnedXp: previousState.result?.earnedXp,
    earnedPoints: previousState.result?.earnedPoints,
    mistakes: previousState.userActions?.mistakes ?? 0,
    timeSpent: previousState.result?.timeSpent ?? 0,
    matches: previousState.userActions?.matches?.length / 2 ?? 0,
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

  const shuffleCards = useCallback((cards: MemoryFlipCard[]) => {
    const copy = [...cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, []);

  useEffect(() => {
    const shuffledCards = shuffleCards(config.cards);
    setShuffled(shuffledCards);
    if (!isPreview) {
      setStartTime(Date.now());
    }
    
    // Handle window resize
    const handleResize = () => {
      setGridLayout(getGridLayout(config.cards.length, window.innerWidth));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gameState !== 'playing' || !startTime || isPreview) return;

    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, config.timeLimitSeconds - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        setGameState('complete');
        
        const resultPayload = {
          success: false,
          earnedXp: isQuiz ? undefined : 0,
          earnedPoints: isQuiz ? 0 : undefined,
          mistakes,
          timeSpent: config.timeLimitSeconds,
          matches: matched.size / 2,
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

  useEffect(() => {
    if (isPreview || gameState !== 'playing' || !startTime) {
      onTimerUpdate?.(null);
      return;
    }

    const timerPhase = calculateTimerPhase(timeLeft);
    onTimerUpdate?.({
      timeRemaining: timeLeft,
      timeLimit: config.timeLimitSeconds,
      timerPhase,
    });

    return () => {
      onTimerUpdate?.(null);
    };
  }, [timeLeft, isPreview, gameState, startTime, config.timeLimitSeconds, onTimerUpdate]);

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
  }, [matched.size, config.cards.length, gameState, mistakes, perfectReward, baseReward, startTime, isQuiz, matchedPairIds, config.pairs.length, onComplete]);

  const handleClick = useCallback((id: string) => {
    if (gameState !== 'playing') return;
    if (matched.has(id)) return;

    if (isPreview) {
      setRevealed(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }

    if (revealed.size >= 2) return;

    const newRevealed = new Set(revealed).add(id);
    setRevealed(newRevealed);

    if (newRevealed.size === 2) {
      const [a, b] = Array.from(newRevealed);
      const isMatch = config.pairs.some(
        p => (p.leftId === a && p.rightId === b) || (p.leftId === b && p.rightId === a)
      );

      if (isMatch) {
        setMatched(prev => new Set([...prev, a, b]));
        setMatchedPairIds(prev => [...prev, a, b]);
        setRevealed(new Set());
      } else {
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
    setResultData(null);
  };

  const { rows, cols } = gridLayout;

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
      {/* Responsive Header */}
      <div className="mb-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Mobile Layout - Stacked */}
          <div className="md:hidden">
            {/* Top Row: Stats (if playing) */}
            {!isPreview && gameState === 'playing' && (
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 rounded-lg border border-red-200">
                  <span className="text-base">❌</span>
                  <span className="text-xs font-bold text-red-600">{mistakes}</span>
                </div>
                
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-base">✅</span>
                  <span className="text-xs font-bold text-green-600">{matched.size / 2}/{config.pairs.length}</span>
                </div>
              </div>
            )}
            
            {/* Bottom Row: Info Icon + Preview Info */}
            <div className="px-4 py-2 flex items-center justify-between">
              {/* Left: Info Icon */}
              <div className="relative group">
                <motion.div
                  className="w-7 h-7 flex items-center justify-center cursor-help"
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
                  <span className="text-2xl font-bold text-purple-500">?</span>
                </motion.div>
                
                <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <p className="leading-relaxed">
                    <span className="sm:hidden">Match all pairs before time runs out!</span>
                    <span className="hidden sm:inline">{config.instruction}</span>
                  </p>
                  <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
                </div>
              </div>

              {/* Right: Preview Info */}
              {mode === 'preview' && (
                <div className="text-xs text-gray-500">
                  Memory Game
                </div>
              )}
            </div>
          </div>

          {/* Desktop Layout - Horizontal */}
          <div className="hidden md:flex items-center justify-between px-4 py-3">
            {/* Left: Info Icon */}
            <div className="relative group w-8 flex-shrink-0">
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
              
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <p className="leading-relaxed">{config.instruction}</p>
                <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
              </div>
            </div>

            {/* Center: Stats (if playing and not preview) */}
            {!isPreview && gameState === 'playing' && (
              <div className="flex items-center gap-4 flex-1 justify-center">              
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

            {/* Right: Preview Info */}
            <div className="flex-shrink-0 min-w-[120px] text-right">
              {mode === 'preview' && (
                <div className="text-sm text-gray-500">
                  Preview • Click cards to flip
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Grid - Responsive sizing that fits screen */}
      <div
        className="grid gap-2 sm:gap-3 md:gap-4 w-full"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`, // Equal columns that fit within container
          maxWidth: '100%',
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
                    'flip-card h-full rounded-lg cursor-pointer transition-all',
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
                      className="flip-card-front absolute w-full h-full bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg"
                      style={{ backfaceVisibility: 'hidden' }}
                    >
                      <span className="text-white text-4xl md:text-5xl font-bold">?</span>
                    </div>

                    {/* Back (card content) */}
                    <div
                      className={clsx(
                        'flip-card-back absolute w-full h-full bg-white border-2 rounded-lg p-3 md:p-4 flex flex-col items-center justify-center shadow-lg',
                        isMatched ? 'border-green-500 bg-green-50' : 'border-gray-300'
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
                          className="max-w-full max-h-24 md:max-h-32 object-contain mb-2"
                        />
                      )}
                      {card.text && (
                        <p className="text-center font-semibold text-gray-800 text-xs md:text-sm leading-tight line-clamp-3">
                          {card.text}
                        </p>
                      )}
                      {isMatched && (
                        <div className="absolute top-2 right-2">
                          <span className="text-lg md:text-xl">✓</span>
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

      {resultData && (
        <MemoryFlipResultsCard
          success={resultData.success}
          matches={resultData.matches}
          totalPairs={config.pairs.length}
          mistakes={resultData.mistakes}
          timeSpent={resultData.timeSpent}
          timeLimit={config.timeLimitSeconds}
          earnedXp={resultData.earnedXp}
          earnedPoints={resultData.earnedPoints}
          mode={mode}
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