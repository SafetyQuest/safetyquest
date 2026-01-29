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

    console.log('Courses Completed:', coursesCompleted)
    
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
  // packages/shared/gamification/badgeChecker.ts
// FIXED: Course badge logic now checks BOTH lessons AND course quiz

  /**
   * Count completed courses for a user
   * ✅ WORKS WITH BOTH:
   *    1. Direct CourseAssignment
   *    2. Courses from ProgramAssignment
   */
  private async countCompletedCourses(userId: string): Promise<number> {
    console.log(`\n🔍 [countCompletedCourses] Starting for user: ${userId}`)
    
    // Collect all unique course IDs from BOTH sources
    const uniqueCourseIds = new Set<string>()
    
    // ============================================
    // SOURCE 1: Direct Course Assignments
    // ============================================
    const directAssignments = await this.prisma.courseAssignment.findMany({
      where: { userId, isActive: true },
      select: { courseId: true }
    })
    
    directAssignments.forEach(ca => uniqueCourseIds.add(ca.courseId))
    console.log(`📚 Direct course assignments: ${directAssignments.length}`)
    
    // ============================================
    // SOURCE 2: Courses from Program Assignments
    // ============================================
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
    
    console.log(`📚 Courses from programs: ${coursesFromPrograms} (from ${programAssignments.length} programs)`)
    console.log(`📊 Total unique courses: ${uniqueCourseIds.size}`)
    
    if (uniqueCourseIds.size === 0) {
      console.log(`⚠️  No courses found - user has no assignments!\n`)
      return 0
    }
    
    // ============================================
    // Check completion status for each course
    // ============================================
    let completedCount = 0
    let courseNumber = 0
    
    for (const courseId of uniqueCourseIds) {
      courseNumber++
      
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          lessons: { select: { lessonId: true } },
          quiz: { select: { id: true } }
        }
      })
      
      if (!course) {
        console.log(`\n⚠️  Course ${courseNumber}: Not found (ID: ${courseId})`)
        continue
      }
      
      console.log(`\n🎓 Course ${courseNumber}: ${course.name}`)
      console.log(`   Course ID: ${courseId}`)
      
      const lessonIds = course.lessons.map(l => l.lessonId)
      const courseQuizId = course.quiz?.id
      
      console.log(`   Lessons: ${lessonIds.length}`)
      console.log(`   Has Quiz: ${courseQuizId ? 'Yes' : 'No'}`)
      
      // Skip if no lessons
      if (lessonIds.length === 0) {
        console.log(`   ⚠️  Skipping - no lessons`)
        continue
      }
      
      // ✅ STEP 1: Check if all lessons are passed
      const passedLessonsCount = await this.prisma.lessonAttempt.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          passed: true
        }
      })
      
      console.log(`   📝 Lessons passed: ${passedLessonsCount}/${lessonIds.length}`)
      
      if (passedLessonsCount < lessonIds.length) {
        console.log(`   ❌ Not complete - missing ${lessonIds.length - passedLessonsCount} lessons`)
        continue
      }
      
      // ✅ STEP 2: Check if course has a quiz
      if (courseQuizId) {
        console.log(`   🎯 Checking course quiz...`)
        
        const courseAttempt = await this.prisma.courseAttempt.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: courseId
            }
          },
          select: { 
            passed: true,
            quizScore: true,
            quizMaxScore: true
          }
        })
        
        if (!courseAttempt) {
          console.log(`   ❌ No CourseAttempt record found`)
          continue
        }
        
        console.log(`   📊 Quiz score: ${courseAttempt.quizScore}/${courseAttempt.quizMaxScore}`)
        console.log(`   ✅ Quiz passed: ${courseAttempt.passed}`)
        
        if (!courseAttempt.passed) {
          console.log(`   ❌ Not complete - quiz not passed`)
          continue
        }
      }
      
      // ✅ STEP 3: All conditions met - course is complete!
      console.log(`   ✅ COMPLETE!`)
      completedCount++
    }
    
    console.log(`\n📊 Total completed courses: ${completedCount}/${uniqueCourseIds.size}\n`)
    return completedCount
  }
/**
   * Count completed programs for a user
   * ✅ WITH DETAILED LOGGING
   */
private async countCompletedPrograms(userId: string): Promise<number> {
  console.log(`\n🔍 [countCompletedPrograms] Starting for user: ${userId}`)
  
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
                  lessons: { select: { lessonId: true } },
                  quiz: { select: { id: true } }  // ✅ Include course quiz info
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
  
  for (let i = 0; i < programAssignments.length; i++) {
    const assignment = programAssignments[i]
    const program = assignment.program
    
    console.log(`\n📖 Program ${i + 1}: ${program.name}`)
    console.log(`   Program ID: ${program.id}`)
    console.log(`   Courses: ${program.courses.length}`)
    
    // ============================================
    // Check if ALL courses in the program are complete
    // ============================================
    
    let allCoursesComplete = true
    let completedCourses = 0
    
    for (const programCourse of program.courses) {
      const course = programCourse.course
      const lessonIds = course.lessons.map(l => l.lessonId)
      
      console.log(`\n   🎓 Course: ${course.name}`)
      console.log(`      Lessons: ${lessonIds.length}`)
      console.log(`      Has Quiz: ${course.quiz ? 'Yes' : 'No'}`)
      
      if (lessonIds.length === 0) {
        console.log(`      ⚠️  Skipping - no lessons`)
        continue
      }
      
      // Check lesson completion
      const passedLessons = await this.prisma.lessonAttempt.count({
        where: {
          userId,
          lessonId: { in: lessonIds },
          passed: true
        }
      })
      
      console.log(`      📝 Lessons: ${passedLessons}/${lessonIds.length}`)
      
      if (passedLessons < lessonIds.length) {
        console.log(`      ❌ Not complete - missing ${lessonIds.length - passedLessons} lessons`)
        allCoursesComplete = false
        continue
      }
      
      // Check course quiz if exists
      if (course.quiz) {
        const courseAttempt = await this.prisma.courseAttempt.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: course.id
            }
          },
          select: { 
            passed: true,
            quizScore: true,
            quizMaxScore: true
          }
        })
        
        if (!courseAttempt) {
          console.log(`      ❌ Course quiz not attempted`)
          allCoursesComplete = false
          continue
        }
        
        console.log(`      📊 Quiz: ${courseAttempt.quizScore}/${courseAttempt.quizMaxScore} - ${courseAttempt.passed ? 'Passed' : 'Failed'}`)
        
        if (!courseAttempt.passed) {
          console.log(`      ❌ Course quiz not passed`)
          allCoursesComplete = false
          continue
        }
      }
      
      console.log(`      ✅ Course complete`)
      completedCourses++
    }
    
    console.log(`\n   📊 Courses complete: ${completedCourses}/${program.courses.length}`)
    
    if (allCoursesComplete && completedCourses === program.courses.length) {
      console.log(`   ✅ PROGRAM COMPLETE!`)
      completedCount++
    } else {
      console.log(`   ❌ Program not complete`)
    }
  }
  
  console.log(`\n📊 Total completed programs: ${completedCount}\n`)
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