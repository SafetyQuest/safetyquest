import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function analyzeLessonDeletion(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      courses: {
        include: {
          course: {
            select: { id: true, title: true, slug: true }
          }
        }
      },
      steps: {
        select: { id: true }
      },
      attempts: {
        select: { id: true, userId: true }
      }
    }
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  const coursesUsingLesson = lesson.courses.map(cl => cl.course);
  const canDelete = coursesUsingLesson.length === 0;
  const uniqueUsersWithAttempts = new Set(lesson.attempts.map(a => a.userId)).size;

  return {
    lesson: {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug
    },
    canDelete,
    blockers: {
      coursesUsing: coursesUsingLesson.length,
      courses: coursesUsingLesson,
      stepsCount: lesson.steps.length,
      attemptsCount: lesson.attempts.length,
      usersWithProgress: uniqueUsersWithAttempts
    },
    message: canDelete
      ? '✅ This lesson can be safely deleted'
      : `ℹ️ This lesson is used in ${coursesUsingLesson.length} course${coursesUsingLesson.length > 1 ? 's' : ''} (${coursesUsingLesson.map(c => c.title).join(', ')}). Remove it from those courses first.`,
    warning: lesson.attempts.length > 0
      ? `⚠️ ${uniqueUsersWithAttempts} user${uniqueUsersWithAttempts > 1 ? 's have' : ' has'} completed this lesson. Their progress history will be preserved even after deletion.`
      : null
  };
}

export async function deleteLessonSafely(lessonId: string) {
  // Check if lesson can be deleted
  const analysis = await analyzeLessonDeletion(lessonId);

  if (!analysis.canDelete) {
    throw new Error(analysis.message);
  }

  // Delete lesson (this will cascade delete LessonSteps and preserve LessonAttempts)
  const deleted = await prisma.lesson.delete({
    where: { id: lessonId }
  });

  return {
    success: true,
    deletedLesson: deleted,
    message: `✅ Lesson "${deleted.title}" deleted successfully`,
    preservedAttempts: analysis.blockers.attemptsCount
  };
}

// Helper to remove lesson from a course
export async function removeLessonFromCourse(courseId: string, lessonId: string) {
  const deleted = await prisma.courseLesson.delete({
    where: {
      courseId_lessonId: {
        courseId,
        lessonId
      }
    }
  });

  // Reorder remaining lessons
  await prisma.$executeRaw`
    UPDATE CourseLesson 
    SET [order] = [order] - 1 
    WHERE courseId = ${courseId} AND [order] > ${deleted.order}
  `;

  return {
    success: true,
    message: '✅ Lesson removed from course'
  };
}