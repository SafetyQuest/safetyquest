// apps/web/app/api/admin/user-types/[id]/courses/[courseId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// DELETE unassign course from user type
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; courseId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'settings', 'edit');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id, courseId } = await params;

  try {
    // Check if assignment exists
    const assignment = await prisma.userTypeCourseAssignment.findUnique({
      where: {
        userTypeId_courseId: {
          userTypeId: id,
          courseId: courseId
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Course not assigned to this user type' },
        { status: 404 }
      );
    }

    // Delete the assignment
    await prisma.userTypeCourseAssignment.delete({
      where: {
        userTypeId_courseId: {
          userTypeId: id,
          courseId: courseId
        }
      }
    });

    // Remove course from users who got it from this user type
    // Only remove if source is usertype
    await prisma.courseAssignment.deleteMany({
      where: {
        courseId: courseId,
        source: 'usertype',
        user: {
          userTypeId: id
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unassigning course:', error);
    return NextResponse.json(
      { error: 'Failed to unassign course' },
      { status: 500 }
    );
  }
}