// apps/web/components/games/shared/TimeAttackSortingResultsCard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

type TimeAttackItem = {
  id: string;
  content: string;
  imageUrl?: string;
  correctTargetId: string;
  explanation?: string;
  xp?: number;
  points?: number;
};

type TimeAttackTarget = {
  id: string;
  label: string;
};

type TimeAttackSortingResultsCardProps = {
  config: {
    items: TimeAttackItem[];
    targets: TimeAttackTarget[];
    generalFeedback?: string;
    timeLimitSeconds: number;  // ⏱️ NEW: Time limit for context
  };
  userActions: {
    placements: { [itemId: string]: string };  // itemId -> targetId
  };
  metrics: {
    correctCount: number;
    incorrectCount: number;
    missedCount: number;
    totalCount: number;
    earnedXp?: number;
    earnedPoints?: number;
    timeSpent: number;  // ⏱️ Time spent in seconds
  };
  mode: 'lesson' | 'quiz';
  onTryAgain?: () => void;
};

type EnrichedItem = TimeAttackItem & {
  userTargetId: string;
  userTargetLabel: string;
  correctTargetLabel: string;
  isCorrect: boolean;
  isMissed: boolean;
};

// ============================================================================
// HELPER: Format Time
// ============================================================================

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function TimeAttackSortingResultsCard({
  config,
  userActions,
  metrics,
  mode,
  onTryAgain,
}: TimeAttackSortingResultsCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'correct' | 'incorrect' | 'missed'>('summary');

  // Safety check: return null if required data is missing
  if (!metrics || !config || !userActions) {
    return null;
  }

  const isQuiz = mode === 'quiz';
  const success = metrics.correctCount === metrics.totalCount;
  
  // ⏱️ Time-based success indicators
  const ranOutOfTime = metrics.timeSpent >= config.timeLimitSeconds;
  const beatTheClock = success && !ranOutOfTime;
  const timeRemaining = config.timeLimitSeconds - metrics.timeSpent;
  
  // Calculate speed performance (percentage of time used)
  const timeUsagePercent = (metrics.timeSpent / config.timeLimitSeconds) * 100;
  const isVeryFast = timeUsagePercent < 50;  // Used less than 50% of time
  const isFast = timeUsagePercent < 75;       // Used less than 75% of time

  // ============================================================================
  // INTERNAL PROCESSING
  // ============================================================================

  const getTargetLabel = (targetId: string): string => {
    return config.targets.find(t => t.id === targetId)?.label || 'Unknown';
  };

  // Categorize items: correct, incorrect, missed
  const { correctItems, incorrectItems, missedItems } = useMemo(() => {
    const correct: EnrichedItem[] = [];
    const incorrect: EnrichedItem[] = [];
    const missed: EnrichedItem[] = [];

    config.items.forEach((item) => {
      const userTargetId = userActions.placements[item.id];
      const isPlaced = !!userTargetId;
      const isCorrect = userTargetId === item.correctTargetId;

      const enrichedItem: EnrichedItem = {
        ...item,
        userTargetId: userTargetId || '',
        userTargetLabel: userTargetId ? getTargetLabel(userTargetId) : 'Not placed',
        correctTargetLabel: getTargetLabel(item.correctTargetId),
        isCorrect,
        isMissed: !isPlaced,
      };

      if (!isPlaced) {
        missed.push(enrichedItem);
      } else if (isCorrect) {
        correct.push(enrichedItem);
      } else {
        incorrect.push(enrichedItem);
      }
    });

    return { correctItems: correct, incorrectItems: incorrect, missedItems: missed };
  }, [config.items, config.targets, userActions.placements]);

  const accuracy = metrics.totalCount > 0 
    ? `${Math.round((metrics.correctCount / metrics.totalCount) * 100)}%` 
    : '0%';

  // ⏱️ Time-based header message
  const getHeaderMessage = () => {
    if (ranOutOfTime) {
      return "⏱️ Time's Up!";
    }
    if (success) {
      if (isVeryFast) {
        return "⚡ Lightning Fast!";
      }
      if (isFast) {
        return "🎯 Beat the Clock!";
      }
      return "✅ Complete!";
    }
    return "⏱️ Time Ran Out";
  };

  const getHeaderSubtext = () => {
    if (ranOutOfTime && metrics.correctCount > 0) {
      return `You sorted ${metrics.correctCount} of ${metrics.totalCount} items before time ran out`;
    }
    if (success) {
      if (isVeryFast) {
        return `Incredible speed! ${timeRemaining}s to spare`;
      }
      if (isFast) {
        return `Great timing! ${timeRemaining}s remaining`;
      }
      return 'All items sorted correctly!';
    }
    return `Time expired - ${metrics.correctCount}/${metrics.totalCount} items sorted`;
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={clsx(
        'max-w-3xl mx-auto mt-6 rounded-xl overflow-hidden',
        'border-2 shadow-xl',
        success 
          ? 'bg-gradient-to-br from-[var(--success-light)] to-[var(--surface)] border-[var(--success)]'
          : 'bg-gradient-to-br from-[var(--danger-light)] to-[var(--surface)] border-[var(--danger)]'
      )}
    >
      {/* ========== HEADER ========== */}
      <div className="px-4 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {ranOutOfTime ? '⏱️' : success ? (isVeryFast ? '⚡' : '🎯') : '⏱️'}
            </span>
            <div>
              <h3 className="text-[var(--text-base)] font-bold text-white">
                {getHeaderMessage()}
              </h3>
              <p className="text-[var(--text-xs)] text-white/80 mt-0.5">
                {getHeaderSubtext()}
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
              {metrics.correctCount}/{metrics.totalCount}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Accuracy:</span>
            <span 
              className={clsx(
                "text-[var(--text-base)] font-bold px-1.5 py-0.5 rounded-full text-[var(--text-xs)]",
                success 
                  ? "bg-[var(--success-light)]"
                  : "bg-[var(--warning-light)]"
              )}
              style={{ color: success ? 'var(--success-dark)' : 'var(--warning-dark)' }}
            >
              {accuracy}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          {/* ⏱️ TIME DISPLAY */}
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Time:</span>
            <span 
              className={clsx(
                "text-[var(--text-base)] font-bold",
                ranOutOfTime && "text-[var(--danger-dark)]",
                !ranOutOfTime && isVeryFast && "text-[var(--success-dark)]",
                !ranOutOfTime && isFast && "text-[var(--warning-dark)]",
                !ranOutOfTime && !isFast && "text-[var(--text-primary)]"
              )}
            >
              {formatTime(metrics.timeSpent)}/{formatTime(config.timeLimitSeconds)}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>
              {isQuiz ? 'Points:' : 'XP:'}
            </span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--highlight)' }}>
              +{isQuiz ? (metrics.earnedPoints || 0) : (metrics.earnedXp || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* ========== TABS NAVIGATION ========== */}
      <div className="px-4 py-2 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <button
            onClick={() => setActiveTab('summary')}
            className={clsx(
              "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all",
              activeTab === 'summary'
                ? "bg-[var(--primary)] text-white shadow-sm"
                : "bg-[var(--background)] hover:bg-[var(--primary-surface)]"
            )}
            style={{ color: activeTab === 'summary' ? 'white' : 'var(--text-secondary)' }}
          >
            Summary
          </button>
          
          <button
            onClick={() => setActiveTab('correct')}
            className={clsx(
              "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
              activeTab === 'correct'
                ? "bg-[var(--success)] text-white shadow-sm"
                : "bg-[var(--background)] hover:bg-[var(--success-light)]"
            )}
            style={{ color: activeTab === 'correct' ? 'white' : 'var(--text-secondary)' }}
          >
            <span>✓ Correct</span>
            <span 
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{ 
                background: activeTab === 'correct' ? 'rgba(255,255,255,0.2)' : 'var(--success-light)',
                color: activeTab === 'correct' ? 'white' : 'var(--success-dark)'
              }}
            >
              {metrics.correctCount}
            </span>
          </button>
          
          {metrics.incorrectCount > 0 && (
            <button
              onClick={() => setActiveTab('incorrect')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'incorrect'
                  ? "bg-[var(--danger)] text-white shadow-sm"
                  : "bg-[var(--background)] hover:bg-[var(--danger-light)]"
              )}
              style={{ color: activeTab === 'incorrect' ? 'white' : 'var(--text-secondary)' }}
            >
              <span>✗ Incorrect</span>
              <span 
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ 
                  background: activeTab === 'incorrect' ? 'rgba(255,255,255,0.2)' : 'var(--danger-light)',
                  color: activeTab === 'incorrect' ? 'white' : 'var(--danger-dark)'
                }}
              >
                {metrics.incorrectCount}
              </span>
            </button>
          )}
          
          {metrics.missedCount > 0 && (
            <button
              onClick={() => setActiveTab('missed')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'missed'
                  ? "bg-[var(--warning)] text-white shadow-sm"
                  : "bg-[var(--background)] hover:bg-[var(--warning-light)]"
              )}
              style={{ color: activeTab === 'missed' ? 'white' : 'var(--text-secondary)' }}
            >
              <span>⏱️ Missed</span>
              <span 
                className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                style={{ 
                  background: activeTab === 'missed' ? 'rgba(255,255,255,0.2)' : 'var(--warning-light)',
                  color: activeTab === 'missed' ? 'white' : 'var(--warning-dark)'
                }}
              >
                {metrics.missedCount}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* ========== TAB CONTENT ========== */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* SUMMARY TAB */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Left Column: General Feedback & Time Performance */}
              <div className="lg:col-span-1 space-y-3">
                {/* General Feedback */}
                {config.generalFeedback && (
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
                        dangerouslySetInnerHTML={{ __html: config.generalFeedback }}
                      />
                    </div>
                  </div>
                )}

                {/* ⏱️ Time Performance */}
                <div className="rounded-lg p-3 bg-[var(--surface)] border border-[var(--border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⏱️</span>
                    <h4 className="font-semibold text-[var(--text-sm)]" style={{ color: 'var(--text-primary)' }}>
                      Time Performance
                    </h4>
                  </div>
                  <div className="space-y-1.5 text-[var(--text-xs)]">
                    {ranOutOfTime ? (
                      <p style={{ color: 'var(--danger-dark)' }}>
                        <strong>Time expired!</strong> Used all {formatTime(config.timeLimitSeconds)}.
                      </p>
                    ) : (
                      <>
                        {isVeryFast && (
                          <p style={{ color: 'var(--success-dark)' }}>
                            <strong>⚡ Lightning fast!</strong> {formatTime(timeRemaining)} to spare!
                          </p>
                        )}
                        {isFast && !isVeryFast && (
                          <p style={{ color: 'var(--warning-dark)' }}>
                            <strong>Great speed!</strong> {formatTime(timeRemaining)} remaining.
                          </p>
                        )}
                        {!isFast && (
                          <p style={{ color: 'var(--text-secondary)' }}>
                            Used {formatTime(metrics.timeSpent)} of {formatTime(config.timeLimitSeconds)}.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Summary Lists ONLY - NO explanations here */}
              <div className="lg:col-span-1 space-y-2">
                {/* Correct Items Summary */}
                {correctItems.length > 0 && (
                  <div className="rounded-lg p-2.5 bg-[var(--success-light)] border border-[var(--success)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✓</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--success-dark)' }}
                      >
                        Correct ({correctItems.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {correctItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--success-dark)' }}
                          >
                            {item.content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Incorrect Items Summary */}
                {incorrectItems.length > 0 && (
                  <div className="rounded-lg p-2.5 bg-[var(--danger-light)] border border-[var(--danger)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✗</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--danger-dark)' }}
                      >
                        Incorrect ({incorrectItems.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {incorrectItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--danger-dark)' }}
                          >
                            {item.content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missed Items Summary */}
                {missedItems.length > 0 && (
                  <div className="rounded-lg p-2.5 bg-[var(--warning-light)] border border-[var(--warning)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">⏱️</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--warning-dark)' }}
                      >
                        Missed ({missedItems.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {missedItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--warning-dark)' }}
                          >
                            {item.content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Success Message */}
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

        {/* CORRECT TAB */}
        {activeTab === 'correct' && (
          <div className="space-y-2">
            {correctItems.length === 0 ? (
              <p className="text-center text-[var(--text-sm)]" style={{ color: 'var(--text-muted)' }}>
                No items were sorted correctly.
              </p>
            ) : (
              correctItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {/* Image (if exists) */}
                    {item.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-[var(--border)]">
                        <img 
                          src={item.imageUrl} 
                          alt={item.content}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 mb-1">
                        <span className="text-base mt-0.5" style={{ color: 'var(--success)' }}>✓</span>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium text-[var(--text-sm)] break-words" 
                            style={{ color: 'var(--success-dark)' }}
                          >
                            {item.content}
                          </h4>
                          <p className="text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Placed in: {item.correctTargetLabel}
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="mt-1.5 p-2 rounded bg-[var(--success-light)] border border-[var(--success)]">
                          <div
                            className="prose prose-xs"
                            style={{ color: 'var(--success-dark)', fontSize: 'var(--text-sm)' }}
                            dangerouslySetInnerHTML={{ __html: item.explanation }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* INCORRECT TAB */}
        {activeTab === 'incorrect' && (
          <div className="space-y-2">
            {incorrectItems.length === 0 ? (
              <p className="text-center text-[var(--text-sm)]" style={{ color: 'var(--text-muted)' }}>
                No incorrect placements!
              </p>
            ) : (
              incorrectItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {/* Image (if exists) */}
                    {item.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-[var(--border)]">
                        <img 
                          src={item.imageUrl} 
                          alt={item.content}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 mb-1">
                        <span className="text-base mt-0.5" style={{ color: 'var(--danger)' }}>✗</span>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium text-[var(--text-sm)] break-words" 
                            style={{ color: 'var(--danger-dark)' }}
                          >
                            {item.content}
                          </h4>
                          <div className="text-[var(--text-xs)] mt-0.5 space-y-0.5">
                            <p style={{ color: 'var(--text-secondary)' }}>
                              Your choice: <span className="font-medium" style={{ color: 'var(--danger-dark)' }}>{item.userTargetLabel}</span>
                            </p>
                            <p style={{ color: 'var(--text-secondary)' }}>
                              Should be: <span className="font-medium" style={{ color: 'var(--success-dark)' }}>{item.correctTargetLabel}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="mt-1.5 p-2 rounded bg-[var(--danger-light)] border border-[var(--danger)]">
                          <div
                            className="prose prose-xs"
                            style={{ color: 'var(--danger-dark)', fontSize: 'var(--text-sm)' }}
                            dangerouslySetInnerHTML={{ __html: item.explanation }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* MISSED TAB */}
        {activeTab === 'missed' && (
          <div className="space-y-2">
            {missedItems.length === 0 ? (
              <p className="text-center text-[var(--text-sm)]" style={{ color: 'var(--text-muted)' }}>
                No items were missed!
              </p>
            ) : (
              missedItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-start gap-2">
                    {/* Image (if exists) */}
                    {item.imageUrl && (
                      <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border border-[var(--border)]">
                        <img 
                          src={item.imageUrl} 
                          alt={item.content}
                          className="w-full h-full object-cover"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-1.5 mb-1">
                        <span className="text-base mt-0.5" style={{ color: 'var(--warning)' }}>⏱️</span>
                        <div className="flex-1 min-w-0">
                          <h4 
                            className="font-medium text-[var(--text-sm)] break-words" 
                            style={{ color: 'var(--warning-dark)' }}
                          >
                            {item.content}
                          </h4>
                          <p className="text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            Not placed in time. Should go to: <strong>{item.correctTargetLabel}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Explanation */}
                      {item.explanation && (
                        <div className="mt-1.5 p-2 rounded bg-[var(--warning-light)] border border-[var(--warning)]">
                          <div
                            className="prose prose-xs"
                            style={{ color: 'var(--warning-dark)', fontSize: 'var(--text-sm)' }}
                            dangerouslySetInnerHTML={{ __html: item.explanation }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}