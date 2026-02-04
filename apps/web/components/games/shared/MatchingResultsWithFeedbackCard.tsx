// apps/web/components/games/shared/MatchingResultsWithFeedbackCard.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type MatchingPairFeedback = {
  leftText: string;
  rightText: string;
  correctRightText?: string;  // For incorrect pairs only
  explanation?: string;
};

type MatchingResultsWithFeedbackCardProps = {
  success: boolean;
  metrics: {
    correctCount: number;
    totalCount: number;
    xpEarned?: number;
    attempts?: number;
  };
  generalFeedback?: string;
  correctPairs: MatchingPairFeedback[];
  incorrectPairs: MatchingPairFeedback[];
  onTryAgain?: () => void;
};

export default function MatchingResultsWithFeedbackCard({
  success,
  metrics,
  generalFeedback,
  correctPairs,
  incorrectPairs,
  onTryAgain,
}: MatchingResultsWithFeedbackCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'correct' | 'incorrect'>('summary');
  const accuracy = `${Math.round((metrics.correctCount / metrics.totalCount) * 100)}%`;
  const hasGeneralFeedback = !!generalFeedback?.trim();
  const hasCorrect = correctPairs.length > 0;
  const hasIncorrect = incorrectPairs.length > 0;

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
        'max-w-4xl mx-auto mt-4 rounded-xl overflow-hidden',
        'border-2 shadow-xl',
        bgColor,
        borderColor
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div>
              <h3 className="text-[var(--text-base)] font-bold text-white">
                {success ? 'Perfect!' : 'Good Effort!'}
              </h3>
              <p className="text-[var(--text-xs)] text-white/80 mt-0.5">
                Review your results below
              </p>
            </div>
          </div>
          
          {onTryAgain && (
            <motion.button
              onClick={onTryAgain}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-3 py-1 rounded-md text-[var(--text-xs)] font-medium text-white"
              style={{
                background: 'var(--primary-light)',
              }}
            >
              Try Again
            </motion.button>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="px-4 py-2 bg-[var(--background)] border-b border-[var(--border)]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Correct:</span>
            <span className="text-[var(--text-base)] font-bold text-[var(--text-primary)]">
              {metrics.correctCount}/{metrics.totalCount}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Accuracy:</span>
            <span 
              className={clsx(
                "text-[var(--text-base)] font-bold px-1.5 py-0.5 rounded-full text-[var(--text-xs)]",
                success 
                  ? "bg-[var(--success-light)] text-[var(--success-dark)]"
                  : "bg-[var(--warning-light)] text-[var(--warning-dark)]"
              )}
            >
              {accuracy}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">XP:</span>
            <span className="text-[var(--text-base)] font-bold text-[var(--highlight)]">
              +{metrics.xpEarned}
            </span>
          </div>
          
          {metrics.attempts !== undefined && (
            <>
              <div className="w-px h-3 bg-[var(--border-medium)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Attempts:</span>
                <span className="text-[var(--text-base)] font-bold text-[var(--text-primary)]">
                  {metrics.attempts}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('summary')}
            className={clsx(
              "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all",
              activeTab === 'summary'
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
            )}
          >
            Summary
          </button>
          
          {hasCorrect && (
            <button
              onClick={() => setActiveTab('correct')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'correct'
                  ? "bg-[var(--success)] text-white shadow-sm"
                  : "bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              ✓ Correct ({correctPairs.length})
            </button>
          )}
          
          {hasIncorrect && (
            <button
              onClick={() => setActiveTab('incorrect')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'incorrect'
                  ? "bg-[var(--danger)] text-white shadow-sm"
                  : "bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              ✗ Incorrect ({incorrectPairs.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[350px] overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {hasGeneralFeedback && (
                <div className="lg:col-span-1">
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
                </div>
              )}
              
              <div className={clsx(
                "space-y-2",
                hasGeneralFeedback ? "lg:col-span-1" : "lg:col-span-2"
              )}>
                {hasCorrect && (
                  <div className="rounded-lg p-2.5 bg-[var(--success-light)] border border-[var(--success)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✓</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--success-dark)' }}
                      >
                        Correct ({correctPairs.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {correctPairs.map((pair, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--success-dark)' }}
                          >
                            {pair.leftText} ↔ {pair.rightText}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasIncorrect && (
                  <div className="rounded-lg p-2.5 bg-[var(--danger-light)] border border-[var(--danger)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✗</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--danger-dark)' }}
                      >
                        Incorrect ({incorrectPairs.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {incorrectPairs.map((pair, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--danger-dark)' }}
                          >
                            {pair.leftText} ↔ {pair.rightText}
                            {pair.correctRightText && ` (should be ${pair.correctRightText})`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg p-2 bg-[var(--success-light)] border border-[var(--success)] text-center">
                    <p 
                      className="text-[var(--text-xs)] font-medium flex items-center justify-center gap-1" 
                      style={{ color: 'var(--success-dark)' }}
                    >
                      <span className="text-sm">🌟</span>
                      Excellent work! You've mastered this activity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'correct' && hasCorrect && (
          <div className="space-y-2">
            {correctPairs.map((pair, idx) => (
              <div 
                key={idx}
                className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex items-start gap-1.5 mb-1">
                  <span className="text-base text-[var(--success)] mt-0.5">✓</span>
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-[var(--text-sm)] flex-1 break-words" 
                      style={{ color: 'var(--success-dark)' }}
                    >
                      {pair.leftText} ↔ {pair.rightText}
                    </h4>
                  </div>
                </div>
                {pair.explanation && (
                  <div className="mt-1.5 p-2 rounded bg-[var(--success-light)] border border-[var(--success)]">
                    <div
                      className="prose prose-xs"
                      style={{ color: 'var(--success-dark)', fontSize: 'var(--text-sm)' }}
                      dangerouslySetInnerHTML={{ __html: pair.explanation }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'incorrect' && hasIncorrect && (
          <div className="space-y-2">
            {incorrectPairs.map((pair, idx) => (
              <div 
                key={idx}
                className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex items-start gap-1.5 mb-1">
                  <span className="text-base text-[var(--danger)] mt-0.5">✗</span>
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-[var(--text-sm)] flex-1 break-words" 
                      style={{ color: 'var(--danger-dark)' }}
                    >
                      {pair.leftText} ↔ {pair.rightText}
                      {pair.correctRightText && (
                        <span className="block text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Should be: {pair.correctRightText}
                        </span>
                      )}
                    </h4>
                  </div>
                </div>
                {pair.explanation && (
                  <div className="mt-1.5 p-2 rounded bg-[var(--danger-light)] border border-[var(--danger)]">
                    <div
                      className="prose prose-xs"
                      style={{ color: 'var(--danger-dark)', fontSize: 'var(--text-sm)' }}
                      dangerouslySetInnerHTML={{ __html: pair.explanation }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}