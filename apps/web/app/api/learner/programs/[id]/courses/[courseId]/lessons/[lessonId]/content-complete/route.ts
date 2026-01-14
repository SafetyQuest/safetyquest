// NEW FILE: apps/web/app/api/learner/programs/[programId]/courses/[courseId]/lessons/[lessonId]/content-complete/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ programId: string; courseId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { programId, courseId, lessonId } = await params
    const body = await req.json()
    const { accumulatedXp } = body

    // Verify access
    const assignment = await prisma.programAssignment.findFirst({
      where: {
        userId: session.user.id,
        programId,
        isActive: true
      }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Not enrolled in this program' }, { status: 403 })
    }

    // Check if lesson has a quiz
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { quizId: true }
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Create or update lesson attempt with contentCompleted = true
    // If lesson has no quiz, also mark as passed
    const hasQuiz = lesson.quizId !== null
    
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
        contentCompleted: true,
        quizAttempted: false,
        quizScore: 0,
        quizMaxScore: 0,
        passed: !hasQuiz,  // If no quiz, mark as passed immediately
        timeSpent: 0
      },
      update: {
        contentCompleted: true,
        // Don't override passed if quiz was already taken
      }
    })

    // Award XP for content completion (even if quiz not taken yet)
    if (accumulatedXp > 0) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: {
            increment: accumulatedXp
          }
        }
      })
    }

    return NextResponse.json({ 
      success: true,
      lessonAttempt 
    })
  } catch (error) {
    console.error('Error saving content completion:', error)
    return NextResponse.json(
      { error: 'Failed to save content completion' },
      { status: 500 }
    )
  }
}