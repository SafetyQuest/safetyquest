// apps/web/app/api/admin/programs/[id]/courses/[courseId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// DELETE: Remove a course from a program
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id: programId, courseId } = await params;

  try {
    // Check if relationship exists
    const programCourse = await prisma.programCourse.findFirst({
      where: {
        programId,
        courseId
      }
    });

    if (!programCourse) {
      return NextResponse.json(
        { error: 'Course is not in this program' },
        { status: 404 }
      );
    }

    // Delete relationship
    await prisma.programCourse.delete({
      where: {
        id: programCourse.id
      }
    });

    // Reorder remaining courses
    const remainingCourses = await prisma.programCourse.findMany({
      where: { programId },
      orderBy: { order: 'asc' }
    });

    // Update orders to be sequential
    for (let i = 0; i < remainingCourses.length; i++) {
      if (remainingCourses[i].order !== i) {
        await prisma.programCourse.update({
          where: {
            id: remainingCourses[i].id
          },
          data: { order: i }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing course from program:', error);
    return NextResponse.json(
      { error: 'Failed to remove course from program' },
      { status: 500 }
    );
  }
}