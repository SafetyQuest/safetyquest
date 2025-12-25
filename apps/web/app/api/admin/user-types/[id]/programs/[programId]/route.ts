import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// DELETE unassign program from user type
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; programId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id, programId } = await params;

  try {
    // Check if assignment exists
    const assignment = await prisma.userTypeProgramAssignment.findUnique({
      where: {
        userTypeId_programId: {
          userTypeId: id,
          programId: programId
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'Program not assigned to this user type' },
        { status: 404 }
      );
    }

    // Delete the assignment
    await prisma.userTypeProgramAssignment.delete({
      where: {
        userTypeId_programId: {
          userTypeId: id,
          programId: programId
        }
      }
    });

    // Remove program from users who got it from this user type
    // Only remove if source is usertype
    await prisma.programAssignment.deleteMany({
      where: {
        programId: programId,
        source: 'usertype',
        user: {
          userTypeId: id
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unassigning program:', error);
    return NextResponse.json(
      { error: 'Failed to unassign program' },
      { status: 500 }
    );
  }
}