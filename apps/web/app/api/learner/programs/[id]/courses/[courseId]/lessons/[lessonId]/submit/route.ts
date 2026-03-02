// apps/web/app/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/submit/route.ts
// ✅ OPTIMIZED: Single badge check + streak tracking

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { verifyLessonAccess } from '@safetyquest/shared/enrollment'
import { PrismaClient } from '@safetyquest/database'
import { 
  calculateXp, 
  checkAndAwardBadges,
  calculateLevel,
  calculateNewStreak   // ✅ NEW IMPORT
} from '@safetyquest/shared/gamification'
import type { Difficulty } from '@safetyquest/shared/gamification'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, courseId, lessonId } = await params
    
    // Verify access to lesson
    try {
      await verifyLessonAccess(session.user.id, lessonId, courseId, id)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    
    const body = await request.json()
    const { quizScore, quizMaxScore, passed, timeSpent, quizAttempted = false, questionReview } = body

    // Get lesson details including difficulty
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { 
        quizId: true,
        difficulty: true
      }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // ✅ UPDATED: Now also selects streak, longestStreak, lastActivity
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { 
        xp: true, 
        level: true,
        streak: true,          // ✅ NEW
        longestStreak: true,   // ✅ NEW
        lastActivity: true     // ✅ NEW
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate score percentage
    const scorePercentage = quizMaxScore > 0 
      ? Math.round((quizScore / quizMaxScore) * 100) 
      : 100

    // ============================================
    // GAMIFICATION: Calculate XP
    // ============================================
    
    const baseXp = 100

    const xpBreakdown = calculateXp({
      baseXp,
      lessonDifficulty: lesson.difficulty as Difficulty,
      userLevel: user.level,
      scorePercentage
    })

    // ============================================
    // CREATE QUIZATTEMPT (if quiz was taken)
    // ============================================
    
    let quizAttempt = null
    if (quizAttempted && lesson.quizId && questionReview) {
      quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId: session.user.id,
          quizId: lesson.quizId,
          score: quizScore,
          maxScore: quizMaxScore,
          passed,
          answers: JSON.stringify(questionReview)
        }
      })
    }

    // Create or update lesson attempt
    const lessonAttempt = await prisma.lessonAttempt.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId
        }
      },
      create: {
        user: { connect: { id: session.user.id } },
        lesson: { connect: { id: lessonId } },
        contentCompleted: true,
        quizAttempted: quizAttempted,
        quizScore: quizScore ?? 0,
        quizMaxScore: quizMaxScore ?? 0,
        passed,
        timeSpent
      },
      update: {
        contentCompleted: true,
        quizAttempted: quizAttempted,
        quizScore: quizScore ?? 0,
        quizMaxScore: quizMaxScore ?? 0,
        passed,
        timeSpent,
        completedAt: new Date()
      }
    })

    // ============================================
    // ✅ STREAK: Calculate new streak values
    // Must happen BEFORE updating lastActivity in DB
    // ============================================
    
    const { newStreak, newLongestStreak, streakChanged, wasReset } = calculateNewStreak({
      currentStreak: user.streak,
      longestStreak: user.longestStreak,
      lastActivity: user.lastActivity   // Still the OLD value at this point — correct
    })

    console.log(`🔥 Streak: ${user.streak} → ${newStreak} (changed: ${streakChanged}, reset: ${wasReset})`)

    // ============================================
    // BADGE CHECK (after streak is calculated,
    // badges can now read the updated streak from DB
    // because we haven't written it yet — badge checker
    // reads streak from user row, so we update first)
    // ============================================

    // Update streak BEFORE badge check so streak badges see correct value
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        streak: newStreak,
        longestStreak: newLongestStreak,
        lastActivity: new Date()
      }
    })

    console.log('🎯 Starting OPTIMIZED badge check (single pass)...')
    
    const badgeResult = await checkAndAwardBadges(prisma, session.user.id, 'lesson')
    
    console.log(`✅ Total badges awarded: ${badgeResult.newBadges.length}`)
    console.log(`⚡ Total badge XP: ${badgeResult.totalXpAwarded}`)

    // Total XP = Lesson XP + All Badge XP
    const totalXpEarned = xpBreakdown.totalXp + badgeResult.totalXpAwarded

    // Update user XP and level
    const newXp = user.xp + totalXpEarned
    const newLevel = calculateLevel(newXp)
    const leveledUp = newLevel > user.level

    // ============================================
    // GAMIFICATION: Update XP, level, accuracy counts
    // (streak + lastActivity already written above)
    // ============================================
    
    const updateData: any = {
      xp: newXp,
      level: newLevel
    }

    if (scorePercentage === 100) {
      updateData.perfectQuizCount = { increment: 1 }
    }
    if (scorePercentage >= 90) {
      updateData.excellentQuizCount = { increment: 1 }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updateData
    })

    // ============================================
    // RESPONSE
    // ============================================

    return NextResponse.json({
      success: true,
      lessonAttempt,
      quizAttempt,
      
      // XP breakdown
      xp: {
        base: xpBreakdown.baseXp,
        difficultyMultiplier: xpBreakdown.difficultyMultiplier,
        levelMultiplier: xpBreakdown.levelMultiplier,
        performanceBonus: xpBreakdown.performanceBonus,
        performanceLabel: xpBreakdown.performanceLabel,
        lessonXp: xpBreakdown.totalXp,
        badgeXp: badgeResult.totalXpAwarded,
        totalXp: totalXpEarned,
        formula: xpBreakdown.formula
      },
      
      xpEarned: totalXpEarned,
      
      // Level info
      level: {
        previous: user.level,
        current: newLevel,
        leveledUp,
        totalXp: newXp
      },
      
      // ✅ Streak info (now actually updated)
      streak: {
        previous: user.streak,
        current: newStreak,
        streakChanged,
        wasReset,
        longestStreak: newLongestStreak
      },
      
      // All badges from optimized single check
      newBadges: badgeResult.newBadges,
      
      // Score
      score: {
        percentage: scorePercentage,
        passed
      }
    })
  } catch (error) {
    console.error('Error submitting lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}