// packages/shared/gamification/badgeChecker.ts
// Badge checking and awarding logic

import { PrismaClient } from '@safetyquest/database'
import type { BadgeTier, BadgeCategory } from './badges'

// ============================================
// TYPES
// ============================================

export interface BadgeCheckResult {
  newBadges: AwardedBadge[]
  totalXpAwarded: number
}

export interface AwardedBadge {
  id: string
  badgeKey: string
  name: string
  description: string | null
  tier: BadgeTier
  icon: string
  xpBonus: number
  category: BadgeCategory
  family: string | null
}

export interface UserStats {
  lessonsCompleted: number
  coursesCompleted: number
  programsCompleted: number
  advancedLessons: number
  perfectQuizzes: number
  excellentQuizzes: number
  currentStreak: number
  longestStreak: number
}

export type BadgeCheckContext = 'lesson' | 'course' | 'program' | 'quiz' | 'login' | 'all'

// ============================================
// BADGE CHECKER CLASS
// ============================================

export class BadgeChecker {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  /**
   * Main function to check and award badges
   */
  async checkAndAwardBadges(
    userId: string,
    context: BadgeCheckContext = 'all'
  ): Promise<BadgeCheckResult> {
    // 1. Get user's current stats
    const stats = await this.calculateUserStats(userId)
    
    // 2. Get user's already earned badge keys
    const earnedBadgeKeys = await this.getEarnedBadgeKeys(userId)
    
    // 3. Get relevant badges based on context
    const badges = await this.getRelevantBadges(context)
    
    // 4. Check each badge
    const newBadges: AwardedBadge[] = []
    let totalXpAwarded = 0
    
    for (const badge of badges) {
      // Skip if already earned
      if (earnedBadgeKeys.has(badge.badgeKey)) continue
      
      // Check if criteria met
      const earned = this.checkBadgeCriteria(badge, stats)
      
      if (earned) {
        // Award the badge
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        })
        
        newBadges.push({
          id: badge.id,
          badgeKey: badge.badgeKey,
          name: badge.name,
          description: badge.description,
          tier: badge.tier as BadgeTier,
          icon: badge.icon,
          xpBonus: badge.xpBonus,
          category: badge.category as BadgeCategory,
          family: badge.family
        })
        
        totalXpAwarded += badge.xpBonus
      }
    }
    
    // 5. Update user XP if badges were awarded
    if (totalXpAwarded > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: totalXpAwarded }
        }
      })
    }
    
    return { newBadges, totalXpAwarded }
  }

  /**
   * Calculate user's current stats from database
   */
  async calculateUserStats(userId: string): Promise<UserStats> {
    // Count completed lessons (unique)
    const lessonsCompleted = await this.prisma.lessonAttempt.count({
      where: { userId, passed: true }
    })
    
    // Count completed courses
    const coursesCompleted = await this.countCompletedCourses(userId)
    
    // Count completed programs
    const programsCompleted = await this.countCompletedPrograms(userId)
    
    // Count advanced lessons completed
    const advancedLessons = await this.prisma.lessonAttempt.count({
      where: {
        userId,
        passed: true,
        lesson: { difficulty: 'Advanced' }
      }
    })
    
    // Count perfect and excellent quizzes
    const quizAttempts = await this.prisma.lessonAttempt.findMany({
      where: { userId, passed: true, quizMaxScore: { gt: 0 } },
      select: { quizScore: true, quizMaxScore: true }
    })
    
    let perfectQuizzes = 0
    let excellentQuizzes = 0
    
    for (const attempt of quizAttempts) {
      const percentage = (attempt.quizScore / attempt.quizMaxScore) * 100
      if (percentage === 100) perfectQuizzes++
      if (percentage >= 90) excellentQuizzes++
    }
    
    // Get streak info from user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, longestStreak: true }
    })
    
    return {
      lessonsCompleted,
      coursesCompleted,
      programsCompleted,
      advancedLessons,
      perfectQuizzes,
      excellentQuizzes,
      currentStreak: user?.streak || 0,
      longestStreak: user?.longestStreak || 0
    }
  }

  /**
   * Get set of badge keys user has already earned
   */
  private async getEarnedBadgeKeys(userId: string): Promise<Set<string>> {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: { select: { badgeKey: true } } }
    })
    
    return new Set(userBadges.map(ub => ub.badge.badgeKey))
  }

  /**
   * Get relevant badges based on context
   */
  private async getRelevantBadges(context: BadgeCheckContext) {
    const categoryFilter = this.getContextCategories(context)
    
    return this.prisma.badge.findMany({
      where: categoryFilter ? { category: { in: categoryFilter } } : undefined,
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }]
    })
  }

  /**
   * Get categories to check based on context
   */
  private getContextCategories(context: BadgeCheckContext): string[] | null {
    switch (context) {
      case 'lesson':
        return ['lesson', 'accuracy', 'difficulty']
      case 'course':
        return ['course']
      case 'program':
        return ['program', 'special']
      case 'quiz':
        return ['accuracy']
      case 'login':
        return ['streak']
      case 'all':
      default:
        return null // Check all badges
    }
  }

  /**
   * Check if a specific badge's criteria is met
   */
  private checkBadgeCriteria(badge: any, stats: UserStats): boolean {
    const { category, family, requirement, badgeKey } = badge
    
    switch (category) {
      case 'lesson':
        return stats.lessonsCompleted >= requirement
        
      case 'course':
        return stats.coursesCompleted >= requirement
        
      case 'program':
        return stats.programsCompleted >= requirement
        
      case 'accuracy':
        if (family === 'perfect') {
          return stats.perfectQuizzes >= requirement
        }
        if (family === 'excellent') {
          return stats.excellentQuizzes >= requirement
        }
        return false
        
      case 'difficulty':
        return stats.advancedLessons >= requirement
        
      case 'streak':
        // Streak badges check longest streak, not current
        return stats.longestStreak >= requirement
        
      case 'special':
        return this.checkSpecialBadge(badgeKey, stats)
        
      default:
        return false
    }
  }

  /**
   * Check special badge conditions
   */
  private checkSpecialBadge(key: string, stats: UserStats): boolean {
    // Special badges require custom logic
    // Will be implemented based on specific requirements
    
    switch (key) {
      case 'special_complete':
        // "Training Complete" - requires completing all assigned programs
        // This needs to check if user has completed ALL their assigned programs
        // For now, return false - implement when needed
        return false
        
      case 'special_certified':
        // "Safety Certified" - 90%+ average across all programs
        // This also needs custom calculation
        return false
        
      default:
        return false
    }
  }

  /**
   * Count completed courses for a user
   */
  private async countCompletedCourses(userId: string): Promise<number> {
    // Get all courses the user has access to
    const courseAssignments = await this.prisma.courseAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        course: {
          include: {
            lessons: { select: { lessonId: true } }
          }
        }
      }
    })
    
    let completedCount = 0
    
    for (const assignment of courseAssignments) {
      const lessonIds = assignment.course.lessons.map(l => l.lessonId)
      
      if (lessonIds.length === 0) continue
      
      // Count how many lessons the user has passed
      const passedCount = await this.prisma.lessonAttempt.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          passed: true
        }
      })
      
      // Course is complete if all lessons are passed
      if (passedCount >= lessonIds.length) {
        completedCount++
      }
    }
    
    return completedCount
  }

  /**
   * Count completed programs for a user
   */
  private async countCompletedPrograms(userId: string): Promise<number> {
    // Get all programs the user is assigned to
    const programAssignments = await this.prisma.programAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        program: {
          include: {
            courses: {
              include: {
                course: {
                  include: {
                    lessons: { select: { lessonId: true } }
                  }
                }
              }
            }
          }
        }
      }
    })
    
    let completedCount = 0
    
    for (const assignment of programAssignments) {
      // Get all lesson IDs in this program
      const allLessonIds = assignment.program.courses.flatMap(pc =>
        pc.course.lessons.map(l => l.lessonId)
      )
      
      if (allLessonIds.length === 0) continue
      
      // Count how many lessons the user has passed
      const passedCount = await this.prisma.lessonAttempt.count({
        where: {
          userId,
          lessonId: { in: allLessonIds },
          passed: true
        }
      })
      
      // Program is complete if all lessons are passed
      if (passedCount >= allLessonIds.length) {
        completedCount++
      }
    }
    
    return completedCount
  }

  /**
   * Update user's streak-related stats (call on login/activity)
   */
  async updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streak: true, longestStreak: true, lastActivity: true }
    })
    
    if (!user) {
      return { currentStreak: 0, longestStreak: 0 }
    }
    
    const now = new Date()
    const lastActivity = user.lastActivity
    
    let newStreak = user.streak
    
    if (lastActivity) {
      const lastDate = new Date(lastActivity)
      const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays === 0) {
        // Same day, streak unchanged
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak = user.streak + 1
      } else {
        // Missed a day, reset streak
        newStreak = 1
      }
    } else {
      // First activity
      newStreak = 1
    }
    
    // Update longest streak if needed
    const newLongestStreak = Math.max(user.longestStreak || 0, newStreak)
    
    // Update user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastActivity: now
      }
    })
    
    return { currentStreak: newStreak, longestStreak: newLongestStreak }
  }

  /**
   * Update user's accuracy counts after quiz completion
   */
  async updateAccuracyCounts(userId: string, scorePercentage: number): Promise<void> {
    const updates: any = {}
    
    if (scorePercentage === 100) {
      updates.perfectQuizCount = { increment: 1 }
    }
    
    if (scorePercentage >= 90) {
      updates.excellentQuizCount = { increment: 1 }
    }
    
    if (Object.keys(updates).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updates
      })
    }
  }

  /**
   * Get user's badge summary
   */
  async getBadgeSummary(userId: string) {
    const [earnedBadges, totalBadges] = await Promise.all([
      this.prisma.userBadge.count({ where: { userId } }),
      this.prisma.badge.count()
    ])
    
    const recentBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
      take: 5
    })
    
    return {
      earnedCount: earnedBadges,
      totalCount: totalBadges,
      percentComplete: Math.round((earnedBadges / totalBadges) * 100),
      recentBadges
    }
  }

  /**
   * Get user's badges grouped by category
   */
  async getBadgesByCategory(userId: string) {
    const [allBadges, userBadges] = await Promise.all([
      this.prisma.badge.findMany({
        orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }]
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true }
      })
    ])
    
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))
    
    // Group by category
    const categories: Record<string, { badges: any[], earnedCount: number }> = {}
    
    for (const badge of allBadges) {
      if (!categories[badge.category]) {
        categories[badge.category] = { badges: [], earnedCount: 0 }
      }
      
      const earned = earnedBadgeIds.has(badge.id)
      categories[badge.category].badges.push({
        ...badge,
        earned,
        awardedAt: earned 
          ? userBadges.find(ub => ub.badgeId === badge.id)?.awardedAt 
          : null
      })
      
      if (earned) {
        categories[badge.category].earnedCount++
      }
    }
    
    return categories
  }

  /**
   * Get user's badges grouped by family
   */
  async getBadgesByFamily(userId: string) {
    const [allBadges, userBadges, stats] = await Promise.all([
      this.prisma.badge.findMany({
        orderBy: [{ family: 'asc' }, { displayOrder: 'asc' }]
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true }
      }),
      this.calculateUserStats(userId)
    ])
    
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId))
    
    // Group by family
    const families: Record<string, any> = {}
    
    for (const badge of allBadges) {
      const family = badge.family || 'other'
      
      if (!families[family]) {
        families[family] = {
          familyKey: family,
          familyName: badge.name,
          icon: badge.icon,
          category: badge.category,
          badges: [],
          earnedCount: 0,
          currentProgress: this.getProgressForCategory(badge.category, stats)
        }
      }
      
      const earned = earnedBadgeIds.has(badge.id)
      families[family].badges.push({
        ...badge,
        earned,
        awardedAt: earned 
          ? userBadges.find(ub => ub.badgeId === badge.id)?.awardedAt 
          : null
      })
      
      if (earned) {
        families[family].earnedCount++
      }
    }
    
    // Add highest earned tier and next tier info
    for (const family of Object.values(families)) {
      const sortedBadges = family.badges.sort((a: any, b: any) => a.requirement - b.requirement)
      const earnedBadges = sortedBadges.filter((b: any) => b.earned)
      
      family.highestEarnedTier = earnedBadges.length > 0 
        ? earnedBadges[earnedBadges.length - 1].tier 
        : null
      
      family.nextTierBadge = sortedBadges.find((b: any) => !b.earned) || null
    }
    
    return families
  }

  /**
   * Get current progress value for a category
   */
  private getProgressForCategory(category: string, stats: UserStats): number {
    switch (category) {
      case 'lesson': return stats.lessonsCompleted
      case 'course': return stats.coursesCompleted
      case 'program': return stats.programsCompleted
      case 'difficulty': return stats.advancedLessons
      case 'streak': return stats.longestStreak
      default: return 0
    }
  }
}

// ============================================
// STANDALONE FUNCTION (for easy import)
// ============================================

/**
 * Create a badge checker instance and check for badges
 * Convenience function for use in API routes
 */
export async function checkAndAwardBadges(
  prisma: PrismaClient,
  userId: string,
  context: BadgeCheckContext = 'all'
): Promise<BadgeCheckResult> {
  const checker = new BadgeChecker(prisma)
  return checker.checkAndAwardBadges(userId, context)
}