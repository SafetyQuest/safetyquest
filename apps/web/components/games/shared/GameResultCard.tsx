// apps/web/components/games/GameResultCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type GameMetrics = {
  score?: string;           // e.g., "4/5" or "80%"
  xpEarned?: number;
  pointsEarned?: number;
  timeSpent?: number;       // in seconds
  mistakes?: number;
  attempts?: number;
  correctCount?: number;
  totalCount?: number;
  matches?: number;         // For memory games
  accuracy?: string;        // For hotspot/precision games
};

type GameResultCardProps = {
  mode: 'lesson' | 'quiz' | 'preview';
  success: boolean;
  metrics: GameMetrics;
  onTryAgain?: () => void;
};

export default function GameResultCard({
  mode,
  success,
  metrics,
  onTryAgain,
}: GameResultCardProps) {
  // Don't show in preview mode
  if (mode === 'preview') return null;

  const isQuiz = mode === 'quiz';
  const isLesson = mode === 'lesson';

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  // Determine result icon and color
  const hasScore = metrics.score || metrics.correctCount !== undefined;
  const resultIcon = success ? '🎉' : hasScore ? '📊' : '⏰';
  const resultColor = success 
    ? 'from-green-50 to-emerald-50 border-green-300' 
    : 'from-blue-50 to-indigo-50 border-blue-300';
  const textColor = success ? 'text-green-700' : 'text-blue-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={clsx(
        'mt-6 rounded-xl p-6 border-2 shadow-lg',
        `bg-gradient-to-br ${resultColor}`
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-4xl">{resultIcon}</span>
          <div>
            <h3 className={clsx('text-xl font-bold', textColor)}>
              {success 
                ? 'Perfect!' 
                : hasScore
                ? 'Good Effort!' 
                : 'Time\'s Up!'}
            </h3>
            <p className="text-sm text-gray-600">
              {isQuiz ? 'Your answer has been recorded' : 'Great job completing this activity!'}
            </p>
          </div>
        </div>

        {/* Try Again Button (Lesson Mode Only) */}
        {isLesson && onTryAgain && (
          <motion.button
            onClick={onTryAgain}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 rounded-lg font-semibold text-white shadow-md bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            Try Again
          </motion.button>
        )}
      </div>

      {/* Metrics Grid */}
      <div 
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        }}
      >
        {/* Score (if available) */}
        {metrics.score && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Score
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {metrics.score}
            </div>
          </div>
        )}

        {/* Correct Count (if available) */}
        {metrics.correctCount !== undefined && metrics.totalCount !== undefined && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Correct
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {metrics.correctCount}/{metrics.totalCount}
            </div>
          </div>
        )}

        {/* XP Earned (Lesson Mode) */}
        {!isQuiz && metrics.xpEarned !== undefined && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              XP Earned
            </div>
            <div className="text-2xl font-bold text-purple-600">
              +{metrics.xpEarned}
            </div>
          </div>
        )}

        {/* Points Earned (Quiz Mode) */}
        {isQuiz && metrics.pointsEarned !== undefined && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Points
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {metrics.pointsEarned}
            </div>
          </div>
        )}

        {/* Time Spent - Only show for time-based games or when explicitly set to show */}
        {metrics.timeSpent !== undefined && metrics.timeSpent !== null && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Time
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {formatTime(metrics.timeSpent)}
            </div>
          </div>
        )}

        {/* Mistakes */}
        {metrics.mistakes !== undefined && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Mistakes
            </div>
            <div className="text-2xl font-bold text-red-600">
              {metrics.mistakes}
            </div>
          </div>
        )}

        {/* Attempts */}
        {metrics.attempts !== undefined && metrics.attempts > 1 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Attempts
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {metrics.attempts}
            </div>
          </div>
        )}

        {/* Matches (Memory Games) */}
        {metrics.matches !== undefined && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Matches
            </div>
            <div className="text-2xl font-bold text-green-600">
              {metrics.matches}
            </div>
          </div>
        )}

        {/* Accuracy (Hotspot/Precision Games) */}
        {metrics.accuracy && (
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Accuracy
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {metrics.accuracy}
            </div>
          </div>
        )}
      </div>

      {/* Success Message (Lesson Mode Only) */}
      {isLesson && success && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg"
        >
          <p className="text-sm text-green-800 text-center font-medium">
            🌟 Excellent work! You've mastered this activity.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}