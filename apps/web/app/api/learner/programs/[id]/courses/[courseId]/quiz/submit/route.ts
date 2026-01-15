import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PrismaClient } from '@safetyquest/database'

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
    const { quizScore, quizMaxScore, passed } = body

    // Verify course has quiz
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { quizId: true, title: true }
    })

    if (!course || !course.quizId) {
      return NextResponse.json({ error: 'Course has no quiz' }, { status: 404 })
    }

    // Create or update course attempt
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

    // Calculate XP earned
    let xpEarned = 200 // Base XP for course completion
    if (passed) {
      const scorePercentage = quizMaxScore > 0 ? (quizScore / quizMaxScore) * 100 : 100
      if (scorePercentage >= 90) xpEarned += 100
      else if (scorePercentage >= 80) xpEarned += 50
    }

    // Update user XP
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (user) {
      const newXp = user.xp + xpEarned
      const newLevel = Math.floor(newXp / 1000) + 1

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          xp: newXp,
          level: newLevel,
          lastActivity: new Date()
        }
      })
    }

    return NextResponse.json({
      success: true,
      courseAttempt,
      xpEarned,
      courseTitle: course.title
    })
  } catch (error) {
    console.error('Error submitting course quiz:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}