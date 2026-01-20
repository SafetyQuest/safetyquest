// packages/shared/gamification/badges.ts
// Badge definitions, tier colors, and utility functions

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type BadgeCategory = 'lesson' | 'course' | 'program' | 'accuracy' | 'difficulty' | 'streak' | 'special'

// ============================================
// TIER COLORS
// ============================================

export const tierColors = {
  bronze: {
    gradient: 'from-amber-600 to-amber-800',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-700',
    hex: ['#D97706', '#92400E'],
    glow: 'shadow-amber-500/30',
    label: 'Bronze'
  },
  silver: {
    gradient: 'from-gray-300 to-gray-500',
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-400',
    hex: ['#D1D5DB', '#6B7280'],
    glow: 'shadow-gray-400/30',
    label: 'Silver'
  },
  gold: {
    gradient: 'from-yellow-400 to-orange-500',
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-500',
    hex: ['#FACC15', '#F97316'],
    glow: 'shadow-yellow-500/40',
    label: 'Gold'
  },
  platinum: {
    gradient: 'from-purple-400 to-pink-500',
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-500',
    hex: ['#C084FC', '#EC4899'],
    glow: 'shadow-purple-500/50',
    label: 'Platinum'
  }
} as const

// ============================================
// CATEGORY METADATA
// ============================================

export const categoryMetadata = {
  lesson: {
    label: 'Lesson Milestones',
    description: 'Earned by completing lessons',
    icon: 'BookOpen'
  },
  course: {
    label: 'Course Milestones',
    description: 'Earned by completing courses',
    icon: 'GraduationCap'
  },
  program: {
    label: 'Program Milestones',
    description: 'Earned by completing programs',
    icon: 'Award'
  },
  accuracy: {
    label: 'Accuracy Awards',
    description: 'Earned by achieving high scores',
    icon: 'Target'
  },
  difficulty: {
    label: 'Difficulty Achievements',
    description: 'Earned by completing advanced content',
    icon: 'Mountain'
  },
  streak: {
    label: 'Streak Rewards',
    description: 'Earned by consistent daily learning',
    icon: 'Flame'
  },
  special: {
    label: 'Special Achievements',
    description: 'Earned through exceptional accomplishments',
    icon: 'Sparkles'
  }
} as const

// ============================================
// BADGE FAMILIES
// ============================================

export const badgeFamilies = {
  // Lesson families
  awakening: { category: 'lesson', icon: 'BookOpen', name: 'Awakening' },
  theclimbbegins: { category: 'lesson', icon: 'Footprints', name: 'The Climb Begins' },
  pathfinder: { category: 'lesson', icon: 'Compass', name: 'Pathfinder' },
  lorehunter: { category: 'lesson', icon: 'Search', name: 'Lore Hunter' },
  knowledgeknight: { category: 'lesson', icon: 'Sword', name: 'Knowledge Knight' },
  knowledgelord: { category: 'lesson', icon: 'Crown', name: 'Knowledge Lord' },
  theonewhoknows: { category: 'lesson', icon: 'Star', name: 'The One Who Knows' },
  
  // Course families
  novice: { category: 'course', icon: 'GraduationCap', name: 'Course Novice' },
  squire: { category: 'course', icon: 'Shield', name: 'Course Squire' },
  knight: { category: 'course', icon: 'Trophy', name: 'Course Knight' },
  lord: { category: 'course', icon: 'Castle', name: 'Course Lord' },
  archlord: { category: 'course', icon: 'Gem', name: 'Course Archlord' },
  
  // Program families
  baron: { category: 'program', icon: 'Award', name: 'Program Baron' },
  viscount: { category: 'program', icon: 'Medal', name: 'Program Viscount' },
  duke: { category: 'program', icon: 'Crown', name: 'Program Duke' },
  archduke: { category: 'program', icon: 'Sparkles', name: 'Program Archduke' },
  
  // Other families
  perfect: { category: 'accuracy', icon: 'Target', name: 'Perfect Score' },
  excellent: { category: 'accuracy', icon: 'TrendingUp', name: 'Excellent Score' },
  advanced: { category: 'difficulty', icon: 'Mountain', name: 'Advanced' },
  streak: { category: 'streak', icon: 'Flame', name: 'Streak' },
  special: { category: 'special', icon: 'Sparkles', name: 'Special' }
} as const

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get the tier colors for a given tier
 */
