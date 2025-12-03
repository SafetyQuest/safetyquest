// apps/web/components/games/MemoryFlipPlayer.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export type MemoryFlipCard = { id: string; text?: string; imageUrl?: string };
export type MemoryFlipPair = { leftId: string; rightId: string; xp: number; points?: number };
export type MemoryFlipGameConfig = {
  instruction: string;
  cards: MemoryFlipCard[];
  pairs: MemoryFlipPair[];
  timeLimitSeconds: number;
  perfectGameMultiplier: number;
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

export default function MemoryFlipPlayer({ config, mode, onComplete }: Props) {
  const isPreview = mode === 'preview';
  const isQuiz = mode === 'quiz';

  const [shuffled, setShuffled] = useState<MemoryFlipCard[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [timeLeft, setTimeLeft] = useState(config.timeLimitSeconds);
  const [startTime, setStartTime] = useState<number | null>(null);

  const baseReward = config.pairs.reduce((s, p) => s + (isQuiz ? (p.points || p.xp) : p.xp), 0);
  const perfectReward = baseReward * config.perfectGameMultiplier;

  // Shuffle once on mount
  useEffect(() => {
    const copy = [...config.cards];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    setShuffled(copy);
    if (!isPreview) setStartTime(Date.now());
  }, [config.cards, isPreview]);

  // Timer (only in real mode)
  useEffect(() => {
    if (isPreview || !startTime) return;
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, config.timeLimitSeconds - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
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
  }, [startTime, config.timeLimitSeconds, mistakes, isQuiz, isPreview, onComplete]);

  const handleClick = (id: string) => {
    if (matched.has(id)) return;

    if (isPreview) {
      // In preview: just flip on click — no logic
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

    if (newRevealed.size === 2) {
      const [a, b] = Array.from(newRevealed);
      const isMatch = config.pairs.some(
        p => (p.leftId === a && p.rightId === b) || (p.leftId === b && p.rightId === a)
      );

      if (isMatch) {
        setMatched(prev => new Set(prev).add(a).add(b));
        setRevealed(new Set());

        if (matched.size + 2 === config.cards.length) {
          const timeSpent = Math.round((Date.now() - (startTime || Date.now())) / 1000);
          const reward = mistakes === 0 ? perfectReward : baseReward;
          onComplete?.({
            success: true,
            earnedXp: isQuiz ? undefined : reward,
            earnedPoints: isQuiz ? reward : undefined,
            mistakes,
            timeSpent,
          });
        }
      } else {
        setMistakes(m => m + 1);
        setRevealed(newRevealed);
        setTimeout(() => setRevealed(new Set()), 1000);
      }
    } else {
      setRevealed(newRevealed);
    }
  };

  const cols = Math.ceil(Math.sqrt(config.cards.length));
  const rows = Math.ceil(config.cards.length / cols);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">

      {/* Preview Header */}
      {isPreview && (
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Memory Flip Game</h2>
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 mb-8">
            <p className="text-xl leading-relaxed text-gray-800 font-medium">{config.instruction}</p>
          </div>
          <div className="inline-block px-8 py-3 bg-purple-100 text-purple-700 rounded-full text-lg font-medium">
            Preview Mode — Click cards to test
          </div>
        </div>
      )}

      {/* Real Game HUD */}
      {!isPreview && (
        <div className="flex justify-between items-center mb-8 bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-4"><span className="text-4xl">Timer</span> <span className="text-3xl font-bold">{fmt(timeLeft)}</span></div>
          <div className="flex items-center gap-4"><span className="text-4xl">Mistakes</span> <span className="text-3xl font-bold text-red-600">{mistakes}</span></div>
          <div className="flex items-center gap-4"><span className="text-4xl">Progress</span> <span className="text-3xl font-bold text-green-600">{matched.size / 2} / {config.pairs.length}</span></div>
        </div>
      )}

      {/* Card Grid */}
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(140px, 1fr))`,
        }}
      >
        {shuffled.map(card => {
          const isRev = isPreview ? revealed.has(card.id) : revealed.has(card.id);
          const isMat = matched.has(card.id);

          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                onClick={() => handleClick(card.id)}
                className={clsx(
                  'flip-card h-full rounded-2xl shadow-xl cursor-pointer transition-all',
                  isMat && 'pointer-events-none'
                )}
              >
                <div className={clsx('flip-card-inner h-full', (isRev || isMat) && 'flipped')}>
                  <div className="flip-card-front bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-6xl font-bold">?</span>
                  </div>
                  <div className="flip-card-back bg-white border-4 border-gray-200 rounded-2xl p-5 flex flex-col items-center justify-center">
                    {card.imageUrl && <img src={card.imageUrl} alt="" className="max-w-full max-h-28 object-contain mb-3" />}
                    {card.text && <p className="text-xl font-semibold text-gray-800 text-center">{card.text}</p>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <style jsx>{`
        .flip-card { perspective: 1000px; }
        .flip-card-inner { position: relative; w-full h-full; transform-style: preserve-3d; transition: transform 0.65s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        .flip-card-inner.flipped { transform: rotateY(180deg); }
        .flip-card-front, .flip-card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 1.5rem; }
        .flip-card-back { transform: rotateY(180deg); }
        .flip-card.matched .flip-card-inner { animation: pulse 0.6s; }
        @keyframes pulse { 0%,100% { transform: rotateY(180deg) scale(1); } 50% { transform: rotateY(180deg) scale(1.08); } }
      `}</style>
    </div>
  );
}