import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// PATCH: Reorder a course within a program
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: programId, courseId } = await params;

  try {
    const { order } = await req.json();

    if (order === undefined) {
      return NextResponse.json(
        { error: 'Order is required' },
        { status: 400 }
      );
    }

    // Find the current relationship
    const currentProgramCourse = await prisma.programCourse.findFirst({
      where: {
        programId,
        courseId
      }
    });

    if (!currentProgramCourse) {
      return NextResponse.json(
        { error: 'Course is not in this program' },
        { status: 404 }
      );
    }

    // Get all course relationships in this program
    const programCourses = await prisma.programCourse.findMany({
      where: { programId },
      orderBy: { order: 'asc' }
    });

    // Handle reordering logic
    const currentOrder = currentProgramCourse.order;
    const newOrder = Math.min(Math.max(0, order), programCourses.length - 1);

    // Update orders
    await prisma.$transaction(async (tx) => {
      // Moving down (to a higher order)
      if (newOrder > currentOrder) {
        for (const pc of programCourses) {
          if (pc.order > currentOrder && pc.order <= newOrder) {
            await tx.programCourse.update({
              where: { id: pc.id },
              data: { order: pc.order - 1 }
            });
          }
        }
      }
      // Moving up (to a lower order)
      else if (newOrder < currentOrder) {
        for (const pc of programCourses) {
          if (pc.order >= newOrder && pc.order < currentOrder) {
            await tx.programCourse.update({
              where: { id: pc.id },
              data: { order: pc.order + 1 }
            });
          }
        }
      }

      // Update the course being moved
      await tx.programCourse.update({
        where: { id: currentProgramCourse.id },
        data: { order: newOrder }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering course:', error);
    return NextResponse.json(
      { error: 'Failed to reorder course' },
      { status: 500 }
    );
  }
}