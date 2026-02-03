// apps/web/components/games/shared/SequenceResultsWithFeedbackCard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
  explanation?: string;
  xp?: number;
  points?: number;
};

type SequenceResultsWithFeedbackCardProps = {
  config: {
    items: SequenceItem[];
    correctOrder: string[];
    generalFeedback?: string;
  };
  userActions: {
    order: string[];  // User's sequence of item IDs
  };
  metrics: {
    correctCount: number;
    totalCount: number;
    xpEarned?: number;
    attempts: number;
  };
  mode: 'lesson' | 'quiz';
  onTryAgain?: () => void;
};

type EnrichedItem = SequenceItem & {
  correctPosition: number;  // 1-indexed
  userPosition: number;     // 1-indexed
  isCorrect: boolean;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function SequenceResultsWithFeedbackCard({
  config,
  userActions,
  metrics,
  mode,
  onTryAgain,
}: SequenceResultsWithFeedbackCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'correct' | 'wrong'>('summary');

  // ============================================================================
  // INTERNAL PROCESSING (Qwen's Pattern)
  // ============================================================================

  // Helper: Get item by ID
  const getItemById = (id: string): SequenceItem | undefined => {
    return config.items.find(item => item.id === id);
  };

  // Categorize and enrich items based on position
  const { correctItems, wrongPositionItems } = useMemo(() => {
    const correct: EnrichedItem[] = [];
    const wrong: EnrichedItem[] = [];

    config.correctOrder.forEach((correctItemId, correctIndex) => {
      const item = getItemById(correctItemId);
      if (!item) return;

      const userIndex = userActions.order.indexOf(correctItemId);
      const isCorrect = userIndex === correctIndex;

      const enrichedItem: EnrichedItem = {
        ...item,
        correctPosition: correctIndex + 1,  // 1-indexed for display
        userPosition: userIndex + 1,        // 1-indexed for display
        isCorrect,
      };

      if (isCorrect) {
        correct.push(enrichedItem);
      } else {
        wrong.push(enrichedItem);
      }
    });

    return { correctItems: correct, wrongPositionItems: wrong };
  }, [config.items, config.correctOrder, userActions.order]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const success = metrics.correctCount === metrics.totalCount;
  const accuracy = `${Math.round((metrics.correctCount / metrics.totalCount) * 100)}%`;
  const hasGeneralFeedback = !!config.generalFeedback?.trim();
  const hasCorrect = correctItems.length > 0;
  const hasWrong = wrongPositionItems.length > 0;

  const bgColor = success 
    ? 'bg-gradient-to-br from-[var(--success-light)] to-[var(--surface)]'
    : 'bg-gradient-to-br from-[var(--warning-light)] to-[var(--surface)]';
  
  const borderColor = success
    ? 'border-[var(--success)]'
    : 'border-[var(--warning)]';

  // ============================================================================
  // RENDER
  // ============================================================================

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
      {/* ========== HEADER ========== */}
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
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Correct:</span>
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
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>XP:</span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--highlight)' }}>
              +{metrics.xpEarned || 0}
            </span>
          </div>
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Attempts:</span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--text-primary)' }}>
              {metrics.attempts}
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
                : "bg-[var(--background)] hover:bg-[var(--surface-hover)]"
            )}
            style={activeTab !== 'summary' ? { color: 'var(--text-secondary)' } : {}}
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
                  : "bg-[var(--background)] hover:bg-[var(--surface-hover)]"
              )}
              style={activeTab !== 'correct' ? { color: 'var(--text-secondary)' } : {}}
            >
              ✓ Correct Position ({correctItems.length})
            </button>
          )}
          
          {hasWrong && (
            <button
              onClick={() => setActiveTab('wrong')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'wrong'
                  ? "bg-[var(--danger)] text-white shadow-sm"
                  : "bg-[var(--background)] hover:bg-[var(--surface-hover)]"
              )}
              style={activeTab !== 'wrong' ? { color: 'var(--text-secondary)' } : {}}
            >
              ✗ Wrong Position ({wrongPositionItems.length})
            </button>
          )}
        </div>
      </div>

      {/* ========== TAB CONTENT ========== */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {/* ---------- SUMMARY TAB ---------- */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* General Feedback */}
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
                        dangerouslySetInnerHTML={{ __html: config.generalFeedback || '' }}
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Summary Lists */}
              <div className={clsx(
                "space-y-2",
                hasGeneralFeedback ? "lg:col-span-1" : "lg:col-span-2"
              )}>
                {/* Correct Items Summary */}
                {hasCorrect && (
                  <div className="rounded-lg p-2.5 bg-[var(--success-light)] border border-[var(--success)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✓</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--success-dark)' }}
                      >
                        Correct Position ({correctItems.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {correctItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--success-dark)' }}
                          >
                            Position {item.correctPosition}: {item.content}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Wrong Position Items Summary */}
                {hasWrong && (
                  <div className="rounded-lg p-2.5 bg-[var(--danger-light)] border border-[var(--danger)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✗</span>
                      <span 
                        className="font-medium text-[var(--text-xs)]" 
                        style={{ color: 'var(--danger-dark)' }}
                      >
                        Wrong Position ({wrongPositionItems.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {wrongPositionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span 
                            className="font-medium break-words text-[var(--text-xs)]" 
                            style={{ color: 'var(--danger-dark)' }}
                          >
                            {item.content} (placed at {item.userPosition}, should be {item.correctPosition})
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

        {/* ---------- CORRECT POSITION TAB ---------- */}
        {activeTab === 'correct' && hasCorrect && (
          <div className="space-y-2">
            {correctItems.map((item, idx) => (
              <div 
                key={idx}
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
                          Step {item.correctPosition}: {item.content}
                        </h4>
                        <p className="text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Placed in correct position
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
            ))}
          </div>
        )}

        {/* ---------- WRONG POSITION TAB ---------- */}
        {activeTab === 'wrong' && hasWrong && (
          <div className="space-y-2">
            {wrongPositionItems.map((item, idx) => (
              <div 
                key={idx}
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
                            Your position: <span className="font-medium" style={{ color: 'var(--danger-dark)' }}>Step {item.userPosition}</span>
                          </p>
                          <p style={{ color: 'var(--text-secondary)' }}>
                            Correct position: <span className="font-medium" style={{ color: 'var(--success-dark)' }}>Step {item.correctPosition}</span>
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
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}