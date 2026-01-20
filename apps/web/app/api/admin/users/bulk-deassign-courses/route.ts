// apps/web/app/api/admin/users/bulk-deassign-courses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'users', 'edit');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds, courseIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        { error: 'Course IDs are required' },
        { status: 400 }
      );
    }

    // Validate course IDs
    const validCourses = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      select: { id: true }
    });

    const validCourseIds = validCourses.map(c => c.id);
    const invalidCourseIds = courseIds.filter(id => !validCourseIds.includes(id));

    if (invalidCourseIds.length > 0) {
      return NextResponse.json({
        error: `Invalid course IDs: ${invalidCourseIds.join(', ')}`,
        invalidCourseIds
      }, { status: 400 });
    }

    // Deactivate manual course assignments for selected users and courses
    const result = await prisma.courseAssignment.updateMany({
      where: {
        userId: { in: userIds },
        courseId: { in: validCourseIds },
        source: 'manual' // Only deactivate manual assignments
      },
      data: {
        isActive: false
      }
    });

    // Also get count of usertype assignments that couldn't be removed
    const userTypeAssignments = await prisma.courseAssignment.count({
      where: {
        userId: { in: userIds },
        courseId: { in: validCourseIds },
        source: 'usertype',
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      deactivated: result.count,
      skippedUserTypeAssignments: userTypeAssignments,
      message: userTypeAssignments > 0 
        ? `Deactivated ${result.count} manual assignment(s). ${userTypeAssignments} User Type inherited assignment(s) were not removed.`
        : `Successfully deactivated ${result.count} course assignment(s).`
    });
  } catch (error) {
    console.error('Bulk course deassignment error:', error);
    return NextResponse.json(
      { error: 'Failed to deassign courses' },
      { status: 500 }
    );
  }
}