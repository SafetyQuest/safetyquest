import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET course by ID
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
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        programs: {
          include: {
            program: true
          }
        },
        lessons: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                slug: true,
                description: true,
                difficulty: true,
                quizId: true,
                quiz: true
              }
            }
          },
          orderBy: {
            order: 'asc'
          }
        },
        quiz: true
      }
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}

// PATCH update course
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      slug, 
      difficulty, 
      quizId,
      tagIds,
      programIds 
    } = body;

    // Check if slug exists and is different from current
    if (slug) {
      const existing = await prisma.course.findFirst({
        where: { 
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A course with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Create update data with optional quizId
    const updateData: any = {
        title,
        slug,
        description,
        difficulty
    };

    // Only include quizId if it has a non-empty value
    if (quizId && quizId.trim() !== '') {
        updateData.quizId = quizId;
    } else {
        // If quizId is empty, set it to null explicitly
        updateData.quizId = null;
    }

    // Update course
    const course = await prisma.course.update({
      where: { id },
      data: updateData
    });

    // Update tags if provided
    if (tagIds) {
      // Delete existing tags
      await prisma.courseTag.deleteMany({
        where: { courseId: id }
      });

      // Add new tags
      if (tagIds.length > 0) {
        await prisma.courseTag.createMany({
          data: tagIds.map((tagId: string) => ({
            courseId: id,
            tagId
          }))
        });
      }
    }

    // Update programs if provided
    if (programIds) {
      // Get current program associations
      const currentPrograms = await prisma.programCourse.findMany({
        where: { courseId: id },
        select: { programId: true }
      });
      const currentProgramIds = currentPrograms.map(pc => pc.programId);
      
      // Programs to remove
      const programsToRemove = currentProgramIds.filter(pid => !programIds.includes(pid));
      
      // Programs to add
      const programsToAdd = programIds.filter(pid => !currentProgramIds.includes(pid));

      // Remove programs
      if (programsToRemove.length > 0) {
        await prisma.programCourse.deleteMany({
          where: {
            courseId: id,
            programId: { in: programsToRemove }
          }
        });
      }

      // Add new programs
      if (programsToAdd.length > 0) {
        for (const programId of programsToAdd) {
          // Get highest order in this program
          const highestOrder = await prisma.programCourse.findFirst({
            where: { programId },
            orderBy: { order: 'desc' },
            select: { order: true }
          });
          
          const nextOrder = highestOrder ? highestOrder.order + 1 : 0;
          
          await prisma.programCourse.create({
            data: {
              programId,
              courseId: id,
              order: nextOrder
            }
          });
        }
      }
    }

    // Return updated course with tags and programs
    const result = await prisma.course.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        programs: {
          include: {
            program: true
          }
        },
        quiz: true
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}

// DELETE course
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First delete all CourseTag entries
    await prisma.courseTag.deleteMany({
      where: { courseId: id }
    });

    // Delete all ProgramCourse entries
    await prisma.programCourse.deleteMany({
      where: { courseId: id }
    });

    // Delete all CourseLesson entries
    await prisma.courseLesson.deleteMany({
      where: { courseId: id }
    });

    // Delete the course itself
    await prisma.course.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}