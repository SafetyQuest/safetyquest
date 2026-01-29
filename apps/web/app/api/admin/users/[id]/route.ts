import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

type Params = Promise<{ id: string }>;

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userType: true,
        roleModel: true,
        programAssignments: { include: { program: true } },
        courseAssignments: { include: { course: true } },
        lessonAttempts: true,
        courseAttempts: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const body = await req.json();
    const { name, role, roleId, userTypeId, section, department, supervisor, manager, designation } = body;

    // ============================================
    // HANDLE USER TYPE CHANGE - AUTO PROGRAM & COURSE REASSIGNMENT
    // ============================================
    if (userTypeId !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: { userTypeId: true },
      });

      const oldUserTypeId = user?.userTypeId;
      const newUserTypeId = userTypeId;

      if (oldUserTypeId !== newUserTypeId) {
        console.log(`User type changing from ${oldUserTypeId} to ${newUserTypeId}`);

        // ============================================
        // 1. REMOVE OLD USERTYPE PROGRAM ASSIGNMENTS
        // ============================================
        if (oldUserTypeId) {
          const oldPrograms = await prisma.userTypeProgramAssignment.findMany({
            where: { userTypeId: oldUserTypeId },
            select: { programId: true },
          });

          const oldProgramIds = oldPrograms.map(p => p.programId);
          if (oldProgramIds.length > 0) {
            const deletedCount = await prisma.programAssignment.deleteMany({
              where: {
                userId: id,
                source: 'usertype',
                programId: { in: oldProgramIds },
              },
            });
            console.log(`Removed ${deletedCount.count} old usertype programs`);
          }
        }

        // ============================================
        // 2. ASSIGN NEW USERTYPE PROGRAMS
        // ============================================
        if (newUserTypeId) {
          const newUserTypePrograms = await prisma.userTypeProgramAssignment.findMany({
            where: { userTypeId: newUserTypeId },
            select: { programId: true },
          });

          let assignedCount = 0;
          for (const { programId } of newUserTypePrograms) {
            // ✅ Check for usertype source specifically, not any source
            const existingUserTypeAssignment = await prisma.programAssignment.findFirst({
              where: { 
                userId: id, 
                programId,
                source: 'usertype'
              }
            });
            
            if (!existingUserTypeAssignment) {
              await prisma.programAssignment.create({
                data: {
                  userId: id,
                  programId,
                  source: 'usertype',
                  isActive: true,
                  assignedBy: session.user.id,
                },
              });
              assignedCount++;
            }
          }
          console.log(`Assigned ${assignedCount} new usertype programs`);
        }

        // ============================================
        // 3. REMOVE OLD USERTYPE COURSE ASSIGNMENTS
        // ============================================
        if (oldUserTypeId) {
          const oldCourses = await prisma.userTypeCourseAssignment.findMany({
            where: { userTypeId: oldUserTypeId },
            select: { courseId: true },
          });

          const oldCourseIds = oldCourses.map(c => c.courseId);
          if (oldCourseIds.length > 0) {
            const deletedCount = await prisma.courseAssignment.deleteMany({
              where: {
                userId: id,
                source: 'usertype',
                courseId: { in: oldCourseIds },
              },
            });
            console.log(`Removed ${deletedCount.count} old usertype courses`);
          }
        }

        // ============================================
        // 4. ASSIGN NEW USERTYPE COURSES
        // ============================================
        if (newUserTypeId) {
          const newUserTypeCourses = await prisma.userTypeCourseAssignment.findMany({
            where: { userTypeId: newUserTypeId },
            select: { courseId: true },
          });

          let assignedCount = 0;
          for (const { courseId } of newUserTypeCourses) {
            // ✅ Check for usertype source specifically, not any source
            const existingUserTypeAssignment = await prisma.courseAssignment.findFirst({
              where: { 
                userId: id, 
                courseId,
                source: 'usertype'
              }
            });
            
            if (!existingUserTypeAssignment) {
              await prisma.courseAssignment.create({
                data: {
                  userId: id,
                  courseId,
                  source: 'usertype',
                  isActive: true,
                  assignedBy: session.user.id,
                },
              });
              assignedCount++;
            }
          }
          console.log(`Assigned ${assignedCount} new usertype courses`);
        }
      }
    }

    // ============================================
    // UPDATE USER
    // ============================================
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (userTypeId !== undefined) updateData.userTypeId = userTypeId;
    if (section !== undefined) updateData.section = section;
    if (department !== undefined) updateData.department = department;
    if (supervisor !== undefined) updateData.supervisor = supervisor;
    if (manager !== undefined) updateData.manager = manager;
    if (designation !== undefined) updateData.designation = designation;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        userType: true,
        roleModel: true,
        programAssignments: { include: { program: true } },
        courseAssignments: { include: { course: true } },
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}