// packages/shared/gamification/levelSystem.ts
// Level tiers, colors, multipliers, and utility functions

export type LevelTier = 'novice' | 'practitioner' | 'professional' | 'expert' | 'leader' | 'master'

// ============================================
// LEVEL TIER CONFIGURATION
// ============================================

export const levelTiers = {
  novice: {
    name: 'Safety Novice',
    range: [1, 5] as [number, number],
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-500',
    text: 'text-green-600',
    border: 'border-green-500',
    hex: ['#22C55E', '#16A34A'],
    animation: null
  },
  practitioner: {
    name: 'Safety Practitioner',
    range: [6, 10] as [number, number],
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    border: 'border-blue-500',
    hex: ['#3B82F6', '#2563EB'],
    animation: null
  },
  professional: {
    name: 'Safety Professional',
    range: [11, 15] as [number, number],
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    border: 'border-purple-500',
    hex: ['#8B5CF6', '#7C3AED'],
    animation: null
  },
  expert: {
    name: 'Safety Expert',
    range: [16, 20] as [number, number],
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    border: 'border-amber-500',
    hex: ['#F59E0B', '#D97706'],
    animation: null
  },
  leader: {
    name: 'Safety Leader',
    range: [21, 25] as [number, number],
    gradient: 'from-red-600 to-red-700',
    bg: 'bg-red-600',
    text: 'text-red-600',
    border: 'border-red-600',
    hex: ['#DC2626', '#B91C1C'],
    animation: 'animate-pulse'
  },
  master: {
    name: 'Safety Master',
    range: [26, Infinity] as [number, number],
    gradient: 'from-purple-500 via-pink-500 to-amber-500',
    bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500',
    border: 'border-purple-500',
    hex: ['#7C3AED', '#EC4899', '#F59E0B'],
    animation: 'animate-aurora'
  }
} as const

// ============================================
// XP MULTIPLIERS
// ============================================

export const levelMultipliers = {
  '1-9': 1.0,
  '10-14': 1.1,
  '15-19': 1.15,
  '20-24': 1.2,
  '25-29': 1.25,
  '30+': 1.3
} as const

// ============================================
// LEVEL CALCULATION FUNCTIONS
// ============================================

/**
 * Calculate level from XP
 * Formula: level = floor(xp / 1000) + 1
 */
export function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1
}

/**
 * Calculate XP required for a specific level
 */
export function xpForLevel(level: number): number {
  return (level - 1) * 1000
}

/**
 * Calculate XP needed to reach the next level
 */
export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp)
  const xpForNext = xpForLevel(currentLevel + 1)
  return xpForNext - currentXp
}

/**
 * Calculate progress percentage to next level
 */
export function levelProgress(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp)
  const xpAtCurrentLevel = xpForLevel(currentLevel)
  const xpToNext = 1000 // Each level requires 1000 XP
  const progressXp = currentXp - xpAtCurrentLevel
  return Math.min(100, (progressXp / xpToNext) * 100)
}

// ============================================
// TIER FUNCTIONS
// ============================================

/**
 * Get the tier key for a given level
 */
export function getLevelTierKey(level: number): LevelTier {
  if (level >= 26) return 'master'
  if (level >= 21) return 'leader'
  if (level >= 16) return 'expert'
  if (level >= 11) return 'professional'
  if (level >= 6) return 'practitioner'
  return 'novice'
}

/**
 * Get the tier configuration for a given level
 */
export function getLevelTier(level: number) {
  const tierKey = getLevelTierKey(level)
  return levelTiers[tierKey]
}

/**
 * Get the tier name/title for a given level
 */
export function getLevelTitle(level: number): string {
  const tier = getLevelTier(level)
  return tier.name
}

/**
 * Get the XP multiplier for a given level
 */
export function getLevelMultiplier(level: number): number {
  if (level >= 30) return 1.3
  if (level >= 25) return 1.25
  if (level >= 20) return 1.2
  if (level >= 15) return 1.15
  if (level >= 10) return 1.1
  return 1.0
}

/**
 * Check if level qualifies for a tier upgrade
 */
export function isTierUpgrade(oldLevel: number, newLevel: number): boolean {
  return getLevelTierKey(oldLevel) !== getLevelTierKey(newLevel)
}

/**
 * Get the next tier threshold level
 */
export function getNextTierLevel(currentLevel: number): number | null {
  if (currentLevel >= 26) return null // Already at max tier
  if (currentLevel >= 21) return 26
  if (currentLevel >= 16) return 21
  if (currentLevel >= 11) return 16
  if (currentLevel >= 6) return 11
  return 6
}

// ============================================
// CSS UTILITIES
// ============================================

/**
 * Get Tailwind gradient class for level
 */
export function getLevelGradientClass(level: number): string {
  const tier = getLevelTier(level)
  return `bg-gradient-to-r ${tier.gradient}`
}

/**
 * Get Tailwind text color class for level
 */
export function getLevelTextClass(level: number): string {
  const tier = getLevelTier(level)
  return tier.text
}

/**
 * Get Tailwind border class for level
 */
export function getLevelBorderClass(level: number): string {
  const tier = getLevelTier(level)
  return tier.border
}

/**
 * Get animation class for level (if any)
 */
export function getLevelAnimationClass(level: number): string | null {
  const tier = getLevelTier(level)
  return tier.animation
}

// ============================================
// AURORA ANIMATION CSS
// ============================================

/**
 * CSS for Aurora/Cosmic animation (Safety Master tier)
 * Add this to your global CSS file
 */
export const auroraAnimationCSS = `
/* Safety Master - Level 26+ Aurora Animation */
.animate-aurora {
  background: linear-gradient(
    135deg,
    #7C3AED 0%,
    #EC4899 50%,
    #F59E0B 100%
  );
  background-size: 200% 200%;
  animation: aurora-shift 3s ease infinite;
}

@keyframes aurora-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Alternative: Shimmer effect */
.animate-aurora-shimmer {
  background: linear-gradient(
    90deg,
    #7C3AED 0%,
    #EC4899 25%,
    #F59E0B 50%,
    #EC4899 75%,
    #7C3AED 100%
  );
  background-size: 400% 100%;
  animation: shimmer 4s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
`

// ============================================
// LEVEL DISPLAY UTILITIES
// ============================================

export interface LevelDisplayData {
  level: number
  title: string
  tier: LevelTier
  tierConfig: typeof levelTiers[LevelTier]
  currentXp: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
  xpToNext: number
  multiplier: number
  isMaxTier: boolean
  nextTierLevel: number | null
}

/**
 * Get all display data for a user's level
 */
export function getLevelDisplayData(xp: number): LevelDisplayData {
  const level = calculateLevel(xp)
  const tierKey = getLevelTierKey(level)
  const tierConfig = levelTiers[tierKey]
  
  return {
    level,
    title: tierConfig.name,
    tier: tierKey,
    tierConfig,
    currentXp: xp,
    xpForCurrentLevel: xpForLevel(level),
    xpForNextLevel: xpForLevel(level + 1),
    progressPercent: levelProgress(xp),
    xpToNext: xpToNextLevel(xp),
    multiplier: getLevelMultiplier(level),
    isMaxTier: tierKey === 'master',
    nextTierLevel: getNextTierLevel(level)
  }
}