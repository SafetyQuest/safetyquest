// apps/web/components/games/shared/FloatingTimerBadge.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { TimerPhase } from '../utils/timerUtils';

type FloatingTimerBadgeProps = {
  timeRemaining: number;
  timeLimit: number;
  timerPhase: TimerPhase;
};

/**
 * Floating Timer Badge - Centralized timer UI for all time-attack games
 * 
 * Mobile Responsive:
 * - Desktop: Right side, vertically centered
 * - Mobile: Top-right corner, compact size
 * 
 * Note: Uses Framer Motion for animations instead of CSS classes
 * to avoid position conflicts with timer-shake animations in globals.css
 */
export default function FloatingTimerBadge({
  timeRemaining,
  timeLimit,
  timerPhase,
}: FloatingTimerBadgeProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  // Get color scheme based on phase
  const getColors = () => {
    switch (timerPhase) {
      case 'calm':
        return {
          bg: 'bg-white',
          border: 'border-gray-300',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          glow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-400',
          text: 'text-amber-600',
          icon: 'text-amber-600',
          glow: '0 0 15px rgba(251, 191, 36, 0.4)'
        };
      case 'critical':
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-500',
          text: 'text-orange-600',
          icon: 'text-orange-600',
          glow: '0 0 25px rgba(249, 115, 22, 0.5)'
        };
      case 'final':
        return {
          bg: 'bg-red-100',
          border: 'border-red-600',
          text: 'text-red-700',
          icon: 'text-red-600',
          glow: '0 0 35px rgba(220, 38, 38, 0.6)'
        };
      default:
        return {
          bg: 'bg-white',
          border: 'border-gray-300',
          text: 'text-gray-700',
          icon: 'text-gray-600',
          glow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        };
    }
  };

  const colors = getColors();

  // Shake animation for critical/final phases (without translateY)
  const getShakeAnimation = () => {
    if (timerPhase === 'final') {
      return {
        x: [0, -5, 5, -5, 5, -3, 3, -2, 2, -1, 1, 0],
        transition: {
          duration: 0.75,
          repeat: Infinity,
          repeatType: 'loop' as const
        }
      };
    }
    if (timerPhase === 'critical') {
      return {
        x: [0, -3, 3, -3, 3, 0],
        transition: {
          duration: 0.75,
          repeat: Infinity,
          repeatType: 'loop' as const
        }
      };
    }
    return {};
  };

  return (
    <motion.div
      className={clsx(
        // Mobile: Top-right corner, compact (below header)
        "fixed top-[80px] right-4 z-50",
        // Desktop: Right side, vertically centered, larger
        "md:top-1/2 md:right-6 md:-translate-y-1/2",
        
        // Base styling
        "rounded-xl md:rounded-2xl",
        "px-3 py-2 md:px-5 md:py-4",
        "flex flex-col items-center justify-center",
        "border-2 md:border-3",
        
        // Phase-based colors (no CSS animations that use transform)
        colors.bg,
        colors.border
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: timerPhase === 'final' ? 1.1 : timerPhase === 'critical' ? 1.05 : 1,
        ...getShakeAnimation()
      }}
      transition={{ duration: 0.3 }}
      style={{
        boxShadow: colors.glow
      }}
    >
      {/* Label */}
      <span className="text-[10px] md:text-xs font-medium text-gray-600 mb-0.5 md:mb-1 uppercase tracking-wide">
        TIME
      </span>
      
      {/* Timer Display */}
      <div className="flex items-center gap-1 md:gap-2">
        <svg 
          className={clsx("w-4 h-4 md:w-5 md:h-5", colors.icon)}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
        </svg>
        <motion.span
          className={clsx(
            "font-mono font-bold tabular-nums",
            colors.text,
            timerPhase === 'calm' && "text-lg md:text-xl",
            timerPhase === 'warning' && "text-xl md:text-2xl",
            timerPhase === 'critical' && "text-xl md:text-2xl",
            timerPhase === 'final' && "text-2xl md:text-3xl"
          )}
          animate={{
            scale: timerPhase === 'final' ? [1, 1.05, 1] : 1
          }}
          transition={{
            duration: 0.8,
            repeat: timerPhase === 'final' ? Infinity : 0,
            repeatType: 'loop'
          }}
        >
          {minutes}:{String(seconds).padStart(2, '0')}
        </motion.span>
      </div>
    </motion.div>
  );
}