// apps/web/app/api/admin/users/bulk-assign-courses/route.ts

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

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Create manual course assignments for all selected users and courses
    const assignments = [];
    
    for (const userId of userIds) {
      for (const courseId of validCourseIds) {
        // Check if assignment already exists
        const existing = await prisma.courseAssignment.findFirst({
          where: {
            userId,
            courseId,
            source: 'manual'
          }
        });

        if (existing) {
          // Update to active if exists
          const updated = await prisma.courseAssignment.update({
            where: { id: existing.id },
            data: { 
              isActive: true,
              assignedBy: session.user.id
            }
          });
          assignments.push(updated);
        } else {
          // Create new manual assignment
          const created = await prisma.courseAssignment.create({
            data: {
              userId,
              courseId,
              source: 'manual',
              assignedBy: session.user.id,
              isActive: true
            }
          });
          assignments.push(created);
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: assignments.length,
      assignments
    });
  } catch (error) {
    console.error('Bulk course assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign courses' },
      { status: 500 }
    );
  }
}