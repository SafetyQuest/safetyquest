// apps/web/components/games/shared/ScenarioResultsWithFeedbackCard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

type ScenarioOption = {
  id: string;
  text: string;
  correct: boolean;
  feedback?: string;
  imageUrl?: string;
  xp?: number;
  points?: number;
};

type ScenarioResultsWithFeedbackCardProps = {
  config: {
    options: ScenarioOption[];
    allowMultipleCorrect?: boolean;
    generalFeedback?: string;
  };
  userActions: {
    selectedIds: string[];
  };
  metrics: {
    correctCount: number;
    incorrectCount: number;
    missedCount: number;
    totalCorrect: number;
    earnedXp?: number;
    earnedPoints?: number;
    attempts: number;
  };
  mode: 'lesson' | 'quiz';
  onTryAgain?: () => void;
};

type EnrichedOption = ScenarioOption & {
  letterBadge: string;
  reward: number;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScenarioResultsWithFeedbackCard({
  config,
  userActions,
  metrics,
  mode,
  onTryAgain,
}: ScenarioResultsWithFeedbackCardProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'correct' | 'incorrect' | 'missed'>('summary');

  const isQuiz = mode === 'quiz';

  // ============================================================================
  // INTERNAL PROCESSING
  // ============================================================================

  const getOptionById = (id: string): ScenarioOption | undefined => {
    return config.options.find(opt => opt.id === id);
  };

  const getLetterBadge = (optionId: string): string => {
    const index = config.options.findIndex(opt => opt.id === optionId);
    return index >= 0 ? String.fromCharCode(65 + index) : '?';
  };

  const getReward = (option: ScenarioOption): number => {
    return isQuiz ? (option.points || 0) : (option.xp || 0);
  };

  const { correctSelections, incorrectSelections, missedOptions } = useMemo(() => {
    const correct: EnrichedOption[] = [];
    const incorrect: EnrichedOption[] = [];
    const missed: EnrichedOption[] = [];

    // 🔧 FIX: Ensure selectedIds is an array before processing
    const selectedIds = Array.isArray(userActions.selectedIds) ? userActions.selectedIds : [];
    const selectedSet = new Set(selectedIds);

    // 🔧 FIX: Use safe array instead of directly calling forEach
    selectedIds.forEach(id => {
      const option = getOptionById(id);
      if (!option) return;

      const enriched: EnrichedOption = {
        ...option,
        letterBadge: getLetterBadge(id),
        reward: getReward(option),
      };

      if (option.correct) {
        correct.push(enriched);
      } else {
        incorrect.push(enriched);
      }
    });

    if (config.allowMultipleCorrect) {
      config.options.forEach(option => {
        if (option.correct && !selectedSet.has(option.id)) {
          missed.push({
            ...option,
            letterBadge: getLetterBadge(option.id),
            reward: getReward(option),
          });
        }
      });
    }

    return { correctSelections: correct, incorrectSelections: incorrect, missedOptions: missed };
  }, [config.options, config.allowMultipleCorrect, userActions.selectedIds, isQuiz]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const success = metrics.correctCount === metrics.totalCorrect && metrics.incorrectCount === 0;
  const hasGeneralFeedback = !!config.generalFeedback?.trim();
  const hasCorrect = correctSelections.length > 0;
  const hasIncorrect = incorrectSelections.length > 0;
  const hasMissed = missedOptions.length > 0;

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
              {metrics.correctCount}/{metrics.totalCorrect}
            </span>
          </div>
          
          {metrics.incorrectCount > 0 && (
            <>
              <div className="w-px h-3 bg-[var(--border-medium)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Incorrect:</span>
                <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--danger-dark)' }}>
                  {metrics.incorrectCount}
                </span>
              </div>
            </>
          )}
          
          {hasMissed && (
            <>
              <div className="w-px h-3 bg-[var(--border-medium)]" />
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>Missed:</span>
                <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--warning-dark)' }}>
                  {metrics.missedCount}
                </span>
              </div>
            </>
          )}
          
          <div className="w-px h-3 bg-[var(--border-medium)]" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-xs)]" style={{ color: 'var(--text-muted)' }}>
              {isQuiz ? 'Points:' : 'XP:'}
            </span>
            <span className="text-[var(--text-base)] font-bold" style={{ color: 'var(--highlight)' }}>
              +{isQuiz ? (metrics.earnedPoints || 0) : (metrics.earnedXp || 0)}
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
        <div className="flex gap-1.5 flex-wrap">
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
              ✓ Correct ({correctSelections.length})
            </button>
          )}
          
          {hasIncorrect && (
            <button
              onClick={() => setActiveTab('incorrect')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'incorrect'
                  ? "bg-[var(--danger)] text-white shadow-sm"
                  : "bg-[var(--background)] hover:bg-[var(--surface-hover)]"
              )}
              style={activeTab !== 'incorrect' ? { color: 'var(--text-secondary)' } : {}}
            >
              ✗ Incorrect ({incorrectSelections.length})
            </button>
          )}
          
          {hasMissed && (
            <button
              onClick={() => setActiveTab('missed')}
              className={clsx(
                "px-3 py-1.5 text-[var(--text-xs)] font-medium rounded-md transition-all flex items-center gap-1",
                activeTab === 'missed'
                  ? "bg-[var(--warning)] text-white shadow-sm"
                  : "bg-[var(--background)] hover:bg-[var(--surface-hover)]"
              )}
              style={activeTab !== 'missed' ? { color: 'var(--text-secondary)' } : {}}
            >
              ⏱️ Missed ({missedOptions.length})
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
              
              <div className={clsx("space-y-2", hasGeneralFeedback ? "lg:col-span-1" : "lg:col-span-2")}>
                {hasCorrect && (
                  <div className="rounded-lg p-2.5 bg-[var(--success-light)] border border-[var(--success)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">✓</span>
                      <span className="font-medium text-[var(--text-xs)]" style={{ color: 'var(--success-dark)' }}>
                        Correct Selections ({correctSelections.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {correctSelections.map((option, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span className="font-medium break-words text-[var(--text-xs)]" style={{ color: 'var(--success-dark)' }}>
                            {option.letterBadge}: {option.text}
                            {option.reward > 0 && ` (+${option.reward} ${isQuiz ? 'pts' : 'XP'})`}
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
                      <span className="font-medium text-[var(--text-xs)]" style={{ color: 'var(--danger-dark)' }}>
                        Incorrect Selections ({incorrectSelections.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {incorrectSelections.map((option, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span className="font-medium break-words text-[var(--text-xs)]" style={{ color: 'var(--danger-dark)' }}>
                            {option.letterBadge}: {option.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {hasMissed && (
                  <div className="rounded-lg p-2.5 bg-[var(--warning-light)] border border-[var(--warning)]">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-base">⏱️</span>
                      <span className="font-medium text-[var(--text-xs)]" style={{ color: 'var(--warning-dark)' }}>
                        Missed Opportunities ({missedOptions.length})
                      </span>
                    </div>
                    <ul className="space-y-0.5 text-[var(--text-xs)] max-h-24 overflow-y-auto pr-1">
                      {missedOptions.map((option, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-[var(--text-xs)] mt-0.5 flex-shrink-0">•</span>
                          <span className="font-medium break-words text-[var(--text-xs)]" style={{ color: 'var(--warning-dark)' }}>
                            {option.letterBadge}: {option.text}
                            {option.reward > 0 && ` (potential +${option.reward} ${isQuiz ? 'pts' : 'XP'})`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {success && (
                  <div className="rounded-lg p-2 bg-[var(--success-light)] border border-[var(--success)] text-center">
                    <p className="text-[var(--text-xs)] font-medium flex items-center justify-center gap-1" style={{ color: 'var(--success-dark)' }}>
                      <span className="text-sm">🌟</span>
                      Excellent work! You've mastered this scenario.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------- CORRECT TAB ---------- */}
        {activeTab === 'correct' && hasCorrect && (
          <div className="space-y-2">
            {correctSelections.map((option, idx) => (
              <div key={idx} className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-start gap-2">
                  {option.imageUrl && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 mb-1">
                      <span className="text-base mt-0.5" style={{ color: 'var(--success)' }}>✓</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--text-sm)] break-words" style={{ color: 'var(--success-dark)' }}>
                          {option.letterBadge}: {option.text}
                        </h4>
                        <p className="text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Correct selection{option.reward > 0 && ` • Earned +${option.reward} ${isQuiz ? 'pts' : 'XP'}`}
                        </p>
                      </div>
                    </div>
                    {option.feedback && (
                      <div className="mt-1.5 p-2 rounded bg-[var(--success-light)] border border-[var(--success)]">
                        <div className="prose prose-xs" style={{ color: 'var(--success-dark)', fontSize: 'var(--text-sm)' }} dangerouslySetInnerHTML={{ __html: option.feedback }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- INCORRECT TAB ---------- */}
        {activeTab === 'incorrect' && hasIncorrect && (
          <div className="space-y-2">
            {incorrectSelections.map((option, idx) => (
              <div key={idx} className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-start gap-2">
                  {option.imageUrl && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 mb-1">
                      <span className="text-base mt-0.5" style={{ color: 'var(--danger)' }}>✗</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--text-sm)] break-words" style={{ color: 'var(--danger-dark)' }}>
                          {option.letterBadge}: {option.text}
                        </h4>
                        <p className="text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Incorrect selection
                        </p>
                      </div>
                    </div>
                    {option.feedback && (
                      <div className="mt-1.5 p-2 rounded bg-[var(--danger-light)] border border-[var(--danger)]">
                        <div className="prose prose-xs" style={{ color: 'var(--danger-dark)', fontSize: 'var(--text-sm)' }} dangerouslySetInnerHTML={{ __html: option.feedback }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------- MISSED TAB ---------- */}
        {activeTab === 'missed' && hasMissed && (
          <div className="space-y-2">
            {missedOptions.map((option, idx) => (
              <div key={idx} className="rounded-lg p-2.5 bg-[var(--background)] border border-[var(--border)] hover:bg-[var(--surface-hover)] transition-colors">
                <div className="flex items-start gap-2">
                  {option.imageUrl && (
                    <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-[var(--border)]">
                      <img src={option.imageUrl} alt={option.text} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 mb-1">
                      <span className="text-base mt-0.5" style={{ color: 'var(--warning)' }}>⏱️</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--text-sm)] break-words" style={{ color: 'var(--warning-dark)' }}>
                          {option.letterBadge}: {option.text}
                        </h4>
                        <p className="text-[var(--text-xs)] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          Correct answer (not selected){option.reward > 0 && ` • Potential +${option.reward} ${isQuiz ? 'pts' : 'XP'}`}
                        </p>
                      </div>
                    </div>
                    {option.feedback && (
                      <div className="mt-1.5 p-2 rounded bg-[var(--warning-light)] border border-[var(--warning)]">
                        <div className="prose prose-xs" style={{ color: 'var(--warning-dark)', fontSize: 'var(--text-sm)' }} dangerouslySetInnerHTML={{ __html: option.feedback }} />
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