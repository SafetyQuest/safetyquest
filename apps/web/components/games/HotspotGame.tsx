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
  onComplete?: (result: { correct: number; total: number; earnedXp?: number; earnedPoints?: number; userActions?: any }) => void;
  previousState?: any | null;  // ✅ NEW
};

type UserMark = {
  id: number;
  x: number;
  y: number;
  matchedHotspotIndex?: number; // Set after submission
};

export default function HotspotGame({ config, mode, onComplete, previousState }: HotspotGameProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // New state for mark-and-submit approach
  const [userMarks, setUserMarks] = useState<UserMark[]>(
    previousState?.userActions?.marks ?? []  // ✅ Load previous marks
  );
  const [isSubmitted, setIsSubmitted] = useState(!!previousState);  // ✅ If has previous state, show as submitted
  const [showResults, setShowResults] = useState(!!previousState);
  const [markIdCounter, setMarkIdCounter] = useState(0);

  const totalHotspots = config.hotspots.length;
  const maxAttempts = totalHotspots;
  const remainingAttempts = maxAttempts - userMarks.length;
  const isQuizMode = mode === 'quiz';
  const rewardPerHotspot = isQuizMode
    ? config.hotspots[0]?.points || 10
    : config.hotspots[0]?.xp || 10;

  // Check if a mark position matches a hotspot
  const findMatchingHotspot = useCallback((markX: number, markY: number): number => {
    for (let i = 0; i < config.hotspots.length; i++) {
      const hotspot = config.hotspots[i];
      const distance = Math.sqrt(
        Math.pow(markX - hotspot.x, 2) + Math.pow(markY - hotspot.y, 2)
      );
      if (distance <= hotspot.radius) {
        return i;
      }
    }
    return -1;
  }, [config.hotspots]);

  // Handle image click to place mark
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode === 'preview' || isSubmitted || userMarks.length >= maxAttempts) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    // Add new mark
    const newMark: UserMark = {
      id: markIdCounter,
      x: clickX,
      y: clickY,
    };

    setUserMarks(prev => [...prev, newMark]);
    setMarkIdCounter(prev => prev + 1);
  };

  // Remove a specific mark
  const handleRemoveMark = (markId: number) => {
    if (isSubmitted) return;
    setUserMarks(prev => prev.filter(mark => mark.id !== markId));
  };

  // Try again functionality for lesson mode
  const handleTryAgain = () => {
    setUserMarks([]);
    setIsSubmitted(false);
    setShowResults(false);
  };

  // Submit and evaluate all marks
  const handleSubmit = () => {
    if (userMarks.length === 0 || isSubmitted) return;

    // Evaluate each mark
    const evaluatedMarks = userMarks.map(mark => {
      const matchedIndex = findMatchingHotspot(mark.x, mark.y);
      return {
        ...mark,
        matchedHotspotIndex: matchedIndex >= 0 ? matchedIndex : undefined,
      };
    });

    // Find unique correctly matched hotspots
    const matchedHotspotIndices = new Set(
      evaluatedMarks
        .map(m => m.matchedHotspotIndex)
        .filter(idx => idx !== undefined) as number[]
    );

    const correctCount = matchedHotspotIndices.size;
    const earnedReward = correctCount * rewardPerHotspot;

    setUserMarks(evaluatedMarks);
    setIsSubmitted(true);

    // Quiz mode: just submit without feedback
    if (isQuizMode) {
      onComplete?.({
        correct: correctCount,
        total: totalHotspots,
        earnedPoints: earnedReward,
        userActions: { marks: evaluatedMarks },
      });
      return;
    }

    // Lesson mode: show results after a brief delay
    setTimeout(() => {
      setShowResults(true);

      // Trigger confetti for correct answers
      if (correctCount > 0) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#86efac'],
        });
      }

      // Call completion callback
      setTimeout(() => {
        onComplete?.({
          correct: correctCount,
          total: totalHotspots,
          earnedXp: earnedReward,
          userActions: { marks: evaluatedMarks },
        });
      }, 1500);
    }, 300);
  };

  // Update dimensions when image loads or resizes
  useEffect(() => {
    const img = imageRef.current;
    if (!img) return;

    const updateSize = () => {
      setDimensions({
        width: img.clientWidth,
        height: img.clientHeight,
      });
    };

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
              <span className="text-3xl font-bold text-blue-500">?</span>
            </motion.div>
            
            {/* Tooltip */}
            <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="leading-relaxed">{config.instruction || 'Mark all the safety hazards'}</p>
              <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>

          {/* Center: Attempts Counter (if not submitted and not preview) */}
          {mode !== 'preview' && !isSubmitted && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Attempts:</span>
              <span className={clsx(
                "font-bold text-lg",
                remainingAttempts === 0 ? "text-red-600" : "text-gray-800"
              )}>
                {userMarks.length} / {maxAttempts}
              </span>
            </div>
          )}

          {/* Center: Results (lesson mode, after submission) */}
          {!isQuizMode && isSubmitted && showResults && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200"
            >
              <span className="text-lg font-bold text-green-600">
                {userMarks.filter(m => m.matchedHotspotIndex !== undefined).length} / {totalHotspots}
              </span>
              <span className="text-sm text-gray-600">•</span>
              <span className="text-lg font-semibold text-gray-700">
                +{userMarks.filter(m => m.matchedHotspotIndex !== undefined).length * rewardPerHotspot} XP
              </span>
            </motion.div>
          )}

          {/* Right: Submit Button (if not submitted and not preview) */}
          {mode !== 'preview' && !isSubmitted && (
            <motion.button
              onClick={handleSubmit}
              disabled={userMarks.length === 0}
              className={clsx(
                "px-6 py-2 rounded-lg font-semibold text-white shadow-lg transition-all",
                userMarks.length === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              )}
              whileHover={userMarks.length > 0 ? { scale: 1.05 } : {}}
              whileTap={userMarks.length > 0 ? { scale: 0.95 } : {}}
            >
              Submit
            </motion.button>
          )}

          {/* Right: Try Again Button (lesson mode, after submission) */}
          {mode === 'lesson' && isSubmitted && showResults && (
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

          {/* Preview Mode Info */}
          {mode === 'preview' && (
            <div className="text-sm text-gray-500">
              Preview • {totalHotspots} hotspot{totalHotspots !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Image Container */}
      <div className="flex justify-center">
        <div
          className={clsx(
            "relative overflow-hidden rounded-xl shadow-2xl select-none inline-block",
            mode === 'preview' 
              ? "cursor-default" 
              : isSubmitted 
              ? "cursor-default"
              : userMarks.length >= maxAttempts
              ? "cursor-not-allowed"
              : "cursor-crosshair hover:ring-4 hover:ring-blue-300 transition-all"
          )}
          onClick={handleImageClick}
        >
          <div className="relative">
            <img
              ref={imageRef}
              src={config.imageUrl}
              alt="Hotspot game"
              className="h-auto w-auto block"
              style={{ maxHeight: '80vh' }}
              draggable={false}
            />

          {/* Hotspots Overlay (Preview mode OR Lesson mode after submission) */}
          {(mode === 'preview' || (!isQuizMode && isSubmitted && showResults)) && (
            <div className="absolute inset-0 pointer-events-none">
              {config.hotspots.map((hotspot, index) => {
                const referenceSize = Math.min(dimensions.width, dimensions.height);
                const pixelRadius = referenceSize > 0 ? (hotspot.radius / 100) * referenceSize : 50;
                const wasMatched = isSubmitted && userMarks.some(m => m.matchedHotspotIndex === index);

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
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    {/* Hotspot Circle */}
                    <div
                      className={clsx(
                        "w-full h-full rounded-full border-4 shadow-lg",
                        mode === 'preview'
                          ? "bg-blue-500/70 border-blue-600"
                          : wasMatched
                          ? "bg-green-500/70 border-green-600"
                          : "bg-yellow-500/70 border-yellow-600"
                      )}
                    />

                    {/* Label */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={clsx(
                        "absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-white text-xs px-3 py-1 rounded-full",
                        mode === 'preview'
                          ? "bg-black/80"
                          : wasMatched
                          ? "bg-green-600"
                          : "bg-yellow-600"
                      )}
                    >
                      {hotspot.label}
                      {wasMatched && " ✓"}
                      {isSubmitted && !wasMatched && " (Missed)"}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* User Marks (Cross markers) */}
          <div className="absolute inset-0 pointer-events-none">
            {userMarks.map((mark, idx) => {
              const isCorrect = mark.matchedHotspotIndex !== undefined;
              const showAsCorrect = !isQuizMode && isSubmitted && isCorrect;
              const showAsIncorrect = !isQuizMode && isSubmitted && !isCorrect;

              return (
                <motion.div
                  key={mark.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${mark.x}%`,
                    top: `${mark.y}%`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Cross/Check Mark */}
                  <div className="relative w-10 h-10 flex items-center justify-center">
                    {/* Background circle */}
                    <div
                      className={clsx(
                        "absolute inset-0 rounded-full",
                        !isSubmitted && "bg-red-500 shadow-lg",
                        showAsCorrect && "bg-green-500 shadow-lg",
                        showAsIncorrect && "bg-red-600 shadow-lg",
                        isQuizMode && isSubmitted && "bg-gray-400 shadow-lg"
                      )}
                    />
                    
                    {/* Icon */}
                    <span className="relative z-10 text-white text-2xl font-bold">
                      {!isSubmitted && "✕"}
                      {showAsCorrect && "✓"}
                      {showAsIncorrect && "✕"}
                      {isQuizMode && isSubmitted && "✕"}
                    </span>

                    {/* Remove button (before submission) */}
                    {!isSubmitted && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMark(mark.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:bg-red-100 hover:text-red-600 transition-colors pointer-events-auto z-20"
                        title="Remove mark"
                      >
                        <span className="text-xs">×</span>
                      </button>
                    )}
                  </div>

                  {/* Mark number label (before submission) */}
                  {!isSubmitted && (
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                      Mark {idx + 1}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}