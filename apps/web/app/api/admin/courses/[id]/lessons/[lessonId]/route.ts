import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// DELETE: Remove a lesson from a course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: courseId, lessonId } = await params;

  try {
    // Check if relationship exists
    const courseLesson = await prisma.courseLesson.findFirst({
      where: {
        courseId,
        lessonId
      }
    });

    if (!courseLesson) {
      return NextResponse.json(
        { error: 'Lesson is not in this course' },
        { status: 404 }
      );
    }

    // Delete relationship
    await prisma.courseLesson.delete({
      where: {
        id: courseLesson.id
      }
    });

    // Reorder remaining lessons
    const remainingLessons = await prisma.courseLesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    });

    // Update orders to be sequential
    for (let i = 0; i < remainingLessons.length; i++) {
      if (remainingLessons[i].order !== i) {
        await prisma.courseLesson.update({
          where: {
            id: remainingLessons[i].id
          },
          data: { order: i }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing lesson from course:', error);
    return NextResponse.json(
      { error: 'Failed to remove lesson from course' },
      { status: 500 }
    );
  }
}