import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userIds, programId } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'User IDs are required' },
        { status: 400 }
      );
    }

    if (!programId) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    // Create manual program assignments for all selected users
    const assignments = await Promise.all(
      userIds.map(async (userId) => {
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
          return prisma.programAssignment.update({
            where: { id: existing.id },
            data: { isActive: true }
          });
        }

        // Create new manual assignment
        return prisma.programAssignment.create({
          data: {
            userId,
            programId,
            source: 'manual',
            assignedBy: session.user.id,
            isActive: true
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      count: assignments.length
    });
  } catch (error) {
    console.error('Bulk assignment error:', error);
    return NextResponse.json(
      { error: 'Failed to assign programs' },
      { status: 500 }
    );
  }
}