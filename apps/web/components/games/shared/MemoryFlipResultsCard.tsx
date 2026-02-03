// apps/web/components/games/shared/MemoryFlipResultsCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

type MemoryFlipResultsCardProps = {
  success: boolean;
  matches: number;
  totalPairs: number;
  mistakes: number;
  timeSpent: number;
  timeLimit: number;
  earnedXp?: number;
  earnedPoints?: number;
  mode: 'lesson' | 'quiz';
  onTryAgain?: () => void;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MemoryFlipResultsCard({
  success,
  matches,
  totalPairs,
  mistakes,
  timeSpent,
  timeLimit,
  earnedXp,
  earnedPoints,
  mode,
  onTryAgain,
}: MemoryFlipResultsCardProps) {
  const isQuiz = mode === 'quiz';
  const isPerfect = success && mistakes === 0;

  const bgColor = success 
    ? 'bg-gradient-to-br from-[var(--success-light)] to-[var(--surface)]'
    : 'bg-gradient-to-br from-[var(--danger-light)] to-[var(--surface)]';
  
  const borderColor = success
    ? 'border-[var(--success)]'
    : 'border-[var(--danger)]';

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={clsx(
        'max-w-3xl mx-auto mt-6 rounded-xl overflow-hidden',
        'border-2 shadow-xl',
        bgColor,
        borderColor
      )}
    >
      {/* ========== HEADER ========== */}
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {success ? (isPerfect ? '🌟' : '🎯') : '⏱️'}
            </span>
            <div>
              <h3 className="text-[var(--text-base)] font-bold text-white">
                {success 
                  ? (isPerfect ? 'Perfect Game!' : 'Complete!') 
                  : "Time's Up!"}
              </h3>
              <p className="text-[var(--text-xs)] text-white/80 mt-0.5">
                {success 
                  ? (isPerfect ? 'Zero mistakes - amazing memory!' : 'All pairs matched!') 
                  : 'Try again to beat the clock'}
              </p>
            </div>
          </div>
          
          {onTryAgain && (
            <motion.button
              onClick={onTryAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 rounded-md text-[var(--text-xs)] font-medium text-white"
              style={{ background: 'var(--primary-light)' }}
            >
              Try Again
            </motion.button>
          )}
        </div>
      </div>

      {/* ========== STATS BAR ========== */}
      <div className="px-4 py-2 bg-[var(--background)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Matches:</span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--text-primary)' }}>
              {matches}/{totalPairs}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Mistakes:</span>
            <span 
              className="text-[var(--text-base)] font-bold" 
              style={{ color: mistakes === 0 ? 'var(--success-dark)' : 'var(--danger-dark)' }}
            >
              {mistakes}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Time:</span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--text-primary)' }}>
              {formatTime(timeSpent)}/{formatTime(timeLimit)}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>
              {isQuiz ? 'Points:' : 'XP:'}
            </span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--highlight)' }}>
              +{isQuiz ? (earnedPoints || 0) : (earnedXp || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="p-4">
        {/* Perfect Game Message */}
        {isPerfect && (
          <div className="rounded-lg p-3 bg-[var(--success-light)] border border-[var(--success)] text-center mb-3">
            <p 
              className="text-[var(--text-sm)] font-medium flex items-center justify-center gap-2" 
              style={{ color: 'var(--success-dark)' }}
            >
              <span className="text-lg">🌟</span>
              Perfect! You matched all pairs with zero mistakes and earned a bonus reward!
            </p>
          </div>
        )}

        {/* Success but with mistakes */}
        {success && !isPerfect && (
          <div className="rounded-lg p-3 bg-[var(--warning-light)] border border-[var(--warning)] text-center mb-3">
            <p 
              className="text-[var(--text-sm)] font-medium" 
              style={{ color: 'var(--warning-dark)' }}
            >
              Good job! You completed the game with {mistakes} mistake{mistakes !== 1 ? 's' : ''}. You May try again for a perfect game!
            </p>
          </div>
        )}

        {/* Time's up message */}
        {!success && (
          <div className="rounded-lg p-3 bg-[var(--danger-light)] border border-[var(--danger)] text-center mb-3">
            <p 
              className="text-[var(--text-sm)] font-medium" 
              style={{ color: 'var(--danger-dark)' }}
            >
              Time ran out! You matched {matches} of {totalPairs} pairs. Try again to beat the clock!
            </p>
          </div>
        )}

        {/* Performance Summary */}
        <div className="grid grid-cols-2 gap-3">
          {/* Completion Rate */}
          <div className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)] text-center">
            <div className="text-[var(--text-xs)] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Completion Rate
            </div>
            <div className="text-[var(--text-lg)] font-bold" style={{ color: 'var(--text-primary)' }}>
              {Math.round((matches / totalPairs) * 100)}%
            </div>
          </div>

          {/* Accuracy */}
          <div className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)] text-center">
            <div className="text-[var(--text-xs)] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              Accuracy
            </div>
            <div 
              className="text-[var(--text-lg)] font-bold" 
              style={{ color: mistakes === 0 ? 'var(--success-dark)' : 'var(--text-primary)' }}
            >
              {matches > 0 ? Math.round((matches / (matches + mistakes)) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}