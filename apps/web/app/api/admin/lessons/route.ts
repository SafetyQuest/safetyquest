import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET all lessons
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

    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;

    // Build where clause
    const where: any = {
      AND: [
        search
          ? {
              OR: [
                { title: { contains: search } },
                { description: { contains: search } },
              ],
            }
          : {},
        difficulty ? { difficulty } : {},
      ],
    };

    if (tag) {
      where.AND.push({
        tags: {
          some: {
            tag: {
              slug: tag,
            },
          },
        },
      });
    }

    // Get total count for pagination
    const total = await prisma.lesson.count({ where });

    // Fetch paginated lessons
    const lessons = await prisma.lesson.findMany({
      where,
      include: {
        tags: { include: { tag: true } },
        courses: { include: { course: { select: { id: true, title: true, slug: true } } } },
        steps: { orderBy: { order: 'asc' } },
        quiz: true,
      },
      orderBy: { title: 'asc' },
      ...(limit ? { skip, take: limit } : {}) 
    });

    if (!limit) {
      return NextResponse.json(lessons);
    }

    return NextResponse.json({
      lessons,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

// POST new lesson
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
      courseIds,
      steps 
    } = body;

    // Generate slug if not provided
    const slug = providedSlug || title.toLowerCase().replace(/\s+/g, '-');

    // Check if slug exists
    const existing = await prisma.lesson.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A lesson with this slug already exists' },
        { status: 400 }
      );
    }

    // Create lesson
    const lesson = await prisma.lesson.create({
      data: {
        title,
        slug,
        description,
        difficulty: difficulty || 'Beginner',
        quizId
      }
    });

    // Add tags if provided
    if (tagIds && tagIds.length > 0) {
      await prisma.lessonTag.createMany({
        data: tagIds.map((tagId: string) => ({
          lessonId: lesson.id,
          tagId
        }))
      });
    }

    // Add to courses if provided
    if (courseIds && courseIds.length > 0) {
      // Get the highest order in each course
      const courseOrders = await Promise.all(
        courseIds.map(async (courseId: string) => {
          const highestOrder = await prisma.courseLesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' },
            select: { order: true }
          });
          
          return {
            courseId,
            nextOrder: highestOrder ? highestOrder.order + 1 : 0
          };
        })
      );

      // Create course lesson entries
      await prisma.courseLesson.createMany({
        data: courseOrders.map((co) => ({
          courseId: co.courseId,
          lessonId: lesson.id,
          order: co.nextOrder
        }))
      });
    }

    // Add steps if provided
    if (steps && steps.length > 0) {
      await prisma.lessonStep.createMany({
        data: steps.map((step: any, index: number) => ({
          lessonId: lesson.id,
          order: index,
          type: step.type,
          contentType: step.contentType,
          contentData: step.contentData,
          gameType: step.gameType,
          gameConfig: step.gameConfig,
        }))
      });
    }

    // Return created lesson with tags, courses, and steps
    const result = await prisma.lesson.findUnique({
      where: { id: lesson.id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        courses: {
          include: {
            course: true
          }
        },
        steps: {
          orderBy: { order: 'asc' }
        },
        quiz: true
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}