// apps/web/components/games/shared/FloatingTimerBadge.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { TimerPhase, formatTime } from '../utils/timerUtils';

type FloatingTimerBadgeProps = {
  timeRemaining: number;
  timeLimit: number;
  timerPhase: TimerPhase;
};

/**
 * Floating Timer Badge - Centralized timer UI for all time-attack games
 * 
 * Features:
 * - Fixed position: right side, vertically centered
 * - Progressive urgency: colors and animations based on phase
 * - Consistent design across all time-attack games
 */
export default function FloatingTimerBadge({
  timeRemaining,
  timeLimit,
  timerPhase,
}: FloatingTimerBadgeProps) {
  return (
    <motion.div
      className={clsx(
        // Position: Fixed right side, vertically centered
        "fixed right-6 top-1/2 -translate-y-1/2 z-50",
        
        // Base styling
        "rounded-2xl shadow-2xl px-5 py-4",
        "flex flex-col items-center justify-center",
        "border-3 transition-all duration-300",
        
        // Phase-based styling and animations
        timerPhase === 'calm' && "bg-white border-gray-300 timer-calm",
        timerPhase === 'warning' && "bg-orange-50 border-orange-400 timer-warning",
        timerPhase === 'critical' && "bg-red-50 border-red-500 timer-critical",
        timerPhase === 'final' && "bg-red-100 border-red-600 timer-final"
      )}
      animate={{
        scale: timerPhase === 'final' ? 1.1 : timerPhase === 'critical' ? 1.05 : 1,
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Label */}
      <span className="text-xs font-medium text-gray-600 mb-1">TIME</span>
      
      {/* Timer Display */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">⏱️</span>
        <span
          className={clsx(
            "font-mono font-bold transition-all",
            timerPhase === 'calm' && "text-gray-700 text-xl",
            timerPhase === 'warning' && "text-orange-600 text-2xl",
            timerPhase === 'critical' && "text-red-600 text-2xl",
            timerPhase === 'final' && "text-red-700 text-3xl"
          )}
        >
          {formatTime(timeRemaining)}
        </span>
      </div>
      
      {/* Optional: Show time limit on hover */}
      <div className="mt-1 text-[10px] text-gray-400 opacity-0 hover:opacity-100 transition-opacity">
        / {formatTime(timeLimit)}
      </div>
    </motion.div>
  );
}