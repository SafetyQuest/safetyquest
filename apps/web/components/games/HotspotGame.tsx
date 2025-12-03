// apps/web/components/games/HotspotGame.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import clsx from 'clsx';

type Hotspot = {
  x: number;
  y: number;
  radius: number;
  label: string;
  xp?: number;
  points?: number;
};

type HotspotConfig = {
  instruction: string;
  imageUrl: string;
  hotspots: Hotspot[];
  totalXp?: number;
  totalPoints?: number;
};

type HotspotGameProps = {
  config: HotspotConfig;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: { correct: number; total: number; earnedXp?: number; earnedPoints?: number }) => void;
};

export default function HotspotGame({ config, mode, onComplete }: HotspotGameProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const [foundHotspots, setFoundHotspots] = useState<Set<number>>(new Set());
  const [showFeedback, setShowFeedback] = useState<{ index: number; correct: boolean } | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const totalHotspots = config.hotspots.length;
  const foundCount = foundHotspots.size;
  const isQuizMode = mode === 'quiz';
  const rewardPerHotspot = isQuizMode
    ? config.hotspots[0]?.points || 10
    : config.hotspots[0]?.xp || 10;

  // Check if click is inside a hotspot (with tolerance based on radius)
  const checkHit = useCallback((e: React.MouseEvent<HTMLDivElement>, hotspot: Hotspot, index: number) => {
    if (foundHotspots.has(index) || isCompleted) return false;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    const distance = Math.sqrt(
      Math.pow(clickX - hotspot.x, 2) + Math.pow(clickY - hotspot.y, 2)
    );

    return distance <= hotspot.radius;
  }, [foundHotspots, isCompleted]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'preview' || isCompleted) return;

    let hitIndex = -1;
    for (let i = 0; i < config.hotspots.length; i++) {
      if (!foundHotspots.has(i) && checkHit(e, config.hotspots[i], i)) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex !== -1) {
      setFoundHotspots(prev => new Set(prev).add(hitIndex));
      setShowFeedback({ index: hitIndex, correct: true });

      // Confetti celebration
      confetti({
        particleCount: 30,
        spread: 60,
        origin: {
          x: (config.hotspots[hitIndex].x + 10) / 100,
          y: (config.hotspots[hitIndex].y + 10) / 100,
        },
        colors: ['#10b981', '#34d399', '#86efac'],
        scalar: 0.8,
      });

      // Auto-hide feedback
      setTimeout(() => setShowFeedback(null), 1200);
    } else if (mode === 'quiz') {
      // Wrong click penalty feedback (optional)
      setShowFeedback({ index: -1, correct: false });
      setTimeout(() => setShowFeedback(null), 800);
    }
  };

  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;
  
    const updateSize = () => {
      setDimensions({
        width: img.clientWidth,
        height: img.clientHeight,
      });
    };
  
    // Initial + load + resize
    if (img.complete && img.naturalWidth > 0) {
      updateSize();
    }
  
    img.addEventListener('load', updateSize);
    window.addEventListener('resize', updateSize);
  
    return () => {
      img.removeEventListener('load', updateSize);
      window.removeEventListener('resize', updateSize);
    };
  }, [config.imageUrl]);

  // Auto-complete when all found
  useEffect(() => {
    if (foundCount === totalHotspots && totalHotspots > 0 && !isCompleted) {
      setIsCompleted(true);
      const earned = foundCount * rewardPerHotspot;
      onComplete?.({
        correct: foundCount,
        total: totalHotspots,
        ...(isQuizMode ? { earnedPoints: earned } : { earnedXp: earned }),
      });
    }
  }, [foundCount, totalHotspots, rewardPerHotspot, isQuizMode, onComplete, isCompleted]);

  const progress = totalHotspots > 0 ? (foundCount / totalHotspots) * 100 : 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {config.instruction || 'Click on all the highlighted areas'}
        </h3>

        {/* Progress */}
        {mode !== 'preview' && totalHotspots > 0 && (
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{foundCount} / {totalHotspots}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            </div>
            {isCompleted && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-lg font-bold text-green-600"
              >
                Completed! +{foundCount * rewardPerHotspot} {isQuizMode ? 'Points' : 'XP'}
              </motion.p>
            )}
          </div>
        )}
      </div>

      {/* Image Container */}
      <div
        className={clsx(
          "relative overflow-hidden rounded-xl shadow-2xl cursor-crosshair select-none",
          mode === 'preview' ? "cursor-default" : "hover:ring-4 hover:ring-blue-300 transition-all"
        )}
        onClick={handleImageClick}
      >
        <div  className="relative">
        <img
          ref={imageRef}
          src={config.imageUrl}
          alt="Hotspot game"
          className="w-full h-auto block"
          draggable={false}
        />

        {/* Hotspots Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {config.hotspots.map((hotspot, index) => {
            const isFound = foundHotspots.has(index);
            const referenceSize = Math.min(dimensions.width, dimensions.height);
            const pixelRadius = referenceSize > 0 ? (hotspot.radius / 100) * referenceSize : 50;

            return (
              <motion.div
                key={index}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${hotspot.x}%`,
                  top: `${hotspot.y}%`,
                  width: `${pixelRadius * 2}px`,
                  height: `${pixelRadius * 2}px`,
                }}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: isFound ? 1.4 : 1,
                  opacity: isFound ? 1 : (mode === 'preview' ? 0.6 : 0.3),
                }}
                transition={{ duration: 0.4 }}
              >
                {/* Pulsing Ring (unfound) */}
                {!isFound && mode === 'lesson' && (
                    <motion.div
                        className="absolute inset-0 rounded-full border-2 border-red-400/20"
                        animate={{
                        scale: [1, 1.15, 1],
                        opacity: [0.15, 0.05, 0.15],
                        }}
                        transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                        }}
                    />
                )}

                {/* Found Effect */}
                <AnimatePresence>
                  {isFound && (
                    <motion.div
                      initial={{ scale: 0, opacity: 1 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      exit={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 0.8 }}
                      className="absolute inset-0 rounded-full bg-green-400/60"
                    />
                  )}
                </AnimatePresence>

                {/* Center Dot */}
                <div
                  className={clsx(
                    "w-full h-full rounded-full border-4 shadow-lg",
                    isFound
                    ? "bg-green-500 border-green-600"
                    : mode === 'preview'
                    ? "bg-blue-500/70 border-blue-600"
                    : mode === 'lesson'
                    ? "bg-transparent border-transparent"   // ← invisible until found
                    : "bg-transparent border-transparent"   // ← quiz: completely hidden
                  )}
                />

                {/* Label (only in preview or when found) */}
                {(mode === 'preview' || isFound) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-xs px-3 py-1 rounded-full"
                  >
                    {hotspot.label}
                    {isFound && " ✓"}
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
        </div>

        {/* Feedback Overlay */}
        <AnimatePresence>
          {showFeedback && showFeedback.correct && showFeedback.index !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-green-500 text-white font-bold text-4xl px-8 py-4 rounded-full shadow-2xl">
                +{isQuizMode ? config.hotspots[showFeedback.index].points : config.hotspots[showFeedback.index].xp}
              </div>
            </motion.div>
          )}
          {showFeedback && !showFeedback.correct && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-red-500 text-white font-bold text-3xl px-6 py-3 rounded-full">
                Try again!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Debug / Preview Info */}
      {mode === 'preview' && (
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Preview Mode • {totalHotspots} hotspot{totalHotspots !== 1 ? 's' : ''} defined</p>
          <p className="mt-1">Total reward: {config.totalXp || config.totalPoints} {isQuizMode ? 'points' : 'XP'}</p>
        </div>
      )}
    </div>
  );
}