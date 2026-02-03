// packages/shared/gamification/badgeChecker.ts
// ✅ OPTIMIZED: Single-pass cascading badge checker

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
   * ✅ OPTIMIZED: Single-pass cascading badge check
   * 
   * This replaces the old approach of calling checkAndAwardBadges() multiple times.
   * Now we:
   * 1. Calculate stats ONCE
   * 2. Get all badges and earned badges ONCE
   * 3. Check in cascade order with early exit
   */
  async checkAndAwardBadgesCascade(
    userId: string,
    context: BadgeCheckContext = 'all'
  ): Promise<BadgeCheckResult> {
    console.log(`\n🎯 [OPTIMIZED] Starting single-pass badge check for context: ${context}`)
    
    // ============================================
    // STEP 1: Calculate stats ONCE (expensive operation)
    // ============================================
    const stats = await this.calculateUserStats(userId)
    console.log(`📊 Stats calculated:`, {
      lessons: stats.lessonsCompleted,
      courses: stats.coursesCompleted,
      programs: stats.programsCompleted
    })
    
    // ============================================
    // STEP 2: Get earned badges ONCE
    // ============================================
    const earnedBadgeKeys = await this.getEarnedBadgeKeys(userId)
    console.log(`✅ Already earned: ${earnedBadgeKeys.size} badges`)
    
    // ============================================
    // STEP 3: Get ALL potentially relevant badges ONCE
    // ============================================
    const allBadges = await this.getAllRelevantBadgesForContext(context)
    console.log(`📋 Checking ${allBadges.length} badges`)
    
    // ============================================
    // STEP 4: Check badges in cascade order
    // ============================================
    const newBadges: AwardedBadge[] = []
    let totalXpAwarded = 0
    
    // Define check order based on context
    const categoriesToCheck = this.getCascadeOrder(context)
    
    for (const category of categoriesToCheck) {
      const categoryBadges = allBadges.filter(b => b.category === category)
      console.log(`\n  🔍 Checking ${category} badges (${categoryBadges.length} total)`)
      
      for (const badge of categoryBadges) {
        // Skip if already earned
        if (earnedBadgeKeys.has(badge.badgeKey)) {
          continue
        }
        
        // Check if criteria met
        const earned = this.checkBadgeCriteria(badge, stats)
        
        if (earned) {
          console.log(`    🎖️  EARNED: ${badge.name} (+${badge.xpBonus} XP)`)
          
          // Award the badge
          await this.prisma.userBadge.create({
            data: {
              userId,
              badgeId: badge.id
            }
          })
          
          const awardedBadge: AwardedBadge = {
            id: badge.id,
            badgeKey: badge.badgeKey,
            name: badge.name,
            description: badge.description,
            tier: badge.tier as BadgeTier,
            icon: badge.icon,
            xpBonus: badge.xpBonus,
            category: badge.category as BadgeCategory,
            family: badge.family
          }
          
          newBadges.push(awardedBadge)
          totalXpAwarded += badge.xpBonus
          
          // Mark as earned so we don't check it again in this pass
          earnedBadgeKeys.add(badge.badgeKey)
        }
      }
    }
    
    // ============================================
    // STEP 5: Update user XP if badges were awarded
    // ============================================
    if (totalXpAwarded > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          xp: { increment: totalXpAwarded }
        }
      })
      
      console.log(`\n✅ Total badges awarded: ${newBadges.length}`)
      console.log(`⚡ Total XP awarded: ${totalXpAwarded}`)
    } else {
      console.log(`\n  ℹ️  No new badges earned`)
    }
    
    return { newBadges, totalXpAwarded }
  }

  /**
   * Get the cascade order for badge checking based on context
   * This ensures we check in dependency order: lesson → course → program
   */
  private getCascadeOrder(context: BadgeCheckContext): string[] {
    switch (context) {
      case 'lesson':
        // Lesson completion might cascade to course and program
        return ['lesson', 'accuracy', 'difficulty', 'course', 'program', 'special']
        
      case 'course':
        // Course completion might cascade to program
        return ['course', 'program', 'special']
        
      case 'program':
        // Program completion only checks program badges
        return ['program', 'special']
        
      case 'quiz':
        // Quiz only affects accuracy badges
        return ['accuracy']
        
      case 'login':
        // Login only affects streak badges
        return ['streak']
        
      case 'all':
      default:
        // Check everything in dependency order
        return ['lesson', 'accuracy', 'difficulty', 'course', 'program', 'streak', 'special']
    }
  }

  /**
   * Get all badges that might be relevant for the context
   * This is broader than the old approach to ensure we catch cascades
   */
  private async getAllRelevantBadgesForContext(context: BadgeCheckContext) {
    const categories = this.getCascadeOrder(context)
    
    return this.prisma.badge.findMany({
      where: { category: { in: categories } },
      orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }]
    })
  }

  /**
   * Calculate user's current stats from database
   * ✅ This now only runs ONCE per badge check
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
    switch (key) {
      case 'special_complete':
        return false
        
      case 'special_certified':
        return false
        
      default:
        return false
    }
  }

  /**
   * Count completed courses for a user
   */
  private async countCompletedCourses(userId: string): Promise<number> {
    console.log(`\n🔍 [countCompletedCourses] Starting for user: ${userId}`)
    
    const uniqueCourseIds = new Set<string>()
    
    // SOURCE 1: Direct Course Assignments
    const directAssignments = await this.prisma.courseAssignment.findMany({
      where: { userId, isActive: true },
      select: { courseId: true }
    })
    
    directAssignments.forEach(ca => uniqueCourseIds.add(ca.courseId))
    console.log(`📚 Direct course assignments: ${directAssignments.length}`)
    
    // SOURCE 2: Courses from Program Assignments
    const programAssignments = await this.prisma.programAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        program: {
          include: {
            courses: {
              select: { courseId: true }
            }
          }
        }
      }
    })
    
    let coursesFromPrograms = 0
    programAssignments.forEach(pa => {
      pa.program.courses.forEach(pc => {
        if (!uniqueCourseIds.has(pc.courseId)) {
          uniqueCourseIds.add(pc.courseId)
          coursesFromPrograms++
        }
      })
    })
    
    console.log(`📚 Courses from programs: ${coursesFromPrograms}`)
    console.log(`📊 Total unique courses: ${uniqueCourseIds.size}`)
    
    if (uniqueCourseIds.size === 0) {
      console.log(`⚠️  No courses found\n`)
      return 0
    }
    
    let completedCount = 0
    
    for (const courseId of uniqueCourseIds) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: { select: { lessonId: true } },
          quiz: { select: { id: true } }
        }
      })
      
      if (!course || course.lessons.length === 0) continue
      
      const lessonIds = course.lessons.map(l => l.lessonId)
      
      // Check lessons
      const passedLessonsCount = await this.prisma.lessonAttempt.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          passed: true
        }
      })
      
      if (passedLessonsCount < lessonIds.length) continue
      
      // Check course quiz if exists
      if (course.quiz) {
        const courseAttempt = await this.prisma.courseAttempt.findUnique({
          where: {
            userId_courseId: { userId, courseId }
          },
          select: { passed: true }
        })
        
        if (!courseAttempt?.passed) continue
      }
      
      completedCount++
    }
    
    console.log(`📊 Total completed courses: ${completedCount}/${uniqueCourseIds.size}\n`)
    return completedCount
  }

  /**
   * Count completed programs for a user
   */
  private async countCompletedPrograms(userId: string): Promise<number> {
    console.log(`\n🔍 [countCompletedPrograms] Starting for user: ${userId}`)
    
    const programAssignments = await this.prisma.programAssignment.findMany({
      where: { userId, isActive: true },
      include: {
        program: {
          include: {
            courses: {
              include: {
                course: {
                  include: {
                    lessons: { select: { lessonId: true } },
                    quiz: { select: { id: true } }
                  }
                }
              }
            }
          }
        }
      }
    })
    
    console.log(`📚 Found ${programAssignments.length} program assignments`)
    
    let completedCount = 0
    
    for (const assignment of programAssignments) {
      const program = assignment.program
      let allCoursesComplete = true
      
      for (const programCourse of program.courses) {
        const course = programCourse.course
        const lessonIds = course.lessons.map(l => l.lessonId)
        
        if (lessonIds.length === 0) continue
        
        // Check lessons
        const passedLessons = await this.prisma.lessonAttempt.count({
          where: {
            userId,
            lessonId: { in: lessonIds },
            passed: true
          }
        })
        
        if (passedLessons < lessonIds.length) {
          allCoursesComplete = false
          break
        }
        
        // Check course quiz if exists
        if (course.quiz) {
          const courseAttempt = await this.prisma.courseAttempt.findUnique({
            where: {
              userId_courseId: { userId, courseId: course.id }
            },
            select: { passed: true }
          })
          
          if (!courseAttempt?.passed) {
            allCoursesComplete = false
            break
          }
        }
      }
      
      if (allCoursesComplete && program.courses.length > 0) {
        completedCount++
      }
    }
    
    console.log(`📊 Total completed programs: ${completedCount}\n`)
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
    
    const newLongestStreak = Math.max(user.longestStreak || 0, newStreak)
    
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
 * ✅ NEW: Use the optimized cascade checker
 * This is a drop-in replacement for the old checkAndAwardBadges
 */
export async function checkAndAwardBadges(
  prisma: PrismaClient,
  userId: string,
  context: BadgeCheckContext = 'all'
): Promise<BadgeCheckResult> {
  const checker = new BadgeChecker(prisma)
  return checker.checkAndAwardBadgesCascade(userId, context)
}