// apps/web/app/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/submit/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../../auth/[...nextauth]/route'
import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string; lessonId: string }> }
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
    const body = await request.json()
    const { quizScore, quizMaxScore, passed, timeSpent } = body

    // Verify user has access to this lesson
    const assignment = await prisma.programAssignment.findFirst({
      where: {
        userId: session.user.id,
        programId: id,
        isActive: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Not enrolled in this program' },
        { status: 403 }
      )
    }

    // Verify course is in program
    const programCourse = await prisma.programCourse.findFirst({
      where: { programId: id, courseId }
    })

    if (!programCourse) {
      return NextResponse.json(
        { error: 'Course not found in program' },
        { status: 404 }
      )
    }

    // Verify lesson is in course
    const courseLesson = await prisma.courseLesson.findFirst({
      where: { courseId, lessonId }
    })

    if (!courseLesson) {
      return NextResponse.json(
        { error: 'Lesson not found in course' },
        { status: 404 }
      )
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
        userId: session.user.id,
        lessonId,
        quizScore,
        quizMaxScore,
        passed,
        timeSpent
      },
      update: {
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