// apps/web/app/api/admin/users/course-assignments/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'users', 'view');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userIdsParam = searchParams.get('userIds');
    
    if (!userIdsParam) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    const userIds = userIdsParam.split(',').filter(id => id.trim());

    // Get all course assignments for the selected users
    const assignments = await prisma.courseAssignment.findMany({
      where: {
        userId: { in: userIds },
        isActive: true
      },
      select: {
        userId: true,
        courseId: true,
        source: true,
        isActive: true
      }
    });

    // Organize assignments by courseId then userId for easier lookup
    const assignmentMap: Record<string, Record<string, { source: string; isActive: boolean }>> = {};
    
    assignments.forEach(assignment => {
      if (!assignmentMap[assignment.courseId]) {
        assignmentMap[assignment.courseId] = {};
      }
      assignmentMap[assignment.courseId][assignment.userId] = {
        source: assignment.source,
        isActive: assignment.isActive
      };
    });

    return NextResponse.json(assignmentMap);
  } catch (error) {
    console.error('Error fetching course assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course assignments' },
      { status: 500 }
    );
  }
}