// apps/web/app/api/admin/quizzes/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// GET all quizzes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || '';  // gap_assessment, lesson, course
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';
    const includeQuizId = searchParams.get('includeQuizId') || null;
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : undefined;
    const skip = limit ? (page - 1) * limit : undefined;
    
    const where: any = {
      AND: [
        search ? { 
          OR: [
            { title: { contains: search } },
            { description: { contains: search } }
          ]
        } : {},
        type ? { type } : {}
      ]
    };

    // Filter out assigned quizzes if requested
    if (unassignedOnly) {
      if (type === 'lesson') {
        where.AND.push({
          OR: [
            { lessonUsage: null },
            ...(includeQuizId ? [{ id: includeQuizId }] : [])
          ]
        });
      } else if (type === 'course') {
        where.AND.push({
          OR: [
            { courseUsage: null },
            ...(includeQuizId ? [{ id: includeQuizId }] : [])
          ]
        });
      }
    }
    
    // Get total count for pagination
    const total = await prisma.quiz.count({ where });
    
    // Get paginated quizzes
    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { title: 'asc' },
      ...(limit ? { skip, take: limit } : {})
    });

    if (!limit) {
      return NextResponse.json(quizzes);
    }

    // Paginated response
    return NextResponse.json({
      quizzes,
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
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}

// POST new quiz
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, slug: providedSlug, type, passingScore, questions } = body;

    // Generate slug if not provided
    const slug = providedSlug || title.toLowerCase().replace(/\s+/g, '-');

    // Check if quiz exists
    const existing = await prisma.quiz.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A quiz with this slug already exists' },
        { status: 400 }
      );
    }

    // Create quiz
    const quiz = await prisma.quiz.create({
      data: {
        title,
        slug,
        description,
        type: type || 'lesson',  // Default to lesson quiz
        passingScore: passingScore || 70  // Default to 70% passing score
      }
    });

    // Add questions if provided
    if (questions && questions.length > 0) {
      await prisma.quizQuestion.createMany({
        data: questions.map((q: any, index: number) => ({
          quizId: quiz.id,
          order: index,
          difficulty: q.difficulty || 3,
          gameType: q.gameType,
          gameConfig: q.gameConfig,
          points: q.points || 10
        }))
      });
    }

    // Return created quiz with questions
    const result = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}