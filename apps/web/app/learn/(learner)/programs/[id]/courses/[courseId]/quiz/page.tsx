import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import { PrismaClient } from '@safetyquest/database'
import CourseQuizView from '@/components/learner/courses/CourseQuizView'
import { isVirtualProgram, extractCourseId } from '@safetyquest/shared/enrollment/virtualProgram'

const prisma = new PrismaClient()

export default async function CourseQuizPage({
  params
}: {
  params: Promise<{ id: string; courseId: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) redirect('/learn/login')

  let { id: programId, courseId } = await params

  // ✅ If virtual program, extract courseId from programId
  const isVirtual = isVirtualProgram(programId)
  if (isVirtual) {
    courseId = extractCourseId(programId)
  }

  try {
    // ✅ Check correct assignment
    if (isVirtual) {
      const assignment = await prisma.courseAssignment.findFirst({
        where: { userId: session.user.id, courseId, isActive: true }
      })
      if (!assignment) redirect(`/learn/programs/${programId}/courses/${courseId}`)
    } else {
      const assignment = await prisma.programAssignment.findFirst({
        where: { userId: session.user.id, programId, isActive: true }
      })
      if (!assignment) redirect(`/learn/programs/${programId}/courses/${courseId}`)
    }

    // Get course with quiz
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                difficulty: true,
                gameType: true,
                gameConfig: true,
                points: true
              }
            }
          }
        }
      }
    })

    if (!course || !course.quiz) {
      redirect(`/learn/programs/${programId}/courses/${courseId}`)
    }

    // Check if all lessons complete
    const courseLessons = await prisma.courseLesson.findMany({
      where: { courseId },
      select: { lessonId: true }
    })
    const lessonIds = courseLessons.map(cl => cl.lessonId)

    const completedLessons = await prisma.lessonAttempt.count({
      where: {
        userId: session.user.id,
        lessonId: { in: lessonIds },
        passed: true
      }
    })

    if (completedLessons < lessonIds.length) {
      redirect(`/learn/programs/${programId}/courses/${courseId}`)
    }

    // Get previous attempt
    const previousAttempt = await prisma.courseAttempt.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId } }
    })

    return (
      <CourseQuizView
        programId={programId}
        courseId={courseId}
        quiz={course.quiz}
        previousAttempt={previousAttempt}
      />
    )
  } catch (error) {
    console.error('Error loading course quiz:', error)
    redirect(`/learn/programs/${programId}/courses/${courseId}`)
  }
}
