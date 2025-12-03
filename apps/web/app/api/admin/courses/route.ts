import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET all courses
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const difficulty = searchParams.get('difficulty') || '';
    const tag = searchParams.get('tag') || '';
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    
    // Build where clause
    const where: any = {
      AND: [
        search ? { 
          OR: [
            { title: { contains: search } },
            { description: { contains: search } }
          ]
        } : {},
        difficulty ? { difficulty } : {}
      ]
    };

    // If tag filter is specified, include tag relationship
    if (tag) {
      where.AND.push({
        tags: {
          some: {
            tag: {
              slug: tag
            }
          }
        }
      });
    }

    // Get total count
    const total = await prisma.course.count({ where });

    // Query courses with their tags and programs
    const courses = await prisma.course.findMany({
      where,
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        programs: {
          include: {
            program: {
              select: {
                id: true,
                title: true,
                slug: true
              }
            }
          }
        },
        lessons: true,
        quiz: true
      },
      orderBy: { title: 'asc' },
      ...(limit ? { skip, take: limit } : {}) 
    });

    if (!limit) {
      return NextResponse.json(courses);
    }

    // If paginated
    return NextResponse.json({
      courses,
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
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// POST new course
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      title, 
      description, 
      slug: providedSlug, 
      difficulty, 
      quizId,
      tagIds,
      programIds 
    } = body;

    // Generate slug if not provided
    const slug = providedSlug || title.toLowerCase().replace(/\s+/g, '-');

    // Check if slug exists
    const existing = await prisma.course.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A course with this slug already exists' },
        { status: 400 }
      );
    }

    const courseData = {
        title,
        slug,
        description,
        difficulty: difficulty || 'Beginner'
        // Notice quizId is not included by default
    } as any;

    // Only add quizId if it's provided and not empty
    if (quizId && quizId.trim() !== '') {
        courseData.quizId = quizId;
    }

    console.log(courseData.quizId, '<< quizId');

    // Create course
    const course = await prisma.course.create({
        data: courseData
    });

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      await prisma.courseTag.createMany({
        data: tagIds.map((tagId: string) => ({
          courseId: course.id,
          tagId
        }))
      });
    }

    // Add to programs if provided
    if (programIds && programIds.length > 0) {
      // Get the highest order in each program
      const programOrders = await Promise.all(
        programIds.map(async (programId: string) => {
          const highestOrder = await prisma.programCourse.findFirst({
            where: { programId },
            orderBy: { order: 'desc' },
            select: { order: true }
          });
          
          return {
            programId,
            nextOrder: highestOrder ? highestOrder.order + 1 : 0
          };
        })
      );

      // Create program course entries
      await prisma.programCourse.createMany({
        data: programOrders.map((po) => ({
          programId: po.programId,
          courseId: course.id,
          order: po.nextOrder
        }))
      });
    }

    // Return created course with tags and programs
    const result = await prisma.course.findUnique({
      where: { id: course.id },
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
        }
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}