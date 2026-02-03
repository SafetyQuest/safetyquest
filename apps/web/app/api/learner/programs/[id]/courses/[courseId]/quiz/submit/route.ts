// apps/web/app/api/learner/programs/[id]/courses/[courseId]/quiz/submit/route.ts
// ✅ OPTIMIZED: Single badge check instead of cascading calls

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PrismaClient } from '@safetyquest/database'
import { 
  calculateXp, 
  checkAndAwardBadges,  // ✅ This now uses the optimized version
  calculateLevel 
} from '@safetyquest/shared/gamification'
import type { Difficulty } from '@safetyquest/shared/gamification'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, courseId } = await params
    const body = await request.json()
    const { quizScore, quizMaxScore, passed, questionReview } = body

    // Verify course has quiz and get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { 
        quizId: true, 
        title: true,
        difficulty: true
      }
    })

    if (!course || !course.quizId) {
      return NextResponse.json({ error: 'Course has no quiz' }, { status: 404 })
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
    
    const baseXp = 200 // Base XP for course quizzes

    const xpBreakdown = calculateXp({
      baseXp,
      lessonDifficulty: (course.difficulty as Difficulty) || 'Intermediate',
      userLevel: user.level,
      scorePercentage
    })

    // ============================================
    // CREATE QUIZATTEMPT (detailed record)
    // ============================================
    
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: course.quizId,
        score: quizScore,
        maxScore: quizMaxScore,
        passed,
        answers: JSON.stringify(questionReview)
      }
    })

    // ============================================
    // CREATE/UPDATE COURSEATTEMPT (summary record)
    // ============================================
    
    const courseAttempt = await prisma.courseAttempt.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId
        }
      },
      create: {
        userId: session.user.id,
        courseId,
        quizScore,
        quizMaxScore,
        passed
      },
      update: {
        quizScore,
        quizMaxScore,
        passed,
        completedAt: new Date()
      }
    })

    // ============================================
    // ✅ OPTIMIZED: Single badge check with cascade
    // Instead of 2 separate calls, now just ONE call
    // It will automatically cascade: course → program
    // ============================================
    
    console.log('🎯 Starting OPTIMIZED badge check (single pass)...')
    
    const badgeResult = await checkAndAwardBadges(prisma, session.user.id, 'course')
    
    console.log(`✅ Total badges awarded: ${badgeResult.newBadges.length}`)
    console.log(`⚡ Total badge XP: ${badgeResult.totalXpAwarded}`)

    // Total XP = Course XP + All Badge XP
    const totalXpEarned = xpBreakdown.totalXp + badgeResult.totalXpAwarded

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
      courseAttempt,
      quizAttempt,
      courseTitle: course.title,
      
      // XP breakdown
      xp: {
        base: xpBreakdown.baseXp,
        difficultyMultiplier: xpBreakdown.difficultyMultiplier,
        levelMultiplier: xpBreakdown.levelMultiplier,
        performanceBonus: xpBreakdown.performanceBonus,
        performanceLabel: xpBreakdown.performanceLabel,
        courseXp: xpBreakdown.totalXp,
        badgeXp: badgeResult.totalXpAwarded,  // ✅ All badge XP from single call
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
      
      // ✅ All badges from optimized single check
      newBadges: badgeResult.newBadges,
      
      // Score
      score: {
        percentage: scorePercentage,
        passed
      }
    })
  } catch (error) {
    console.error('Error submitting course quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}