// apps/web/components/games/shared/TrueFalseResultsCard.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

type TrueFalseResultsCardProps = {
  success: boolean;
  correctAnswer: boolean;
  selectedAnswer: boolean;
  generalFeedback?: string;
  earnedXp?: number;
  earnedPoints?: number;
  attempts: number;
  mode: 'lesson' | 'quiz';
  onTryAgain?: () => void;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TrueFalseResultsCard({
  success,
  correctAnswer,
  selectedAnswer,
  generalFeedback,
  earnedXp,
  earnedPoints,
  attempts,
  mode,
  onTryAgain,
}: TrueFalseResultsCardProps) {
  const isQuiz = mode === 'quiz';
  const hasGeneralFeedback = !!generalFeedback?.trim();

  const bgColor = success 
    ? 'bg-gradient-to-br from-[var(--success-light)] to-[var(--surface)]'
    : 'bg-gradient-to-br from-[var(--warning-light)] to-[var(--surface)]';
  
  const borderColor = success
    ? 'border-[var(--success)]'
    : 'border-[var(--warning)]';

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
            <span className="text-xl">{success ? '🎯' : '💡'}</span>
            <div>
              <h3 className="text-[var(--text-base)] font-bold text-white">
                {success ? 'Perfect!' : 'Good Effort!'}
              </h3>
              <p className="text-[var(--text-xs)] text-white/80 mt-0.5">
                {success ? "You got it right!" : "Review the feedback below"}
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
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Score:</span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--text-primary)' }}>
              {success ? '1' : '0'}/1
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
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Attempts:</span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--text-primary)' }}>
              {attempts}
            </span>
          </div>
        </div>
      </div>

      {/* ========== CONTENT ========== */}
      <div className="p-4 space-y-3">
        {/* General Feedback */}
        {hasGeneralFeedback && (
          <div className="rounded-lg p-3 bg-[var(--primary-surface)] border border-[var(--primary-light)]">
            <div className="flex items-start gap-2">
              <span className="text-lg mt-0.5 flex-shrink-0">💡</span>
              <div 
                className="prose prose-sm flex-1 min-w-0"
                style={{ 
                  color: 'var(--text-primary)',
                  fontSize: 'var(--text-base)',
                  lineHeight: 'var(--line-height-relaxed)'
                }}
                dangerouslySetInnerHTML={{ __html: generalFeedback || '' }}
              />
            </div>
          </div>
        )}

        {/* Answer Comparison */}
        <div className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)]">
          <div className="grid grid-cols-2 gap-3">
            {/* Correct Answer */}
            <div className="text-center p-2 rounded bg-[var(--success-light)] border border-[var(--success)]">
              <div className="text-[var(--text-xs)] font-medium mb-1" style={{ color: 'var(--success-dark)' }}>
                ✓ Correct Answer
              </div>
              <div 
                className={clsx(
                  "text-[var(--text-base)] font-bold px-3 py-1 rounded-full inline-block",
                  correctAnswer 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}
              >
                {correctAnswer ? 'TRUE' : 'FALSE'}
              </div>
            </div>

            {/* Your Answer */}
            <div 
              className={clsx(
                "text-center p-2 rounded border",
                success 
                  ? "bg-[var(--success-light)] border-[var(--success)]" 
                  : "bg-[var(--danger-light)] border-[var(--danger)]"
              )}
            >
              <div 
                className="text-[var(--text-xs)] font-medium mb-1" 
                style={{ color: success ? 'var(--success-dark)' : 'var(--danger-dark)' }}
              >
                {success ? '✓' : '✗'} Your Answer
              </div>
              <div 
                className={clsx(
                  "text-[var(--text-base)] font-bold px-3 py-1 rounded-full inline-block",
                  selectedAnswer 
                    ? "bg-green-100 text-green-700" 
                    : "bg-red-100 text-red-700"
                )}
              >
                {selectedAnswer ? 'TRUE' : 'FALSE'}
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="rounded-lg p-2 bg-[var(--success-light)] border border-[var(--success)] text-center">
            <p 
              className="text-[var(--text-xs)] font-medium flex items-center justify-center gap-1" 
              style={{ color: 'var(--success-dark)' }}
            >
              <span className="text-sm">🌟</span>
              Excellent work! You've mastered this question.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}