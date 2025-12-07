// apps/web/app/learn/(learner)/programs/[id]/courses/[courseId]/lessons/[lessonId]/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../../api/auth/[...nextauth]/route'
import { getLessonDetail } from '@/lib/learner/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LessonPlayer from '@/components/learner/lessons/LessonPlayer'

export default async function LessonPage({
  params
}: {
  params: Promise<{ id: string; courseId: string; lessonId: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/learn/login')
  }

  const { id, courseId, lessonId } = await params

  // Fetch lesson details
  let lesson
  try {
    lesson = await getLessonDetail(session.user.id, id, courseId, lessonId)
  } catch (error: any) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <Link
            href={`/learn/programs/${id}/courses/${courseId}`}
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Course
          </Link>
        </div>
      </div>
    )
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <Link href="/learn/dashboard" className="hover:text-blue-600">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/learn/programs" className="hover:text-blue-600">
          Programs
        </Link>
        <span>/</span>
        <Link href={`/learn/programs/${id}`} className="hover:text-blue-600">
          Program
        </Link>
        <span>/</span>
        <Link href={`/learn/programs/${id}/courses/${courseId}`} className="hover:text-blue-600">
          Course
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{lesson.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {lesson.title}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(lesson.difficulty)}`}>
                {lesson.difficulty}
              </span>
            </div>
            {lesson.description && (
              <p className="text-gray-600">{lesson.description}</p>
            )}
          </div>

          {/* Previous Attempt Badge */}
          {lesson.previousAttempt && (
            <div className={`ml-4 px-4 py-2 rounded-lg border ${
              lesson.previousAttempt.passed
                ? 'bg-green-50 border-green-200'
                : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="text-xs text-gray-600 mb-1">Previous Score</div>
              <div className={`text-2xl font-bold ${
                lesson.previousAttempt.passed ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {lesson.previousAttempt.scorePercentage}%
              </div>
            </div>
          )}
        </div>

        {/* Lesson Info */}
        <div className="flex items-center space-x-6 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
          <span>📝 {lesson.steps.length} steps</span>
          {lesson.hasQuiz && (
            <span>🎯 Quiz: {lesson.quiz?.questions.length} questions</span>
          )}
          {lesson.previousAttempt && (
            <span className="text-gray-500">
              Last completed: {new Date(lesson.previousAttempt.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Lesson Player */}
      <LessonPlayer
        lesson={lesson}
        userId={session.user.id}
        programId={id}
        courseId={courseId}
      />
    </div>
  )
}