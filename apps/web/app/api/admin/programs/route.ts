import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET all programs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                     searchParams.get('isActive') === 'false' ? false : undefined;
    
    const programs = await prisma.program.findMany({
      where: {
        AND: [
          search ? { title: { contains: search } } : {},
          isActive !== undefined ? { isActive } : {}
        ]
      },
      include: {
        userTypes: {
          include: {
            userType: true 
          }
        },
        courses: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        }
      },
      orderBy: { title: 'asc' }
    });

    return NextResponse.json(programs);
  } catch (error) {
    console.error('Error fetching programs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}

// POST new program
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, isActive, userTypeId, slug } = body;

    // Generate slug if not provided
    const finalSlug = slug || title.toLowerCase().replace(/\s+/g, '-');

    // Check if slug exists
    const existing = await prisma.program.findUnique({
      where: { slug: finalSlug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A program with this slug already exists' },
        { status: 400 }
      );
    }

    // Create program
    const program = await prisma.program.create({
      data: {
        title,
        slug: finalSlug,
        description,
        isActive: isActive ?? true,
      },
      include: {
        userTypes: true, // Changed from userType to userTypes
        courses: true
      }
    });

    // If userTypeId is specified, create assignments for all users of this type
    if (userTypeId) {
      // Create UserTypeProgramAssignment
      await prisma.userTypeProgramAssignment.create({
        data: {
          userTypeId,
          programId: program.id
        }
      });

      // Get all users with this userType
      const users = await prisma.user.findMany({
        where: { userTypeId }
      });

      // Create program assignments for each user
      if (users.length > 0) {
        await prisma.programAssignment.createMany({
          data: users.map(user => ({
            userId: user.id,
            programId: program.id,
            source: 'usertype',
            assignedBy: session.user.id,
            isActive: true
          }))
        });
      }
    }

    return NextResponse.json(program, { status: 201 });
  } catch (error) {
    console.error('Error creating program:', error);
    return NextResponse.json(
      { error: 'Failed to create program' },
      { status: 500 }
    );
  }
}