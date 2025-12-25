import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET programs assigned to a user type
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const assignments = await prisma.userTypeProgramAssignment.findMany({
      where: { userTypeId: id },
      include: {
        program: true
      }
    });

    const programs = assignments.map(a => a.program);
    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching user type programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST assign program to user type
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { programId } = await req.json();

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Check if already assigned
    const existing = await prisma.userTypeProgramAssignment.findUnique({
      where: {
        userTypeId_programId: {
          userTypeId: id,
          programId: programId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Program already assigned to this user type' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.userTypeProgramAssignment.create({
      data: {
        userTypeId: id,
        programId: programId
      },
      include: {
        program: true
      }
    });

    // Auto-assign to all users with this user type
    const users = await prisma.user.findMany({
      where: { userTypeId: id }
    });

    for (const user of users) {
      // ✅ FIX: Check for usertype source specifically, not any source
      const existingUserTypeAssignment = await prisma.programAssignment.findFirst({
        where: {
          userId: user.id,
          programId: programId,
          source: 'usertype'  // ✅ Only check for usertype duplicates
        }
      });

      if (!existingUserTypeAssignment) {
        await prisma.programAssignment.create({
          data: {
            userId: user.id,
            programId: programId,
            source: 'usertype',
            isActive: true,
            assignedBy: session.user.id, // ✅ Track who assigned program to user type (by ID)
          }
        });
      }
    }

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning program:', error);
    return NextResponse.json(
      { error: 'Failed to assign program' },
      { status: 500 }
    );
  }
}