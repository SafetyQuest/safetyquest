// UPDATED: apps/web/app/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { verifyLessonAccess } from '@safetyquest/shared/enrollment'
import { PrismaClient } from '@safetyquest/database'

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
    // ✅ UPDATED: Add quizAttempted to destructured body
    const { quizScore, quizMaxScore, passed, timeSpent, quizAttempted = false } = body

    // ✅ NEW: Check if lesson has a quiz
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { quizId: true }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    const hasQuiz = lesson.quizId !== null

    // ✅ UPDATED: Create or update lesson attempt with new fields
    const lessonAttempt = await prisma.lessonAttempt.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId
        }
      },
      create: {
        userId: session.user.id,
        lessonId,
        contentCompleted: true,      // ✅ NEW: Always true when submitting
        quizAttempted: quizAttempted, // ✅ NEW: True if quiz was taken
        quizScore,
        quizMaxScore,
        passed,
        timeSpent
      },
      update: {
        contentCompleted: true,      // ✅ NEW: Ensure it's true
        quizAttempted: quizAttempted, // ✅ NEW: Update quiz attempt status
        quizScore,
        quizMaxScore,
        passed,
        timeSpent,
        completedAt: new Date()
      }
    })

    // Calculate XP earned (example: 100 XP for completion, bonus for high scores)
    let xpEarned = 100
    if (passed) {
      const scorePercentage = quizMaxScore > 0 ? (quizScore / quizMaxScore) * 100 : 100
      if (scorePercentage >= 90) xpEarned += 50 // Bonus for excellence
      else if (scorePercentage >= 80) xpEarned += 25
    }

    // Update user XP and check for level up
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (user) {
      const newXp = user.xp + xpEarned
      const newLevel = Math.floor(newXp / 1000) + 1 // Level up every 1000 XP

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: newXp,
          level: newLevel,
          lastActivity: new Date()
        }
      })
    }

    // Check for badge awards (placeholder - you can add badge logic here)
    const newBadges: any[] = []

    return NextResponse.json({
      success: true,
      lessonAttempt,
      xpEarned,
      newBadges
    })
  } catch (error) {
    console.error('Error submitting lesson:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}