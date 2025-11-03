import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET quiz by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return NextResponse.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}

// PATCH update quiz
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, description, slug, type, passingScore, questions } = body;

    // Check if slug exists and is different from current
    if (slug) {
      const existing = await prisma.quiz.findFirst({
        where: { 
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A quiz with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update quiz
    const quiz = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        type,
        passingScore
      }
    });

    // Update questions if provided
    if (questions) {
      // Delete existing questions
      await prisma.quizQuestion.deleteMany({
        where: { quizId: id }
      });

      // Add new questions
      if (questions.length > 0) {
        await prisma.quizQuestion.createMany({
          data: questions.map((q: any, index: number) => ({
            quizId: id,
            order: index,
            difficulty: q.difficulty || 3,
            gameType: q.gameType,
            gameConfig: q.gameConfig,
            points: q.points || 10
          }))
        });
      }
    }

    // Return updated quiz with questions
    const result = await prisma.quiz.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to update quiz' },
      { status: 500 }
    );
  }
}

// DELETE quiz
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check if quiz is used by any lessons or courses
    const relatedLessons = await prisma.lesson.findMany({
      where: { quizId: id }
    });

    const relatedCourses = await prisma.course.findMany({
      where: { quizId: id }
    });

    // If quiz is in use, return error
    if (relatedLessons.length > 0 || relatedCourses.length > 0) {
      return NextResponse.json({
        error: 'This quiz is currently in use and cannot be deleted',
        blockers: {
          lessons: relatedLessons.map(l => ({ id: l.id, title: l.title })),
          courses: relatedCourses.map(c => ({ id: c.id, title: c.title }))
        }
      }, { status: 400 });
    }

    // Delete all questions first
    await prisma.quizQuestion.deleteMany({
      where: { quizId: id }
    });

    // Delete the quiz
    await prisma.quiz.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    return NextResponse.json(
      { error: 'Failed to delete quiz' },
      { status: 500 }
    );
  }
}