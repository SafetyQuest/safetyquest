import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET program by ID
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
    const program = await prisma.program.findUnique({
      where: { id },
      include: {
        // Change from userType to userTypes
        userTypes: {
            include: {
              userType: true // Include the actual UserType through the junction
            }
          },
        courses: {
          include: {
            course: {
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
        }
      }
    });

    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PATCH update program
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
    const { title, description, isActive, userTypeId, slug } = body;

    // Check if slug exists and is different from current
    if (slug) {
      const existing = await prisma.program.findFirst({
        where: { 
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A program with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Get current userType relationship
    const currentUserTypeProgram = await prisma.userTypeProgramAssignment.findFirst({
      where: { programId: id },
      select: { userTypeId: true }
    });

    // Update program without userTypeId
    const program = await prisma.program.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        isActive
        // Remove userTypeId from here
      },
      include: {
        userTypes: true, // Changed from userType
        courses: true
      }
    });

    // Handle userType change logic
    if (userTypeId !== currentUserTypeProgram?.userTypeId) {
      // If there's an existing relationship, delete it
      if (currentUserTypeProgram) {
        await prisma.userTypeProgramAssignment.deleteMany({
          where: {
            userTypeId: currentUserTypeProgram.userTypeId,
            programId: id
          }
        });
      }

      // If new userTypeId exists, create new UserTypeProgramAssignment
      if (userTypeId) {
        await prisma.userTypeProgramAssignment.create({
          data: {
            userTypeId,
            programId: id
          }
        });

        // Get all users with this userType
        const users = await prisma.user.findMany({
          where: { userTypeId }
        });

        // Create program assignments for each user that doesn't already have this program
        if (users.length > 0) {
          for (const user of users) {
            // Check if user already has this program
            const existingAssignment = await prisma.programAssignment.findFirst({
              where: {
                userId: user.id,
                programId: id,
                source: 'usertype'
              }
            });

            if (!existingAssignment) {
              await prisma.programAssignment.create({
                data: {
                  userId: user.id,
                  programId: id,
                  source: 'usertype',
                  assignedBy: session.user.id,
                  isActive: true
                }
              });
            }
          }
        }
      }
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error updating program:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}

// DELETE program
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // This function looks good as is, since it doesn't reference userType directly
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First delete all ProgramCourse junction entries
    await prisma.programCourse.deleteMany({
      where: { programId: id }
    });

    // Then delete all UserTypeProgramAssignment entries
    await prisma.userTypeProgramAssignment.deleteMany({
      where: { programId: id }
    });

    // Finally delete the program
    await prisma.program.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting program:', error);
    return NextResponse.json(
      { error: 'Failed to delete program' },
      { status: 500 }
    );
  }
}