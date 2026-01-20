// packages/shared/gamification/xpCalculator.ts
// XP calculation logic with difficulty multipliers, level bonuses, and performance bonuses

import { getLevelMultiplier } from './levelSystem'

// ============================================
// TYPES
// ============================================

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface XpCalculationParams {
  baseXp: number
  lessonDifficulty: Difficulty
  userLevel: number
  scorePercentage: number
}

export interface XpBreakdown {
  baseXp: number
  difficultyMultiplier: number
  difficultyXp: number
  levelMultiplier: number
  levelXp: number
  performanceBonus: number
  performanceLabel: string
  totalXp: number
  formula: string
}

// ============================================
// MULTIPLIERS & BONUSES
// ============================================

export const difficultyMultipliers: Record<Difficulty, number> = {
  'Beginner': 1.0,
  'Intermediate': 1.5,
  'Advanced': 2.0
}

export const performanceBonuses = {
  perfect: { threshold: 100, bonus: 50, label: 'Perfect!' },
  excellent: { threshold: 90, bonus: 25, label: 'Excellent' },
  good: { threshold: 80, bonus: 10, label: 'Good' },
  pass: { threshold: 70, bonus: 0, label: 'Pass' },
  fail: { threshold: 0, bonus: 0, label: 'Keep Trying' }
} as const

// ============================================
// CALCULATION FUNCTIONS
// ============================================

/**
 * Get difficulty multiplier
 */
export function getDifficultyMultiplier(difficulty: Difficulty): number {
  return difficultyMultipliers[difficulty] || 1.0
}

/**
 * Get performance bonus based on score percentage
 */
export function getPerformanceBonus(scorePercentage: number): { bonus: number; label: string } {
  if (scorePercentage === 100) {
    return { bonus: performanceBonuses.perfect.bonus, label: performanceBonuses.perfect.label }
  }
  if (scorePercentage >= 90) {
    return { bonus: performanceBonuses.excellent.bonus, label: performanceBonuses.excellent.label }
  }
  if (scorePercentage >= 80) {
    return { bonus: performanceBonuses.good.bonus, label: performanceBonuses.good.label }
  }
  if (scorePercentage >= 70) {
    return { bonus: performanceBonuses.pass.bonus, label: performanceBonuses.pass.label }
  }
  return { bonus: performanceBonuses.fail.bonus, label: performanceBonuses.fail.label }
}

/**
 * Calculate final XP with full breakdown
 * 
 * Formula: Final XP = (Base XP × Difficulty Multiplier × Level Multiplier) + Performance Bonus
 */
export function calculateXp(params: XpCalculationParams): XpBreakdown {
  const { baseXp, lessonDifficulty, userLevel, scorePercentage } = params
  
  // Get multipliers
  const difficultyMultiplier = getDifficultyMultiplier(lessonDifficulty)
  const levelMultiplier = getLevelMultiplier(userLevel)
  
  // Get performance bonus
  const { bonus: performanceBonus, label: performanceLabel } = getPerformanceBonus(scorePercentage)
  
  // Calculate intermediate values
  const afterDifficulty = baseXp * difficultyMultiplier
  const afterLevel = afterDifficulty * levelMultiplier
  
  // Calculate total (rounded)
  const totalXp = Math.round(afterLevel + performanceBonus)
  
  // Build formula string for display
  const formula = `(${baseXp} × ${difficultyMultiplier} × ${levelMultiplier}) + ${performanceBonus} = ${totalXp}`
  
  return {
    baseXp,
    difficultyMultiplier,
    difficultyXp: Math.round(afterDifficulty),
    levelMultiplier,
    levelXp: Math.round(afterLevel),
    performanceBonus,
    performanceLabel,
    totalXp,
    formula
  }
}

/**
 * Simple XP calculation (returns just the total)
 */
export function calculateXpSimple(
  baseXp: number,
  lessonDifficulty: Difficulty,
  userLevel: number,
  scorePercentage: number
): number {
  const result = calculateXp({ baseXp, lessonDifficulty, userLevel, scorePercentage })
  return result.totalXp
}

// ============================================
// GAME XP HANDLING
// ============================================

/**
 * Calculate XP for an in-lesson game
 * Games use their configured XP value as base
 */
export function calculateGameXp(
  gameXp: number,
  lessonDifficulty: Difficulty,
  userLevel: number,
  scorePercentage: number
): XpBreakdown {
  return calculateXp({
    baseXp: gameXp,
    lessonDifficulty,
    userLevel,
    scorePercentage
  })
}

/**
 * Calculate total lesson XP from accumulated game scores
 */
export function calculateLessonTotalXp(
  gameResults: Array<{ xp: number; scorePercentage: number }>,
  lessonDifficulty: Difficulty,
  userLevel: number
): { totalXp: number; breakdown: XpBreakdown[] } {
  const breakdown: XpBreakdown[] = gameResults.map(game => 
    calculateXp({
      baseXp: game.xp,
      lessonDifficulty,
      userLevel,
      scorePercentage: game.scorePercentage
    })
  )
  
  const totalXp = breakdown.reduce((sum, b) => sum + b.totalXp, 0)
  
  return { totalXp, breakdown }
}

// ============================================
// DISPLAY UTILITIES
// ============================================

/**
 * Format XP for display
 */
export function formatXp(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`
  }
  return xp.toString()
}

/**
 * Get color class for performance level
 */
export function getPerformanceColorClass(scorePercentage: number): string {
  if (scorePercentage === 100) return 'text-purple-600'
  if (scorePercentage >= 90) return 'text-green-600'
  if (scorePercentage >= 80) return 'text-blue-600'
  if (scorePercentage >= 70) return 'text-yellow-600'
  return 'text-red-600'
}

/**
 * Get background color class for performance level
 */
export function getPerformanceBgClass(scorePercentage: number): string {
  if (scorePercentage === 100) return 'bg-purple-100'
  if (scorePercentage >= 90) return 'bg-green-100'
  if (scorePercentage >= 80) return 'bg-blue-100'
  if (scorePercentage >= 70) return 'bg-yellow-100'
  return 'bg-red-100'
}

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// Example: Calculate XP for a lesson completion

const xpResult = calculateXp({
  baseXp: 100,                    // Admin-set game XP
  lessonDifficulty: 'Advanced',   // 2.0x multiplier
  userLevel: 23,                  // 1.2x multiplier
  scorePercentage: 95             // +25 XP performance bonus
})

// Result:
// {
//   baseXp: 100,
//   difficultyMultiplier: 2.0,
//   difficultyXp: 200,
//   levelMultiplier: 1.2,
//   levelXp: 240,
//   performanceBonus: 25,
//   performanceLabel: 'Excellent',
//   totalXp: 265,
//   formula: '(100 × 2 × 1.2) + 25 = 265'
// }
*/