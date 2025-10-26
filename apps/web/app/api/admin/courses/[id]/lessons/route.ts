import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST: Add a lesson to a course
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: courseId } = await params;

  try {
    const { lessonId, order } = await req.json();

    // Validate input
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existing = await prisma.courseLesson.findFirst({
      where: {
        courseId,
        lessonId
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Lesson is already in this course' },
        { status: 400 }
      );
    }

    // If order is not provided, get the highest order and add 1
    let finalOrder = order;
    if (finalOrder === undefined) {
      const highestOrder = await prisma.courseLesson.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });

      finalOrder = highestOrder ? highestOrder.order + 1 : 0;
    }

    // Create relationship
    const courseLesson = await prisma.courseLesson.create({
      data: {
        courseId,
        lessonId,
        order: finalOrder
      },
      include: {
        lesson: true
      }
    });

    return NextResponse.json(courseLesson, { status: 201 });
  } catch (error) {
    console.error('Error adding lesson to course:', error);
    return NextResponse.json(
      { error: 'Failed to add lesson to course' },
      { status: 500 }
    );
  }
}