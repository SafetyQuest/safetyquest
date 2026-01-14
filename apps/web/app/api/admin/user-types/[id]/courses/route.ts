// apps/web/app/api/admin/user-types/[id]/courses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// GET courses assigned to a user type
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'settings', 'view');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const assignments = await prisma.userTypeCourseAssignment.findMany({
      where: { userTypeId: id },
      include: {
        course: true
      }
    });

    const courses = assignments.map(a => a.course);
    return NextResponse.json(courses);
  } catch (error) {
    console.error('Error fetching user type courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST assign course to user type
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'settings', 'edit');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.userTypeCourseAssignment.findUnique({
      where: {
        userTypeId_courseId: {
          userTypeId: id,
          courseId: courseId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Course already assigned to this user type' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.userTypeCourseAssignment.create({
      data: {
        userTypeId: id,
        courseId: courseId
      },
      include: {
        course: true
      }
    });

    // Auto-assign to all users with this user type
    const users = await prisma.user.findMany({
      where: { userTypeId: id }
    });

    for (const user of users) {
      // Check for usertype source specifically
      const existingUserTypeAssignment = await prisma.courseAssignment.findFirst({
        where: {
          userId: user.id,
          courseId: courseId,
          source: 'usertype'
        }
      });

      if (!existingUserTypeAssignment) {
        await prisma.courseAssignment.create({
          data: {
            userId: user.id,
            courseId: courseId,
            source: 'usertype',
            isActive: true,
            assignedBy: session.user.id,
          }
        });
      }
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning course:', error);
    return NextResponse.json(
      { error: 'Failed to assign course' },
      { status: 500 }
    );
  }
}