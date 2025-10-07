import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function deleteUserTypeWithCleanup(userTypeId: string) {
  return await prisma.$transaction(async (tx) => {
    // 1. Find all users with this UserType
    const affectedUsers = await tx.user.findMany({
      where: { userTypeId },
      select: { id: true, email: true, name: true }
    });

    console.log(`🔍 Found ${affectedUsers.length} users with this UserType`);

    // 2. Delete inherited program assignments for these users
    const deletedAssignments = await tx.programAssignment.deleteMany({
      where: {
        userId: { in: affectedUsers.map(u => u.id) },
        source: 'usertype'
      }
    });

    console.log(`🗑️  Deleted ${deletedAssignments.count} inherited program assignments`);

    // 3. Set userTypeId to null for affected users
    await tx.user.updateMany({
      where: { userTypeId },
      data: { userTypeId: null }
    });

    console.log(`🔓 Released ${affectedUsers.length} users from UserType`);

    // 4. Delete UserType (cascades UserTypeProgramAssignment automatically)
    const deleted = await tx.userType.delete({
      where: { id: userTypeId }
    });

    console.log(`✅ UserType "${deleted.name}" deleted successfully`);

    return {
      deletedUserType: deleted,
      affectedUsers: affectedUsers.length,
      deletedAssignments: deletedAssignments.count
    };
  });
}

// Check before deletion - returns impact analysis
export async function analyzeUserTypeDeletion(userTypeId: string) {
  const userType = await prisma.userType.findUnique({
    where: { id: userTypeId },
    include: {
      users: {
        select: { id: true, email: true, name: true }
      },
      programs: {
        include: {
          program: {
            select: { id: true, title: true }
          }
        }
      }
    }
  });

  if (!userType) {
    throw new Error('UserType not found');
  }

  // Find how many inherited assignments will be deleted
  const inheritedAssignments = await prisma.programAssignment.count({
    where: {
      userId: { in: userType.users.map(u => u.id) },
      source: 'usertype'
    }
  });

  // Find users who ONLY have inherited programs (will lose all access)
  const usersLosingAllAccess = [];
  for (const user of userType.users) {
    const manualAssignments = await prisma.programAssignment.count({
      where: {
        userId: user.id,
        source: 'manual'
      }
    });

    if (manualAssignments === 0) {
      usersLosingAllAccess.push(user);
    }
  }

  return {
    userType: {
      id: userType.id,
      name: userType.name
    },
    affectedUsers: userType.users.length,
    inheritedPrograms: userType.programs.map(p => p.program.title),
    inheritedAssignmentsToDelete: inheritedAssignments,
    usersLosingAllAccess: usersLosingAllAccess.length,
    usersWithManualAssignments: userType.users.length - usersLosingAllAccess.length,
    warning: usersLosingAllAccess.length > 0 
      ? `⚠️  ${usersLosingAllAccess.length} users will lose ALL program access!`
      : '✅ All affected users have manual assignments to fall back on'
  };
}