export function getTierColors(tier: BadgeTier) {
  return tierColors[tier]
}

/**
 * Get CSS class for badge gradient background
 */
export function getBadgeGradientClass(tier: BadgeTier, earned: boolean = true): string {
  if (!earned) return 'bg-gray-200'
  return `bg-gradient-to-br ${tierColors[tier].gradient}`
}

/**
 * Get CSS class for badge border
 */
export function getBadgeBorderClass(tier: BadgeTier, earned: boolean = true): string {
  if (!earned) return 'border-gray-300'
  return tierColors[tier].border
}

/**
 * Get confetti colors for a tier
 */
export function getTierConfettiColors(tier: BadgeTier): string[] {
  switch (tier) {
    case 'bronze': return ['#D97706', '#92400E', '#FCD34D']
    case 'silver': return ['#9CA3AF', '#6B7280', '#D1D5DB']
    case 'gold': return ['#FACC15', '#F97316', '#FEF3C7']
    case 'platinum': return ['#C084FC', '#EC4899', '#F0ABFC']
    default: return ['#3B82F6', '#60A5FA', '#93C5FD']
  }
}

/**
 * Get tier order (for sorting)
 */
export function getTierOrder(tier: BadgeTier): number {
  const order = { bronze: 1, silver: 2, gold: 3, platinum: 4 }
  return order[tier]
}

/**
 * Compare two tiers
 */
export function compareTiers(a: BadgeTier, b: BadgeTier): number {
  return getTierOrder(a) - getTierOrder(b)
}

/**
 * Get next tier
 */
export function getNextTier(tier: BadgeTier): BadgeTier | null {
  const tiers: BadgeTier[] = ['bronze', 'silver', 'gold', 'platinum']
  const currentIndex = tiers.indexOf(tier)
  if (currentIndex === -1 || currentIndex === tiers.length - 1) return null
  return tiers[currentIndex + 1]
}

/**
 * Check if tier is highest
 */
export function isHighestTier(tier: BadgeTier): boolean {
  return tier === 'platinum'
}

// ============================================
// BADGE DATA TYPES
// ============================================

export interface Badge {
  id: string
  badgeKey: string
  name: string
  description: string | null
  category: BadgeCategory
  family: string | null
  tier: BadgeTier
  icon: string
  requirement: number
  xpBonus: number
  displayOrder: number
}

export interface UserBadge {
  id: string
  badgeId: string
  userId: string
  awardedAt: Date
  badge: Badge
}

export interface BadgeFamily {
  familyName: string
  familyKey: string
  icon: string
  category: BadgeCategory
  badges: Badge[]
  earnedCount: number
  totalCount: number
  highestEarnedTier: BadgeTier | null
  nextTierBadge: Badge | null
  currentProgress: number
}

// ============================================
// BADGE GROUPING UTILITIES
// ============================================

/**
 * Group badges by family
 */
export function groupBadgesByFamily(badges: Badge[]): Record<string, Badge[]> {
  return badges.reduce((acc, badge) => {
    const family = badge.family || 'other'
    if (!acc[family]) acc[family] = []
    acc[family].push(badge)
    return acc
  }, {} as Record<string, Badge[]>)
}

/**
 * Group badges by category
 */
export function groupBadgesByCategory(badges: Badge[]): Record<BadgeCategory, Badge[]> {
  return badges.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = []
    acc[badge.category].push(badge)
    return acc
  }, {} as Record<BadgeCategory, Badge[]>)
}

/**
 * Sort badges within a family by tier order
 */
export function sortBadgesByTier(badges: Badge[]): Badge[] {
  return [...badges].sort((a, b) => compareTiers(a.tier, b.tier))
}