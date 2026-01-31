// apps/web/app/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/submit/route.ts
// ✅ UPDATED: With cascading badge checks (lesson → course → program)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { verifyLessonAccess } from '@safetyquest/shared/enrollment'
import { PrismaClient } from '@safetyquest/database'
import { 
  calculateXp, 
  checkAndAwardBadges,
  calculateLevel 
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

    // Get current user data for XP calculation
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { xp: true, level: true }
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
    // ✅ CASCADING BADGE CHECKS
    // Check lesson → course → program badges in order
    // ============================================
    
    console.log('🎯 Starting cascading badge checks...')
    
    // 1. Check lesson badges (lesson, accuracy, difficulty)
    console.log('  📘 Checking lesson badges...')
    const lessonBadges = await checkAndAwardBadges(prisma, session.user.id, 'lesson')
    
    // 2. Check course badges (did this lesson complete a course?)
    console.log('  📗 Checking course badges...')
    const courseBadges = await checkAndAwardBadges(prisma, session.user.id, 'course')
    
    // 3. Check program badges (did this course complete a program?)
    console.log('  📕 Checking program badges...')
    const programBadges = await checkAndAwardBadges(prisma, session.user.id, 'program')
    
    // Combine all badge results
    const allNewBadges = [
      ...lessonBadges.newBadges,
      ...courseBadges.newBadges,
      ...programBadges.newBadges
    ]
    
    const totalBadgeXp = lessonBadges.totalXpAwarded + 
                         courseBadges.totalXpAwarded + 
                         programBadges.totalXpAwarded
    
    console.log(`  ✅ Total badges awarded: ${allNewBadges.length}`)
    console.log(`  ⚡ Total badge XP: ${totalBadgeXp}`)

    // Total XP = Lesson XP + All Badge XP
    const totalXpEarned = xpBreakdown.totalXp + totalBadgeXp

    // Update user XP, level, and check for level up
    const newXp = user.xp + totalXpEarned
    const newLevel = calculateLevel(newXp)
    const leveledUp = newLevel > user.level

    // ============================================
    // GAMIFICATION: Update accuracy counts
    // ============================================
    
    const updateData: any = {
      xp: newXp,
      level: newLevel,
      lastActivity: new Date()
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
        badgeXp: totalBadgeXp,  // ✅ All badge XP combined
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
      
      // ✅ All badges from all checks
      newBadges: allNewBadges,
      
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