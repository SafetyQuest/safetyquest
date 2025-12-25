// apps/web/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

type Params = Promise<{ id: string }>;

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
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
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const body = await req.json();
    const { name, role, roleId, userTypeId, section, department, supervisor, manager, designation } = body;

    // ============================================
    // HANDLE USER TYPE CHANGE - AUTO PROGRAM REASSIGNMENT
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

        // 1. Remove old usertype assignments
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

        // 2. Assign new usertype programs (FIXED - check for source-specific duplicates)
        if (newUserTypeId) {
          const newUserTypePrograms = await prisma.userTypeProgramAssignment.findMany({
            where: { userTypeId: newUserTypeId },
            select: { programId: true },
          });

          let assignedCount = 0;
          for (const { programId } of newUserTypePrograms) {
            // ✅ FIX: Check for usertype source specifically, not any source
            const existingUserTypeAssignment = await prisma.programAssignment.findFirst({
              where: { 
                userId: id, 
                programId,
                source: 'usertype'  // ✅ Only check for usertype duplicates
              }
            });
            
            if (!existingUserTypeAssignment) {
              await prisma.programAssignment.create({
                data: {
                  userId: id,
                  programId,
                  source: 'usertype',
                  isActive: true,
                  assignedBy: session.user.id, // ✅ Track who changed user type (by ID)
                },
              });
              assignedCount++;
            }
          }
          console.log(`Assigned ${assignedCount} new usertype programs`);
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
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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