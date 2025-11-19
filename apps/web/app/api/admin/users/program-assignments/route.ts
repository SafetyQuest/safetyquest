import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get all program assignments for the selected users
    const assignments = await prisma.programAssignment.findMany({
      where: {
        userId: { in: userIds },
        isActive: true
      },
      select: {
        userId: true,
        programId: true,
        source: true,
        isActive: true
      }
    });

    // Organize assignments by programId then userId for easier lookup
    const assignmentMap: Record<string, Record<string, { source: string; isActive: boolean }>> = {};
    
    assignments.forEach(assignment => {
      if (!assignmentMap[assignment.programId]) {
        assignmentMap[assignment.programId] = {};
      }
      assignmentMap[assignment.programId][assignment.userId] = {
        source: assignment.source,
        isActive: assignment.isActive
      };
    });

    return NextResponse.json(assignmentMap);
  } catch (error) {
    console.error('Error fetching program assignments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program assignments' },
      { status: 500 }
    );
  }
}