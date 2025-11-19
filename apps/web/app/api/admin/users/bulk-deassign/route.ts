import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds, programIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!programIds || !Array.isArray(programIds) || programIds.length === 0) {
      return NextResponse.json(
        { error: 'Program IDs are required' },
        { status: 400 }
      );
    }

    // Deactivate manual program assignments for selected users and programs
    // Note: We only deactivate manual assignments, not usertype inherited ones
    const result = await prisma.programAssignment.updateMany({
      where: {
        userId: { in: userIds },
        programId: { in: programIds },
        source: 'manual' // Only deactivate manual assignments
      },
      data: {
        isActive: false
        // Note: updatedAt is automatically handled by Prisma if @updatedAt is set in schema
      }
    });

    // Also get count of usertype assignments that couldn't be removed
    const userTypeAssignments = await prisma.programAssignment.count({
      where: {
        userId: { in: userIds },
        programId: { in: programIds },
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
        : `Successfully deactivated ${result.count} program assignment(s).`
    });
  } catch (error) {
    console.error('Bulk deassignment error:', error);
    return NextResponse.json(
      { error: 'Failed to deassign programs' },
      { status: 500 }
    );
  }
}