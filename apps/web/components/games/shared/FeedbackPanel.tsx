// apps/web/components/games/shared/FeedbackPanel.tsx
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

type HotspotFeedback = {
  label: string;
  explanation?: string;  // Truly optional
};

type FeedbackPanelProps = {
  generalFeedback?: string;
  foundHotspots: HotspotFeedback[];
  missedHotspots: HotspotFeedback[];
  totalHotspots: number;
  mode: 'lesson' | 'quiz';
  defaultExpanded?: boolean;  // Control initial state
};

type SectionProps = {
  title: string;
  icon: string;
  items: HotspotFeedback[];
  bgColor: string;
  borderColor: string;
  textColor: string;
  defaultExpanded: boolean;
};

function CollapsibleSection({ 
  title, 
  icon, 
  items, 
  bgColor, 
  borderColor, 
  textColor,
  defaultExpanded 
}: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (items.length === 0) return null;

  return (
    <div className={clsx("rounded-lg border-2 overflow-hidden", borderColor)}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={clsx(
          "w-full flex items-center justify-between p-4 text-left transition-colors",
          bgColor,
          "hover:opacity-90"
        )}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className={clsx("font-semibold text-base", textColor)}>
            {title} ({items.length})
          </span>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 0 : -90 }}
          transition={{ duration: 0.2 }}
          className={textColor}
        >
          ▼
        </motion.span>
      </button>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className={clsx("p-4 space-y-3 bg-white", borderColor, "border-t-2")}>
              {items.map((item, index) => (
                <div key={index} className="space-y-1">
                  {/* Hotspot Label */}
                  <div className="flex items-start gap-2">
                    <span className="text-gray-700 mt-0.5">•</span>
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </div>
                  
                  {/* Explanation (if exists) */}
                  {item.explanation && (
                    <div 
                      className={clsx(
                        "ml-4 p-3 rounded-md text-sm",
                        bgColor.replace('bg-', 'bg-opacity-30 bg-')
                      )}
                    >
                      <div
                        className="prose prose-sm max-w-none"
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

  // Don't render if there's no feedback content at all
  const hasContent = generalFeedback || 
                     foundHotspots.some(h => h.explanation) || 
                     missedHotspots.some(h => h.explanation);

  // If there's no rich content and we're in a mode where we just show results, maybe skip
  // But let's always show the panel structure for consistency
  
  return (
    <div className="mt-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4">
        <span className="text-xl">📊</span>
        <h3 className="text-lg font-bold text-gray-900">
          Review: {foundHotspots.length}/{totalHotspots} Hotspots Found
        </h3>
      </div>

      {/* General Feedback Section */}
      {generalFeedback && (
        <div className="rounded-lg border-2 border-blue-200 overflow-hidden">
          <button
            onClick={() => setIsGeneralExpanded(!isGeneralExpanded)}
            className="w-full flex items-center justify-between p-4 text-left bg-blue-50 hover:opacity-90 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">💬</span>
              <span className="font-semibold text-base text-blue-900">
                General Feedback
              </span>
            </div>
            <motion.span
              animate={{ rotate: isGeneralExpanded ? 0 : -90 }}
              transition={{ duration: 0.2 }}
              className="text-blue-900"
            >
              ▼
            </motion.span>
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
                <div className="p-4 bg-white border-t-2 border-blue-200">
                  <div
                    className="prose prose-sm max-w-none text-gray-700"
                    dangerouslySetInnerHTML={{ __html: generalFeedback }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Found Hotspots Section */}
      <CollapsibleSection
        title="What You Found Correctly"
        icon="✅"
        items={foundHotspots}
        bgColor="bg-green-50"
        borderColor="border-green-200"
        textColor="text-green-900"
        defaultExpanded={defaultExpanded}
      />

      {/* Missed Hotspots Section */}
      <CollapsibleSection
        title="What You Missed"
        icon="❌"
        items={missedHotspots}
        bgColor="bg-red-50"
        borderColor="border-red-200"
        textColor="text-red-900"
        defaultExpanded={defaultExpanded}
      />
    </div>
  );
}