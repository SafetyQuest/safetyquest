// apps/web/components/games/shared/FeedbackPanel.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type HotspotFeedback = {
  label: string;
  explanation?: string;
};

type FeedbackPanelProps = {
  generalFeedback?: string;
  foundHotspots: HotspotFeedback[];
  missedHotspots: HotspotFeedback[];
  totalHotspots: number;
  mode: 'lesson' | 'quiz';
  defaultExpanded?: boolean;
};

type SectionProps = {
  title: string;
  icon: string;
  items: HotspotFeedback[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  defaultExpanded: boolean;
};

function CollapsibleSection({ 
  title, 
  icon, 
  items, 
  bgColor, 
  borderColor, 
  textColor,
  accentColor,
  defaultExpanded 
}: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div 
      className={clsx(
        "rounded-xl overflow-hidden transition-all duration-[--transition-base]",
        borderColor,
        "border border-[var(--border)] hover:shadow-md"
      )}
    >
      {/* Header - Modern gradient accent */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full flex items-center justify-between p-5 text-left transition-all duration-[--transition-fast]",
          bgColor,
          "hover:opacity-95 group"
        )}
      >
        <div className="flex items-center gap-3 flex-1">
          <span 
            className={clsx(
              "text-xl w-8 h-8 rounded-full flex items-center justify-center",
              accentColor,
              "text-[var(--text-inverse)] shadow-sm"
            )}
          >
            {icon}
          </span>
          <div className="flex-1">
            <span className={clsx("font-semibold text-[var(--text-xl)]", textColor)}>
              {title}
            </span>
            <span className="ml-2 text-[var(--text-sm)] text-[var(--text-muted)]">
              ({items.length})
            </span>
          </div>
        </div>
        
        {/* Animated chevron with brand styling */}
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={clsx("w-8 h-8 rounded-full flex items-center justify-center", bgColor.replace('bg-', 'bg-opacity-20 bg-'))}
        >
          <svg 
            className={clsx("w-5 h-5 transition-transform", textColor)}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Content - Clean card layout */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={clsx("p-5 space-y-4 bg-[var(--background)]", "border-t border-[var(--border)]")}>
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "rounded-lg p-4 border border-[var(--border)]",
                    "bg-[var(--surface)] hover:bg-[var(--surface-hover)]",
                    "transition-all duration-[--transition-fast]",
                    "hover:shadow-sm hover:-translate-y-0.5"
                  )}
                >
                  {/* Hotspot Label with Icon */}
                  <div className="flex items-start gap-3 mb-2">
                    <span className={clsx("text-lg mt-1 flex-shrink-0", textColor)}>
                      {icon}
                    </span>
                    <h4 className={clsx("font-semibold text-[var(--text-lg)] text-[var(--text-primary)] flex-1", "break-words")}>
                      {item.label}
                    </h4>
                  </div>
                  
                  {/* Explanation (if exists) - Rich text with brand styling */}
                  {item.explanation && (
                    <div 
                      className={clsx(
                        "mt-3 p-3 rounded-md border",
                        borderColor,
                        "bg-opacity-10",
                        bgColor
                      )}
                    >
                      <div
                        className="prose prose-sm max-w-none"
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: 'var(--text-base)',
                          lineHeight: 'var(--line-height-relaxed)',
                        }}
                        dangerouslySetInnerHTML={{ __html: item.explanation }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FeedbackPanel({
  generalFeedback,
  foundHotspots,
  missedHotspots,
  totalHotspots,
  mode,
  defaultExpanded = true
}: FeedbackPanelProps) {
  const [isGeneralExpanded, setIsGeneralExpanded] = useState(defaultExpanded);
  const foundCount = foundHotspots.length;
  const missedCount = missedHotspots.length;
  const accuracy = Math.round((foundCount / totalHotspots) * 100);

  // Don't render if there's no feedback content at all
  const hasContent = generalFeedback || 
                     foundHotspots.some(h => h.explanation) || 
                     missedHotspots.some(h => h.explanation);

  if (!hasContent && mode === 'quiz') {
    return null;
  }

  return (
    <div className="mt-8 space-y-5 max-w-4xl mx-auto">
      {/* Header - Brand-aligned with TetraPak SafetyQuest theme */}
      <div 
        className="rounded-xl p-6 bg-gradient-to-r from-[var(--primary-surface)] to-[var(--surface)]"
        style={{
          border: '2px solid var(--primary-light)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                boxShadow: '0 4px 12px rgba(2, 63, 136, 0.3)',
              }}
            >
              <span className="text-3xl text-[var(--text-inverse)]">🎯</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 
                className="text-[var(--text-2xl)] font-bold text-[var(--text-primary)] mb-1 truncate"
                style={{ lineHeight: 'var(--line-height-tight)' }}
              >
                Hotspot Review
              </h2>
              <div className="flex items-center gap-4 flex-wrap">
                <span 
                  className="text-[var(--text-lg)] font-semibold text-[var(--text-secondary)]"
                  style={{ lineHeight: 'var(--line-height-normal)' }}
                >
                  {foundCount} of {totalHotspots} found
                </span>
                
                {/* Accuracy Badge */}
                <span
                  className={clsx(
                    "px-4 py-1.5 rounded-full text-[var(--text-sm)] font-medium",
                    accuracy === 100 ? "bg-[var(--success-light)] text-[var(--success-dark)] border border-[var(--success)]" :
                    accuracy >= 70 ? "bg-[var(--warning-light)] text-[var(--warning-dark)] border border-[var(--warning)]" :
                    "bg-[var(--danger-light)] text-[var(--danger-dark)] border border-[var(--danger)]"
                  )}
                >
                  {accuracy}% Accuracy
                </span>
              </div>
            </div>
          </div>
          
          {/* Visual Progress Indicator */}
          <div className="flex-1 min-w-[200px] max-w-[300px]">
            <div className="w-full bg-[var(--surface)] rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-[--transition-slow] ease-out"
                style={{
                  width: `${(foundCount / totalHotspots) * 100}%`,
                  background: `linear-gradient(90deg, var(--success) 0%, var(--success-dark) 100%)`,
                  boxShadow: '0 2px 8px rgba(141, 198, 63, 0.3)',
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[var(--text-xs)] text-[var(--text-muted)]">
              <span>0%</span>
              <span>{accuracy}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>

      {/* General Feedback Section - Prominent callout */}
      {generalFeedback && (
        <div 
          className="rounded-xl overflow-hidden transition-all duration-[--transition-base]"
          style={{
            border: '2px solid var(--primary-light)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <button
            onClick={() => setIsGeneralExpanded(!isGeneralExpanded)}
            className="w-full flex items-center justify-between p-5 text-left bg-gradient-to-r from-[var(--primary-surface)] to-[var(--surface)] hover:opacity-95 transition-all duration-[--transition-fast] group"
          >
            <div className="flex items-center gap-3 flex-1">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)',
                  boxShadow: '0 4px 8px rgba(0, 189, 242, 0.3)',
                }}
              >
                <span className="text-xl text-[var(--text-inverse)]">💡</span>
              </div>
              <div className="flex-1">
                <span className="font-semibold text-[var(--text-xl)] text-[var(--primary-dark)]">
                  General Feedback
                </span>
              </div>
            </div>
            
            <motion.div
              animate={{ rotate: isGeneralExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--primary-surface)]"
            >
              <svg 
                className="w-5 h-5 text-[var(--primary)] transition-transform"
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>

          <AnimatePresence>
            {isGeneralExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div 
                  className="p-6 bg-[var(--background)] border-t border-[var(--border)]"
                  style={{
                    borderTop: '2px solid var(--primary-light)',
                  }}
                >
                  <div
                    className="prose prose-lg max-w-none"
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: 'var(--text-base)',
                      lineHeight: 'var(--line-height-relaxed)',
                    }}
                    dangerouslySetInnerHTML={{ __html: generalFeedback }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Found Hotspots Section - Success themed */}
      <CollapsibleSection
        title="What You Found Correctly"
        icon="✓"
        items={foundHotspots}
        bgColor="bg-[var(--success-light)]"
        borderColor="border-[var(--success)]"
        textColor="text-[var(--success-dark)]"
        accentColor="bg-[var(--success)]"
        defaultExpanded={defaultExpanded}
      />

      {/* Missed Hotspots Section - Warning/Danger themed */}
      {missedCount > 0 && (
        <CollapsibleSection
          title="What You Missed"
          icon="!"
          items={missedHotspots}
          bgColor="bg-[var(--danger-light)]"
          borderColor="border-[var(--danger)]"
          textColor="text-[var(--danger-dark)]"
          accentColor="bg-[var(--danger)]"
          defaultExpanded={defaultExpanded}
        />
      )}
    </div>
  );
}