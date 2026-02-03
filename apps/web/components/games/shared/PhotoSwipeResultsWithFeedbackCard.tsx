// apps/web/components/games/shared/PhotoSwipeResultsWithFeedbackCard.tsx
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

type PhotoSwipeCard = {
  id: string;
  imageUrl: string;
  isCorrect: 'safe' | 'unsafe';
  explanation: string;
  userChoice?: 'safe' | 'unsafe' | 'missing';
};

type PhotoSwipeResultsWithFeedbackCardProps = {
  success: boolean;
  metrics: {
    correctCount: number;
    totalCount: number;
    mistakes: number;
    missingCount: number;
    xpEarned?: number;
    timeSpent?: number;
  };
  generalFeedback?: string;
  incorrectCards: PhotoSwipeCard[];
  correctCards: PhotoSwipeCard[];
  missingCards: PhotoSwipeCard[];
  onTryAgain?: () => void;
};

export default function PhotoSwipeResultsWithFeedbackCard({
  success,
  metrics,
  generalFeedback,
  incorrectCards,
  correctCards,
  missingCards,
  onTryAgain,
}: PhotoSwipeResultsWithFeedbackCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'incorrect' | 'correct' | 'missing'>('summary');
  const accuracy = `${Math.round((metrics.correctCount / metrics.totalCount) * 100)}%`;
  const hasGeneralFeedback = !!generalFeedback?.trim();
  const hasIncorrect = incorrectCards.length > 0;
  const hasCorrect = correctCards.length > 0;
  const hasMissing = missingCards.length > 0;
  const showTime = metrics.timeSpent !== undefined;

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
                {success ? 'Perfect!' : 'Time\'s Up!'}
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
              style={{ background: 'var(--primary-light)' }}
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
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Mistakes:</span>
            <span className="text-[var(--text-base)] font-bold text-[var(--danger-dark)]">
              {metrics.mistakes}
            </span>
          </div>
          
          {hasMissing && (
            <>
              <div className="w-px h-3 bg-[var(--border-medium)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Missing:</span>
                <span className="text-[var(--text-base)] font-bold text-[var(--warning-dark)]">
                  {metrics.missingCount}
                </span>
              </div>
            </>
          )}
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)] text-[var(--text-muted)]">XP:</span>
            <span className="text-[var(--text-base)] font-bold text-[var(--highlight)]">
              +{metrics.xpEarned}
            </span>
          </div>
          
          {showTime && (
            <>
              <div className="w-px h-3 bg-[var(--border-medium)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-xs)] text-[var(--text-muted)]">Time:</span>
                <span className="text-[var(--text-base)] font-bold text-[var(--text-primary)]">
                  {Math.floor(metrics.timeSpent! / 60)}m {(metrics.timeSpent! % 60).toString().padStart(2, '0')}s
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex gap-1.5 flex-wrap">
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
              ✓ Correct ({correctCards.length})
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
              ✗ Incorrect ({incorrectCards.length})
            </button>
          )}
          
          {hasMissing && (
            <button
              onClick={() => setActiveTab('missing')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'missing'
                  ? "bg-[var(--warning)] text-white shadow-sm"
                  : "bg-[var(--background)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]"
              )}
            >
              ⏱️ Missing ({missingCards.length})
            </button>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
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
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">✓</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--success-dark)' }}
                      >
                        Correct ({correctCards.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {correctCards.map((card, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border border-[var(--border)]">
                            <img 
                              src={card.imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)] flex-1" 
                            style={{ color: 'var(--success-dark)' }}
                          >
                            {card.isCorrect === 'safe' ? 'Safe' : 'Unsafe'} ✓
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasIncorrect && (
                  <div className="rounded-lg p-2.5 bg-[var(--danger-light)] border border-[var(--danger)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">✗</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--danger-dark)' }}
                      >
                        Incorrect ({incorrectCards.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {incorrectCards.map((card, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border border-[var(--border)]">
                            <img 
                              src={card.imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)] flex-1" 
                            style={{ color: 'var(--danger-dark)' }}
                          >
                            Marked {card.userChoice === 'safe' ? 'Safe' : 'Unsafe'} ✗
                            <br />
                            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-secondary)' }}>
                              (Correct: {card.isCorrect === 'safe' ? 'Safe' : 'Unsafe'})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {hasMissing && (
                  <div className="rounded-lg p-2.5 bg-[var(--warning-light)] border border-[var(--warning)]">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-base">⏱️</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--warning-dark)' }}
                      >
                        Missing ({missingCards.length})
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {missingCards.map((card, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border border-[var(--border)]">
                            <img 
                              src={card.imageUrl} 
                              alt="" 
                              className="w-full h-full object-cover"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)] flex-1" 
                            style={{ color: 'var(--warning-dark)' }}
                          >
                            Not attempted
                            <br />
                            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-secondary)' }}>
                              (Correct: {card.isCorrect === 'safe' ? 'Safe' : 'Unsafe'})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
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

        {activeTab === 'incorrect' && hasIncorrect && (
          <div className="space-y-3">
            {incorrectCards.map((card, idx) => (
              <div 
                key={idx}
                className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                    <img 
                      src={card.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-base text-[var(--danger)]">✗</span>
                        <span 
                          className="ml-1 font-medium text-[var(--text-sm)]" 
                          style={{ color: 'var(--danger-dark)' }}
                        >
                          You marked as {card.userChoice === 'safe' ? 'Safe' : 'Unsafe'}
                        </span>
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[var(--text-xs)] font-medium bg-[var(--danger-light)]"
                        style={{ color: 'var(--danger-dark)' }}
                      >
                        Correct: {card.isCorrect === 'safe' ? 'SAFE ✓' : 'UNSAFE ✗'}
                      </span>
                    </div>
                    {card.explanation && (
                      <div className="mt-2 p-2 rounded bg-[var(--danger-light)] border border-[var(--danger)]">
                        <div
                          className="prose prose-xs"
                          style={{ color: 'var(--danger-dark)', fontSize: 'var(--text-sm)' }}
                          dangerouslySetInnerHTML={{ __html: card.explanation }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'correct' && hasCorrect && (
          <div className="space-y-3">
            {correctCards.map((card, idx) => (
              <div 
                key={idx}
                className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                    <img 
                      src={card.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-base text-[var(--success)]">✓</span>
                        <span 
                          className="ml-1 font-medium text-[var(--text-sm)]" 
                          style={{ color: 'var(--success-dark)' }}
                        >
                          Correctly identified as {card.isCorrect === 'safe' ? 'Safe' : 'Unsafe'}
                        </span>
                      </div>
                    </div>
                    {card.explanation && (
                      <div className="mt-2 p-2 rounded bg-[var(--success-light)] border border-[var(--success)]">
                        <div
                          className="prose prose-xs"
                          style={{ color: 'var(--success-dark)', fontSize: 'var(--text-sm)' }}
                          dangerouslySetInnerHTML={{ __html: card.explanation }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'missing' && hasMissing && (
          <div className="space-y-3">
            {missingCards.map((card, idx) => (
              <div 
                key={idx}
                className="rounded-lg p-3 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                    <img 
                      src={card.imageUrl} 
                      alt="" 
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <span className="text-base text-[var(--warning)]">⏱️</span>
                        <span 
                          className="ml-1 font-medium text-[var(--text-sm)]" 
                          style={{ color: 'var(--warning-dark)' }}
                        >
                          Not attempted
                        </span>
                      </div>
                      <span 
                        className="px-2 py-0.5 rounded-full text-[var(--text-xs)] font-medium bg-[var(--warning-light)]"
                        style={{ color: 'var(--warning-dark)' }}
                      >
                        Correct: {card.isCorrect === 'safe' ? 'SAFE ✓' : 'UNSAFE ✗'}
                      </span>
                    </div>
                    {card.explanation && (
                      <div className="mt-2 p-2 rounded bg-[var(--warning-light)] border border-[var(--warning)]">
                        <div
                          className="prose prose-xs"
                          style={{ color: 'var(--warning-dark)', fontSize: 'var(--text-sm)' }}
                          dangerouslySetInnerHTML={{ __html: card.explanation }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}