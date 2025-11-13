import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (userIds.includes(session.user.id)) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete related records first
      // Based on your seed file, these are the tables that have userId references:
      
      // Delete program assignments
      await tx.programAssignment.deleteMany({
        where: { userId: { in: userIds } }
      });

      // Delete lesson attempts
      await tx.lessonAttempt.deleteMany({
        where: { userId: { in: userIds } }
      });

      // Delete course attempts
      await tx.courseAttempt.deleteMany({
        where: { userId: { in: userIds } }
      });

      // Delete quiz attempts
      await tx.quizAttempt.deleteMany({
        where: { userId: { in: userIds } }
      });

      // Delete user badges
      await tx.userBadge.deleteMany({
        where: { userId: { in: userIds } }
      });

      // Finally, delete the users
      const deleteResult = await tx.user.deleteMany({
        where: { id: { in: userIds } }
      });

      return deleteResult;
    });

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Successfully deleted ${result.count} user(s)`
    });
  } catch (error: any) {
    console.error('Bulk delete error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to bulk delete users' },
      { status: 500 }
    );
  }
}