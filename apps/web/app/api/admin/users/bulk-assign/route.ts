// apps/web/app/api/admin/users/bulk-assign/route.ts

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

  if (!session) {
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

    // Create manual program assignments for all selected users and programs
    const assignments = [];
    
    for (const userId of userIds) {
      for (const programId of validProgramIds) { // Use validated IDs
        // Check if assignment already exists
        const existing = await prisma.programAssignment.findFirst({
          where: {
            userId,
            programId,
            source: 'manual'
          }
        });

        if (existing) {
          // Update to active if exists
          const updated = await prisma.programAssignment.update({
            where: { id: existing.id },
            data: { 
              isActive: true,
              assignedBy: session.user.id
            }
          });
          assignments.push(updated);
        } else {
          // Create new manual assignment
          const created = await prisma.programAssignment.create({
            data: {
              userId,
              programId,
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
    console.error('Bulk assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign programs' },
      { status: 500 }
    );
  }
}