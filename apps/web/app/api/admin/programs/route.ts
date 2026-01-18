// apps/web/app/api/admin/programs/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// GET all programs
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const isActive = searchParams.get('isActive') === 'true' ? true : 
                     searchParams.get('isActive') === 'false' ? false : undefined;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    
    const where = {
      AND: [
        search ? { title: { contains: search } } : {},
        isActive !== undefined ? { isActive } : {}
      ]
    };

    // Get total count
    const total = await prisma.program.count({ where });
    
    const programs = await prisma.program.findMany({
      where,
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
      orderBy: { title: 'asc' },
      ...(limit ? { skip, take: limit } : {})
    });

    if (!limit) {
      return NextResponse.json(programs);
    }
    
    return NextResponse.json({
      programs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      },
      total,
      totalPages: Math.ceil(total / limit)
    });
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
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, isActive, userTypeIds, slug, courseIds } = body;

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
        userTypes: true,
        courses: true
      }
    });

    // If userTypeIds are specified, create assignments for all users of these types
    if (userTypeIds && userTypeIds.length > 0) {
      // Create UserTypeProgramAssignment for each user type
      await prisma.userTypeProgramAssignment.createMany({
        data: userTypeIds.map((userTypeId: string) => ({
          userTypeId,
          programId: program.id
        }))
      });

      // Get all users with these userTypes
      const users = await prisma.user.findMany({
        where: { 
          userTypeId: { 
            in: userTypeIds 
          }
        }
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

    // If courseIds are specified (from cloning), add them to the program
    if (courseIds && courseIds.length > 0) {
      await prisma.programCourse.createMany({
        data: courseIds.map((courseId: string, index: number) => ({
          programId: program.id,
          courseId,
          order: index
        }))
      });
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