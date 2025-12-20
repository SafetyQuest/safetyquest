// apps/web/app/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/progress/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../../auth/[...nextauth]/route'
import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

/**
 * POST - Save lesson progress
 * Allows users to resume their lesson from where they left off
 */
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

    const { id: programId, courseId, lessonId } = await params
    const body = await request.json()
    const { currentStepIndex, completedSteps, accumulatedXp } = body

    // Validate input
    if (
      typeof currentStepIndex !== 'number' ||
      !Array.isArray(completedSteps) ||
      typeof accumulatedXp !== 'number'
    ) {
      return NextResponse.json(
        { error: 'Invalid progress data' },
        { status: 400 }
      )
    }

    // Verify user has access to this lesson
    const assignment = await prisma.programAssignment.findFirst({
      where: {
        userId: session.user.id,
        programId,
        isActive: true
      }
    })

    if (!assignment) {
      return NextResponse.json(
        { error: 'Not enrolled in this program' },
        { status: 403 }
      )
    }

    // Verify lesson exists in course
    const courseLesson = await prisma.courseLesson.findFirst({
      where: { courseId, lessonId }
    })

    if (!courseLesson) {
      return NextResponse.json(
        { error: 'Lesson not found in course' },
        { status: 404 }
      )
    }

    // Upsert progress (create or update)
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId
        }
      },
      create: {
        userId: session.user.id,
        lessonId,
        currentStepIndex,
        completedSteps: JSON.stringify(completedSteps),
        accumulatedXp
      },
      update: {
        currentStepIndex,
        completedSteps: JSON.stringify(completedSteps),
        accumulatedXp,
        lastActivityAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      progress: {
        currentStepIndex: progress.currentStepIndex,
        completedSteps: JSON.parse(progress.completedSteps),
        accumulatedXp: progress.accumulatedXp,
        lastActivityAt: progress.lastActivityAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error saving lesson progress:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Clear lesson progress
 * Called when lesson is successfully completed
 */
export async function DELETE(
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

    const { lessonId } = await params

    // Delete progress record
    await prisma.lessonProgress.deleteMany({
      where: {
        userId: session.user.id,
        lessonId
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Progress cleared'
    })
  } catch (error) {
    console.error('Error clearing lesson progress:', error)
    return NextResponse.json(
      { error: 'Failed to clear progress' },
      { status: 500 }
    )
  }
}

/**
 * GET - Retrieve lesson progress
 * Optional endpoint to explicitly fetch progress
 */
export async function GET(
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

    const { lessonId } = await params

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId
        }
      }
    })

    if (!progress) {
      return NextResponse.json({
        progress: null
      })
    }

    return NextResponse.json({
      progress: {
        currentStepIndex: progress.currentStepIndex,
        completedSteps: JSON.parse(progress.completedSteps),
        accumulatedXp: progress.accumulatedXp,
        lastActivityAt: progress.lastActivityAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching lesson progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}