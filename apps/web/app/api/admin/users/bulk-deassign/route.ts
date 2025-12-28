// apps/web/app/api/admin/users/bulk-deassign/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
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

    // ====== ADD PROGRAM ID VALIDATION ======
    const validPrograms = await prisma.program.findMany({
      where: { id: { in: programIds } },
      select: { id: true }
    });

    const validProgramIds = validPrograms.map(p => p.id);
    const invalidProgramIds = programIds.filter(id => !validProgramIds.includes(id));

    if (invalidProgramIds.length > 0) {
      return NextResponse.json({
        error: `Invalid program IDs: ${invalidProgramIds.join(', ')}`,
        invalidProgramIds
      }, { status: 400 });
    }
    // ====== END VALIDATION ======

    // Deactivate manual program assignments for selected users and programs
    const result = await prisma.programAssignment.updateMany({
      where: {
        userId: { in: userIds },
        programId: { in: validProgramIds }, // Use validated IDs
        source: 'manual' // Only deactivate manual assignments
      },
      data: {
        isActive: false
      }
    });

    // Also get count of usertype assignments that couldn't be removed
    const userTypeAssignments = await prisma.programAssignment.count({
      where: {
        userId: { in: userIds },
        programId: { in: validProgramIds }, // Use validated IDs
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