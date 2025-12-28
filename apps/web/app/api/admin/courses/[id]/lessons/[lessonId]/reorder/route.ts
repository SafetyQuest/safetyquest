// apps/web/app/api/admin/courses/[id]/lessons/[lessonId]/reorder/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// PATCH: Reorder a lesson within a course
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id: courseId, lessonId } = await params;

  try {
    const { order } = await req.json();

    if (order === undefined) {
      return NextResponse.json(
        { error: 'Order is required' },
        { status: 400 }
      );
    }

    // Find the current relationship
    const currentCourseLesson = await prisma.courseLesson.findFirst({
      where: {
        courseId,
        lessonId
      }
    });

    if (!currentCourseLesson) {
      return NextResponse.json(
        { error: 'Lesson is not in this course' },
        { status: 404 }
      );
    }

    // Get all lesson relationships in this course
    const courseLessons = await prisma.courseLesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' }
    });

    // Handle reordering logic
    const currentOrder = currentCourseLesson.order;
    const newOrder = Math.min(Math.max(0, order), courseLessons.length - 1);

    // Update orders
    await prisma.$transaction(async (tx) => {
      // Moving down (to a higher order)
      if (newOrder > currentOrder) {
        for (const cl of courseLessons) {
          if (cl.order > currentOrder && cl.order <= newOrder) {
            await tx.courseLesson.update({
              where: { id: cl.id },
              data: { order: cl.order - 1 }
            });
          }
        }
      }
      // Moving up (to a lower order)
      else if (newOrder < currentOrder) {
        for (const cl of courseLessons) {
          if (cl.order >= newOrder && cl.order < currentOrder) {
            await tx.courseLesson.update({
              where: { id: cl.id },
              data: { order: cl.order + 1 }
            });
          }
        }
      }

      // Update the lesson being moved
      await tx.courseLesson.update({
        where: { id: currentCourseLesson.id },
        data: { order: newOrder }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering lesson:', error);
    return NextResponse.json(
      { error: 'Failed to reorder lesson' },
      { status: 500 }
    );
  }
}