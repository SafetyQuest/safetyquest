// apps/web/app/api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { requireLearner, verifyLessonAccess } from '@/utils/learner-auth'
import { PrismaClient } from '@safetyquest/database'
import { LessonDetail } from '@/types/learner'

const prisma = new PrismaClient()

/**
 * GET /api/learner/programs/[id]/courses/[courseId]/lessons/[lessonId]
 * Get full lesson data including steps and quiz
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string; lessonId: string } }
) {
  try {
    // 1. Authenticate
    const user = await requireLearner()
    
    // 2. Authorize - verify access to lesson
    await verifyLessonAccess(
      user.id,
      params.lessonId,
      params.courseId,
      params.id
    )
    
    // 3. Fetch lesson details with steps and quiz
    const lesson = await prisma.lesson.findUnique({
      where: { id: params.lessonId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            type: true,
            contentType: true,
            contentData: true,
            gameType: true,
            gameConfig: true
          }
        },
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                difficulty: true,
                gameType: true,
                gameConfig: true,
                points: true
              }
            }
          }
        }
      }
    })
    
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      )
    }
    
    // 4. Get lesson attempt
    const attempt = await prisma.lessonAttempt.findUnique({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId: params.lessonId
        }
      }
    })
    
    // 5. Parse game configs (they're stored as JSON strings)
    const steps = lesson.steps.map(step => ({
      id: step.id,
      order: step.order,
      type: step.type as 'content' | 'game',
      contentType: step.contentType,
      contentData: step.contentData,
      gameType: step.gameType,
      gameConfig: step.gameConfig ? JSON.parse(step.gameConfig) : null
    }))
    
    // 6. Build quiz data if exists
    let quizData = null
    if (lesson.quiz) {
      quizData = {
        id: lesson.quiz.id,
        title: lesson.quiz.title,
        description: lesson.quiz.description,
        type: lesson.quiz.type,
        passingScore: lesson.quiz.passingScore,
        questions: lesson.quiz.questions.map(q => ({
          id: q.id,
          order: q.order,
          difficulty: q.difficulty,
          gameType: q.gameType,
          gameConfig: JSON.parse(q.gameConfig),
          points: q.points
        }))
      }
    }
    
    // 7. Build response
    const response: LessonDetail = {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      difficulty: lesson.difficulty,
      steps,
      hasQuiz: lesson.quizId !== null,
      quiz: quizData,
      attempt: attempt ? {
        passed: attempt.passed,
        quizScore: attempt.quizScore,
        quizMaxScore: attempt.quizMaxScore,
        scorePercentage: attempt.quizMaxScore > 0
          ? Math.round((attempt.quizScore / attempt.quizMaxScore) * 100)
          : 0,
        timeSpent: attempt.timeSpent,
        completedAt: attempt.completedAt.toISOString()
      } : null
    }
    
    return NextResponse.json({ lesson: response })
    
  } catch (error: any) {
    console.error('Error fetching lesson detail:', error)
    
    let statusCode = 500
    if (error.message?.includes('Unauthorized')) {
      statusCode = 401
    } else if (error.message?.includes('Not enrolled') || error.message?.includes('locked')) {
      statusCode = 403
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}