// apps/web/app/api/admin/lessons/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient, analyzeLessonDeletion, deleteLessonSafely } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

// GET lesson by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
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

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
    }

    return NextResponse.json(lesson);
  } catch (error) {
    console.error('Error fetching lesson:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    );
  }
}

// PATCH update lesson
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
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
      courseIds,
      steps 
    } = body;

    // Check if slug exists and is different from current
    if (slug) {
      const existing = await prisma.lesson.findFirst({
        where: { 
          slug,
          id: { not: id }
        }
      });

      if (existing) {
        return NextResponse.json(
          { error: 'A lesson with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Update lesson
    const lesson = await prisma.lesson.update({
      where: { id },
      data: {
        title,
        slug,
        description,
        difficulty,
        quizId: quizId && quizId.trim() !== '' ? quizId : null
      }
    });

    // Update tags if provided
    if (tagIds) {
      // Delete existing tags
      await prisma.lessonTag.deleteMany({
        where: { lessonId: id }
      });

      // Add new tags
      if (tagIds.length > 0) {
        await prisma.lessonTag.createMany({
          data: tagIds.map((tagId: string) => ({
            lessonId: id,
            tagId
          }))
        });
      }
    }

    // Update courses if provided
    if (courseIds) {
      // Get current course associations
      const currentCourses = await prisma.courseLesson.findMany({
        where: { lessonId: id },
        select: { courseId: true }
      });
      const currentCourseIds = currentCourses.map(cl => cl.courseId);
      
      // Courses to remove
      const coursesToRemove = currentCourseIds.filter(cid => !courseIds.includes(cid));
      
      // Courses to add
      const coursesToAdd = courseIds.filter(cid => !currentCourseIds.includes(cid));

      // Remove courses
      if (coursesToRemove.length > 0) {
        await prisma.courseLesson.deleteMany({
          where: {
            lessonId: id,
            courseId: { in: coursesToRemove }
          }
        });

        // Reorder remaining lessons in each course
        for (const courseId of coursesToRemove) {
          const remainingLessons = await prisma.courseLesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }
          });

          // Update orders to be sequential
          for (let i = 0; i < remainingLessons.length; i++) {
            if (remainingLessons[i].order !== i) {
              await prisma.courseLesson.update({
                where: {
                  id: remainingLessons[i].id
                },
                data: { order: i }
              });
            }
          }
        }
      }

      // Add new courses
      if (coursesToAdd.length > 0) {
        for (const courseId of coursesToAdd) {
          // Get highest order in this course
          const highestOrder = await prisma.courseLesson.findFirst({
            where: { courseId },
            orderBy: { order: 'desc' },
            select: { order: true }
          });
          
          const nextOrder = highestOrder ? highestOrder.order + 1 : 0;
          
          await prisma.courseLesson.create({
            data: {
              courseId,
              lessonId: id,
              order: nextOrder
            }
          });
        }
      }
    }

    // Update steps if provided
    if (steps) {
      // Delete existing steps
      await prisma.lessonStep.deleteMany({
        where: { lessonId: id }
      });

      // Add new steps
      if (steps.length > 0) {
        await prisma.lessonStep.createMany({
          data: steps.map((step: any, index: number) => ({
            lessonId: id,
            order: index,
            type: step.type,
            contentType: step.contentType,
            contentData: step.contentData,
            gameType: step.gameType,
            gameConfig: step.gameConfig,
          }))
        });
      }
    }

    // Return updated lesson with tags, courses, and steps
    const result = await prisma.lesson.findUnique({
      where: { id },
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

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson' },
      { status: 500 }
    );
  }
}

// DELETE lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // First analyze if deletion is safe
    const analysis = await analyzeLessonDeletion(id);
    
    if (!analysis.canDelete) {
      return NextResponse.json({
        error: analysis.message,
        blockers: analysis.blockers
      }, { status: 400 });
    }
    
    // If safe, delete the lesson
    const result = await deleteLessonSafely(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}