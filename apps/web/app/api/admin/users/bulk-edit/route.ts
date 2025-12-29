// apps/web/app/api/admin/users/bulk-edit/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds, updates } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs are required' }, { status: 400 });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Updates are required' }, { status: 400 });
    }

    // Remove undefined/empty string values
    const cleanUpdates: any = {};
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        cleanUpdates[key] = value;
      }
    });

    if (Object.keys(cleanUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    // Detect userTypeId change
    const isUserTypeChange = 'userTypeId' in cleanUpdates;

    // PRE-FETCH user type programs BEFORE transaction to avoid timeout
    let newUserTypeProgramIds: string[] = [];
    if (isUserTypeChange && cleanUpdates.userTypeId) {
      const programs = await prisma.userTypeProgramAssignment.findMany({
        where: { userTypeId: cleanUpdates.userTypeId },
        select: { programId: true },
      });
      newUserTypeProgramIds = programs.map(p => p.programId);
    }

    // Use transaction for atomicity (with timeout increase)
    const result = await prisma.$transaction(async (tx) => {
      let programSyncStats = { removed: 0, added: 0, preserved: 0 };

      // Handle program sync if changing user type
      if (isUserTypeChange) {
        const newUserTypeId = cleanUpdates.userTypeId || null;

        for (const userId of userIds) {
          // Get current user data
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { 
              userTypeId: true,
              programAssignments: {
                where: { isActive: true },
                select: { programId: true, source: true }
              }
            },
          });

          if (!user) continue;

          const oldUserTypeId = user.userTypeId;

          // Skip if user type isn't actually changing
          if (oldUserTypeId === newUserTypeId) continue;

          // Count manual assignments (will be preserved)
          const manualAssignments = user.programAssignments.filter(pa => pa.source === 'manual');
          programSyncStats.preserved += manualAssignments.length;

          // 1. Remove old usertype assignments
          if (oldUserTypeId) {
            const oldPrograms = await tx.userTypeProgramAssignment.findMany({
              where: { userTypeId: oldUserTypeId },
              select: { programId: true },
            });

            const oldProgramIds = oldPrograms.map(p => p.programId);
            if (oldProgramIds.length > 0) {
              const deletedCount = await tx.programAssignment.deleteMany({
                where: {
                  userId,
                  source: 'usertype',
                  programId: { in: oldProgramIds },
                },
              });
              programSyncStats.removed += deletedCount.count;
            }
          }

          // 2. Add new usertype programs (using pre-fetched IDs)
          if (newUserTypeId && newUserTypeProgramIds.length > 0) {
            for (const programId of newUserTypeProgramIds) {
              // Check for usertype-specific duplicate only
              const existingUserTypeAssignment = await tx.programAssignment.findFirst({
                where: { 
                  userId, 
                  programId,
                  source: 'usertype'
                }
              });
              
              if (!existingUserTypeAssignment) {
                await tx.programAssignment.create({
                  data: {
                    userId,
                    programId,
                    source: 'usertype',
                    isActive: true,
                    assignedBy: session.user.id, // ✅ Track who changed user type (by ID)
                  },
                });
                programSyncStats.added++;
              }
            }
          }
        }
      }

      // Perform bulk update
      const updateResult = await tx.user.updateMany({
        where: { id: { in: userIds } },
        data: cleanUpdates
      });

      return {
        count: updateResult.count,
        programSync: isUserTypeChange ? programSyncStats : null
      };
    }, {
      timeout: 30000 // 30 seconds for large bulk operations
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      programSync: result.programSync,
      message: result.programSync
        ? `Updated ${result.count} user(s). Programs: +${result.programSync.added}, -${result.programSync.removed}, ↔${result.programSync.preserved} preserved.`
        : `Successfully updated ${result.count} user(s)`
    });
  } catch (error: any) {
    console.error('Bulk edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk edit users' },
      { status: 500 }
    );
  }
}