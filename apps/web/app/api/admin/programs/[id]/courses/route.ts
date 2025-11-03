import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// POST: Add a course to a program
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: programId } = await params;

  try {
    const { courseId, order } = await req.json();

    // Validate input
    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Check if program exists
    const program = await prisma.program.findUnique({
      where: { id: programId }
    });

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existing = await prisma.programCourse.findFirst({
      where: {
        programId,
        courseId
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Course is already in this program' },
        { status: 400 }
      );
    }

    // If order is not provided, get the highest order and add 1
    let finalOrder = order;
    if (finalOrder === undefined) {
      const highestOrder = await prisma.programCourse.findFirst({
        where: { programId },
        orderBy: { order: 'desc' },
        select: { order: true }
      });

      finalOrder = highestOrder ? highestOrder.order + 1 : 0;
    }

    // Create relationship
    const programCourse = await prisma.programCourse.create({
      data: {
        programId,
        courseId,
        order: finalOrder
      },
      include: {
        course: true
      }
    });

    return NextResponse.json(programCourse, { status: 201 });
  } catch (error) {
    console.error('Error adding course to program:', error);
    return NextResponse.json(
      { error: 'Failed to add course to program' },
      { status: 500 }
    );
  }
}