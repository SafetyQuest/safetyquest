// apps/web/utils/achievements.ts

import { PrismaClient } from '@safetyquest/database'
import { Achievement } from '@/types/learner'

const prisma = new PrismaClient()

/**
 * Check and award badges based on lesson completion
 * @returns Array of newly earned badges
 */
export async function checkAchievements(
  userId: string,
  lessonId: string,
  quizScore: number,
  quizMaxScore: number
): Promise<Achievement[]> {
  const earnedBadges: Achievement[] = []
  
  try {
    // Get all possible badges
    const badges = await prisma.badge.findMany()
    
    // Get user's existing badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true }
    })
    
    const earnedIds = new Set(userBadges.map(ub => ub.badgeId))
    
    // Check each badge
    for (const badge of badges) {
      // Skip if already earned
      if (earnedIds.has(badge.id)) continue
      
      // Evaluate criteria
      const earned = await evaluateBadgeCriteria(
        badge,
        userId,
        lessonId,
        quizScore,
        quizMaxScore
      )
      
      if (earned) {
        // Award badge
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id
          }
        })
        
        earnedBadges.push({
          id: badge.id,
          title: badge.name,
          description: badge.description || '',
          icon: badge.iconUrl || '🏆',
          earnedAt: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error)
    // Don't throw - badges should not block lesson completion
  }
  
  return earnedBadges
}

/**
 * Evaluate if a badge's criteria is met
 */
async function evaluateBadgeCriteria(
  badge: any,
  userId: string,
  lessonId: string,
  quizScore: number,
  quizMaxScore: number
): Promise<boolean> {
  let criteria: any
  try {
    criteria = typeof badge.criteria === 'string' 
      ? JSON.parse(badge.criteria) 
      : badge.criteria
  } catch {
    return false
  }
  
  if (!criteria || !criteria.type) {
    return false
  }
  
  const scorePercentage = quizMaxScore > 0 
    ? Math.round((quizScore / quizMaxScore) * 100)
    : 0
  
  switch (criteria.type) {
    case 'FIRST_LESSON':
      return await checkFirstLesson(userId)
    
    case 'PERFECT_SCORE':
      return scorePercentage === 100
    
    case 'TOTAL_LESSONS':
      return await checkTotalLessons(userId, criteria.count || 10)
    
    case 'STREAK':
      return await checkStreak(userId, criteria.days || 7)
    
    case 'COMPLETE_COURSE':
      return await checkCourseComplete(userId, lessonId)
    
    case 'COMPLETE_PROGRAM':
      return await checkProgramComplete(userId, lessonId)
    
    case 'HIGH_SCORE':
      return scorePercentage >= (criteria.threshold || 90)
    
    default:
      return false
  }
}

/**
 * Check if this is the user's first completed lesson
 */
async function checkFirstLesson(userId: string): Promise<boolean> {
  const completedCount = await prisma.lessonAttempt.count({
    where: {
      userId,
      passed: true
    }
  })
  
  return completedCount === 1
}

/**
 * Check if user has completed a certain number of lessons
 */
async function checkTotalLessons(userId: string, requiredCount: number): Promise<boolean> {
  const completedCount = await prisma.lessonAttempt.count({
    where: {
      userId,
      passed: true
    }
  })
  
  return completedCount >= requiredCount
}

/**
 * Check if user has a consecutive day streak
 */
async function checkStreak(userId: string, requiredDays: number): Promise<boolean> {
  const attempts = await prisma.lessonAttempt.findMany({
    where: {
      userId,
      passed: true
    },
    orderBy: {
      completedAt: 'desc'
    },
    select: {
      completedAt: true
    }
  })
  
  if (attempts.length === 0) return false
  
  let streak = 1
  let currentDate = new Date(attempts[0].completedAt)
  currentDate.setHours(0, 0, 0, 0)
  
  for (let i = 1; i < attempts.length; i++) {
    const prevDate = new Date(attempts[i].completedAt)
    prevDate.setHours(0, 0, 0, 0)
    
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (dayDiff === 1) {
      streak++
      currentDate = prevDate
      
      if (streak >= requiredDays) {
        return true
      }
    } else if (dayDiff > 1) {
      break
    }
  }
  
  return streak >= requiredDays
}

/**
 * Check if completing this lesson completes a course
 */
async function checkCourseComplete(userId: string, lessonId: string): Promise<boolean> {
  // Find courses containing this lesson
  const courseLessons = await prisma.courseLesson.findMany({
    where: { lessonId },
    include: {
      course: {
        include: {
          lessons: {
            select: { lessonId: true }
          }
        }
      }
    }
  })
  
  if (courseLessons.length === 0) return false
  
  // Check each course
  for (const cl of courseLessons) {
    const allLessonIds = cl.course.lessons.map(l => l.lessonId)
    
    const completedCount = await prisma.lessonAttempt.count({
      where: {
        userId,
        lessonId: { in: allLessonIds },
        passed: true
      }
    })
    
    // If all lessons in this course are completed
    if (completedCount === allLessonIds.length) {
      return true
    }
  }
  
  return false
}

/**
 * Check if completing this lesson completes an entire program
 */
async function checkProgramComplete(userId: string, lessonId: string): Promise<boolean> {
  // Find programs containing this lesson (through course)
  const courseLessons = await prisma.courseLesson.findMany({
    where: { lessonId },
    include: {
      course: {
        include: {
          programs: {
            include: {
              program: {
                include: {
                  courses: {
                    include: {
                      course: {
                        include: {
                          lessons: {
                            select: { lessonId: true }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  
  if (courseLessons.length === 0) return false
  
  // Check each program
  for (const cl of courseLessons) {
    for (const pc of cl.course.programs) {
      const program = pc.program
      
      // Get all lesson IDs in this program
      const allLessonIds = program.courses.flatMap(pc =>
        pc.course.lessons.map(cl => cl.lessonId)
      )
      
      // Count completed lessons
      const completedCount = await prisma.lessonAttempt.count({
        where: {
          userId,
          lessonId: { in: allLessonIds },
          passed: true
        }
      })
      
      // If all lessons completed, badge earned
      if (completedCount === allLessonIds.length) {
        return true
      }
    }
  }
  
  return false
}

/**
 * Get current streak for a user
 */
export async function getCurrentStreak(userId: string): Promise<number> {
  const attempts = await prisma.lessonAttempt.findMany({
    where: {
      userId,
      passed: true
    },
    orderBy: {
      completedAt: 'desc'
    },
    select: {
      completedAt: true
    }
  })
  
  if (attempts.length === 0) return 0
  
  let streak = 1
  let currentDate = new Date(attempts[0].completedAt)
  currentDate.setHours(0, 0, 0, 0)
  
  for (let i = 1; i < attempts.length; i++) {
    const prevDate = new Date(attempts[i].completedAt)
    prevDate.setHours(0, 0, 0, 0)
    
    const dayDiff = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    if (dayDiff === 1) {
      streak++
      currentDate = prevDate
    } else if (dayDiff > 1) {
      break
    }
  }
  
  return streak
}