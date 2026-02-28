// packages/shared/gamification/streakCalculator.ts
// Streak calculation logic — determines how daily streaks increment, hold, or reset

// ============================================
// TYPES
// ============================================

export interface StreakCalculationParams {
    currentStreak: number
    longestStreak: number
    lastActivity: Date | null
  }
  
  export interface StreakResult {
    newStreak: number
    newLongestStreak: number
    streakChanged: boolean   // true if streak was incremented or reset (not same-day)
    wasReset: boolean        // true if streak was broken (missed 1+ days)
  }
  
  // ============================================
  // CORE FUNCTION
  // ============================================
  
  /**
   * Calculate new streak values based on last activity date.
   *
   * Rules:
   *  - No lastActivity (first ever)  → streak = 1
   *  - lastActivity was TODAY         → no change (multiple lessons same day don't re-increment)
   *  - lastActivity was YESTERDAY     → streak + 1 (consecutive day)
   *  - lastActivity was 2+ days ago   → streak resets to 1 (missed day)
   *
   * longestStreak is always updated to Math.max(longestStreak, newStreak)
   *
   * NOTE: Comparison is done in LOCAL calendar days (midnight boundaries),
   * not 24-hour rolling windows. This means completing a lesson at 11:59 PM
   * and another at 12:01 AM the next day correctly counts as consecutive days.
   */
  export function calculateNewStreak(params: StreakCalculationParams): StreakResult {
    const { currentStreak, longestStreak, lastActivity } = params
  
    // Get today as a clean midnight date (strips time component)
    const now = new Date()
    const today = toMidnight(now)
  
    // ── Case 1: First ever activity ──────────────────────────────────────────
    if (!lastActivity) {
      const newStreak = 1
      return {
        newStreak,
        newLongestStreak: Math.max(newStreak, longestStreak),
        streakChanged: true,
        wasReset: false
      }
    }
  
    // Get last activity as a clean midnight date for day-level comparison
    const lastDay = toMidnight(new Date(lastActivity))
  
    // Difference in whole calendar days
    const diffDays = Math.round(
      (today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24)
    )
  
    // ── Case 2: Same calendar day ─────────────────────────────────────────────
    // User already did something today — streak stays exactly as-is
    if (diffDays === 0) {
      return {
        newStreak: currentStreak,
        newLongestStreak: longestStreak,
        streakChanged: false,
        wasReset: false
      }
    }
  
    // ── Case 3: Consecutive day (yesterday) ──────────────────────────────────
    if (diffDays === 1) {
      const newStreak = currentStreak + 1
      return {
        newStreak,
        newLongestStreak: Math.max(newStreak, longestStreak),
        streakChanged: true,
        wasReset: false
      }
    }
  
    // ── Case 4: Missed one or more days ──────────────────────────────────────
    // Streak is broken — reset to 1 (today counts as day 1 of new streak)
    const newStreak = 1
    return {
      newStreak,
      newLongestStreak: Math.max(newStreak, longestStreak), // keep historical best
      streakChanged: true,
      wasReset: true
    }
  }
  
  // ============================================
  // HELPERS
  // ============================================
  
  /**
   * Strip time from a Date, returning midnight of that calendar day (local time).
   * This ensures day comparisons are not affected by time-of-day differences.
   */
  function toMidnight(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate())
  }