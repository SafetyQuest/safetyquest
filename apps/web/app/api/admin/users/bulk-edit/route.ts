// apps/web/app/api/admin/users/bulk-edit/route.ts
// UPDATED VERSION with Course Assignment Syncing

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'users', 'edit');
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

    // PRE-FETCH user type programs AND courses BEFORE transaction
    let newUserTypeProgramIds: string[] = [];
    let newUserTypeCourseIds: string[] = [];
    
    if (isUserTypeChange && cleanUpdates.userTypeId) {
      // Fetch programs
      const programs = await prisma.userTypeProgramAssignment.findMany({
        where: { userTypeId: cleanUpdates.userTypeId },
        select: { programId: true },
      });
      newUserTypeProgramIds = programs.map(p => p.programId);

      // Fetch courses
      const courses = await prisma.userTypeCourseAssignment.findMany({
        where: { userTypeId: cleanUpdates.userTypeId },
        select: { courseId: true },
      });
      newUserTypeCourseIds = courses.map(c => c.courseId);
    }

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      let programSyncStats = { removed: 0, added: 0, preserved: 0 };
      let courseSyncStats = { removed: 0, added: 0, preserved: 0 };

      // Handle program AND course sync if changing user type
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
              },
              courseAssignments: {
                where: { isActive: true },
                select: { courseId: true, source: true }
              }
            },
          });

          if (!user) continue;
          const oldUserTypeId = user.userTypeId;

          // Skip if user type isn't actually changing
          if (oldUserTypeId === newUserTypeId) continue;

          // ============ SYNC PROGRAMS ============
          const manualProgramAssignments = user.programAssignments.filter(pa => pa.source === 'manual');
          programSyncStats.preserved += manualProgramAssignments.length;

          // Remove old usertype program assignments
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

          // Add new usertype programs
          if (newUserTypeId && newUserTypeProgramIds.length > 0) {
            for (const programId of newUserTypeProgramIds) {
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
                    assignedBy: session.user.id,
                  },
                });
                programSyncStats.added++;
              }
            }
          }

          // ============ SYNC COURSES ============
          const manualCourseAssignments = user.courseAssignments.filter(ca => ca.source === 'manual');
          courseSyncStats.preserved += manualCourseAssignments.length;

          // Remove old usertype course assignments
          if (oldUserTypeId) {
            const oldCourses = await tx.userTypeCourseAssignment.findMany({
              where: { userTypeId: oldUserTypeId },
              select: { courseId: true },
            });

            const oldCourseIds = oldCourses.map(c => c.courseId);
            if (oldCourseIds.length > 0) {
              const deletedCount = await tx.courseAssignment.deleteMany({
                where: {
                  userId,
                  source: 'usertype',
                  courseId: { in: oldCourseIds },
                },
              });
              courseSyncStats.removed += deletedCount.count;
            }
          }

          // Add new usertype courses
          if (newUserTypeId && newUserTypeCourseIds.length > 0) {
            for (const courseId of newUserTypeCourseIds) {
              const existingUserTypeAssignment = await tx.courseAssignment.findFirst({
                where: { 
                  userId, 
                  courseId,
                  source: 'usertype'
                }
              });
              
              if (!existingUserTypeAssignment) {
                await tx.courseAssignment.create({
                  data: {
                    userId,
                    courseId,
                    source: 'usertype',
                    isActive: true,
                    assignedBy: session.user.id,
                  },
                });
                courseSyncStats.added++;
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
        programSync: isUserTypeChange ? programSyncStats : null,
        courseSync: isUserTypeChange ? courseSyncStats : null
      };
    }, {
      timeout: 30000 // 30 seconds for large bulk operations
    });

    // Build success message
    let message = `Updated ${result.count} user(s)`;
    if (result.programSync) {
      message += `. Programs: +${result.programSync.added}, -${result.programSync.removed}, ↔${result.programSync.preserved} preserved`;
    }
    if (result.courseSync) {
      message += `. Courses: +${result.courseSync.added}, -${result.courseSync.removed}, ↔${result.courseSync.preserved} preserved`;
    }

    return NextResponse.json({
      success: true,
      count: result.count,
      programSync: result.programSync,
      courseSync: result.courseSync,
      message
    });
  } catch (error: any) {
    console.error('Bulk edit error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk edit users' },
      { status: 500 }
    );
  }
}