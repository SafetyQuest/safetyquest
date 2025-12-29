// packages/shared/enrollment/index.ts
import { PrismaClient } from '@safetyquest/database';

const prisma = new PrismaClient();

/**
 * Verifies that a user is enrolled in a specific program
 * @throws Error if not enrolled
 * @returns The enrollment record (ProgramAssignment)
 */
export async function verifyProgramAccess(userId: string, programId: string) {
  const assignment = await prisma.programAssignment.findFirst({
    where: {
      userId,
      programId,
      isActive: true
    }
  });
  
  if (!assignment) {
    throw new Error('Not enrolled in this program');
  }
  
  return assignment;
}

/**
 * Verifies that a user has access to a specific lesson
 * Checks: enrollment, course/lesson relationship, and unlocking status
 * @throws Error if access is denied
 */
export async function verifyLessonAccess(
  userId: string,
  lessonId: string,
  courseId: string,
  programId: string
) {
  // 1. Verify enrollment
  await verifyProgramAccess(userId, programId);
  
  // 2. Verify lesson belongs to course
  const courseLesson = await prisma.courseLesson.findFirst({
    where: {
      courseId,
      lessonId
    }
  });
  
  if (!courseLesson) {
    throw new Error('Lesson not found in course');
  }
  
  // 3. Verify course belongs to program
  const programCourse = await prisma.programCourse.findFirst({
    where: {
      programId,
      courseId
    }
  });
  
  if (!programCourse) {
    throw new Error('Course not found in program');
  }
  
  // 4. Check if lesson is unlocked
  const isUnlocked = await checkLessonUnlocked(userId, courseId, lessonId);
  
  if (!isUnlocked) {
    throw new Error('Lesson is locked');
  }
  
  return true;
}

/**
 * Checks if a lesson is unlocked for a user
 * First lesson in a course is always unlocked
 * Subsequent lessons require previous lesson completion
 */
async function checkLessonUnlocked(
  userId: string,
  courseId: string,
  lessonId: string
): Promise<boolean> {
  // Get lesson order
  const currentLesson = await prisma.courseLesson.findFirst({
    where: { courseId, lessonId },
    select: { order: true }
  });
  
  if (!currentLesson) return false;
  
  // First lesson is always unlocked
  if (currentLesson.order === 0) return true;
  
  // Check if previous lesson is completed
  const previousLesson = await prisma.courseLesson.findFirst({
    where: {
      courseId,
      order: currentLesson.order - 1
    },
    select: { lessonId: true }
  });
  
  if (!previousLesson) return false;
  
  const previousAttempt = await prisma.lessonAttempt.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId: previousLesson.lessonId
      }
    },
    select: { passed: true }
  });
  
  return previousAttempt?.passed ?? false;
}

/**
 * Checks if a course is unlocked for a user
 * First course in a program is always unlocked
 * Subsequent courses require all lessons in previous course to be completed
 */
export async function checkCourseUnlocked(
  userId: string,
  programId: string,
  courseId: string
): Promise<boolean> {
  // Get course order
  const currentCourse = await prisma.programCourse.findFirst({
    where: { programId, courseId },
    select: { order: true }
  });
  
  if (!currentCourse) return false;
  
  // First course is always unlocked
  if (currentCourse.order === 0) return true;
  
  // Get previous course
  const previousCourse = await prisma.programCourse.findFirst({
    where: {
      programId,
      order: currentCourse.order - 1
    },
    include: {
      course: {
        include: {
          lessons: {
            select: { lessonId: true }
          }
        }
      }
    }
  });
  
  if (!previousCourse) return false;
  
  // Check if all lessons in previous course are completed
  const lessonIds = previousCourse.course.lessons.map(cl => cl.lessonId);
  
  if (lessonIds.length === 0) return true;
  
  const completedCount = await prisma.lessonAttempt.count({
    where: {
      userId,
      lessonId: { in: lessonIds },
      passed: true
    }
  });
  
  return completedCount === lessonIds.length;
}

/**
 * Calculate overall progress percentage for a program
 */
export async function calculateProgramProgress(
  userId: string,
  programId: string
): Promise<number> {
  // Get all courses in program
  const programCourses = await prisma.programCourse.findMany({
    where: { programId },
    include: {
      course: {
        include: {
          lessons: {
            select: { lessonId: true }
          }
        }
      }
    }
  });
  
  // Collect all lesson IDs
  const allLessonIds = programCourses.flatMap(pc =>
    pc.course.lessons.map(cl => cl.lessonId)
  );
  
  if (allLessonIds.length === 0) return 0;
  
  // Count completed lessons
  const completedCount = await prisma.lessonAttempt.count({
    where: {
      userId,
      lessonId: { in: allLessonIds },
      passed: true
    }
  });
  
  return Math.round((completedCount / allLessonIds.length) * 100);
}

/**
 * Calculate overall progress percentage for a course
 */
export async function calculateCourseProgress(
  userId: string,
  courseId: string
): Promise<number> {
  // Get all lessons in course
  const courseLessons = await prisma.courseLesson.findMany({
    where: { courseId },
    select: { lessonId: true }
  });
  
  if (courseLessons.length === 0) return 0;
  
  const lessonIds = courseLessons.map(cl => cl.lessonId);
  
  // Count completed lessons
  const completedCount = await prisma.lessonAttempt.count({
    where: {
      userId,
      lessonId: { in: lessonIds },
      passed: true
    }
  });
  
  return Math.round((completedCount / lessonIds.length) * 100);
}