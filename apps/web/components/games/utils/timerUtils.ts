// apps/web/components/games/utils/timerUtils.ts

/**
 * Timer phase type for all time-attack games
 */
export type TimerPhase = 'calm' | 'warning' | 'critical' | 'final';

/**
 * Timer state that games send to GameRenderer
 */
export type TimerState = {
  timeRemaining: number;
  timeLimit: number;
  timerPhase: TimerPhase;
};

/**
 * Calculate timer phase based on remaining time
 * Shared logic used by all time-attack games for consistency
 * 
 * @param timeRemaining - Seconds remaining
 * @returns Timer phase
 */
export const calculateTimerPhase = (timeRemaining: number): TimerPhase => {
  if (timeRemaining > 20) return 'calm';       // >20s: Calm (soft grey pulse)
  if (timeRemaining > 10) return 'warning';    // 20-11s: Warning (amber pulse)
  if (timeRemaining > 5) return 'critical';    // 10-6s: Critical (red pulse + shake)
  return 'final';                              // 5-0s: Final (intense red + rapid shake)
};

/**
 * Format seconds to MM:SS display
 * 
 * @param seconds - Total seconds
 * @returns Formatted time string (e.g., "1:23")
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};