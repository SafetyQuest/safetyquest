// apps/web/app/learn/(learner)/programs/[id]/courses/[courseId]/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../api/auth/[...nextauth]/route'
import { getCourseDetail } from '@/lib/learner/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import LessonCard from '@/components/learner/courses/LessonCard'
import ProgressBar from '@/components/learner/shared/ProgressBar'

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ id: string; courseId: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/learn/login')
  }

  // Await params before using
  const { id, courseId } = await params

  // Fetch course details using reusable query
  let course
  try {
    course = await getCourseDetail(session.user.id, id, courseId)
  } catch (error: any) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <Link
            href={`/learn/programs/${id}`}
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Program
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
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600">
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
        <span className="text-gray-900 font-medium">{course.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {course.title}
              </h1>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(course.difficulty)}`}>
                {course.difficulty}
              </span>
            </div>
            {course.description && (
              <p className="text-gray-600 text-lg leading-relaxed">
                {course.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Course Progress
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {course.progress}%
            </span>
          </div>
          <ProgressBar progress={course.progress} />
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {course.lessons.filter(l => l.attempt?.passed).length} of {course.lessons.length} lessons completed
            </span>
            {course.hasQuiz && (
              <span className="inline-flex items-center text-blue-600">
                🎯 Final quiz available
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Lessons Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Lessons</h2>
          <span className="text-sm text-gray-500">
            Complete lessons in order to unlock the next
          </span>
        </div>

        {course.lessons.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <span className="text-6xl mb-4 block">📝</span>
            <p className="text-gray-500">No lessons in this course yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {course.lessons.map((lesson, index) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                programId={id}
                courseId={courseId}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Course Quiz */}
      {course.hasQuiz && course.progress === 100 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start space-x-4">
            <span className="text-4xl">🎯</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Final Course Assessment
              </h3>
              <p className="text-blue-700 mb-4">
                You've completed all lessons! Take the final assessment to complete this course.
              </p>
              <button className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium">
                Start Final Quiz →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completion Message */}
      {course.progress === 100 && !course.hasQuiz && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Course Complete!
          </h3>
          <p className="text-green-700 mb-4">
            You've completed all lessons in this course. Great job!
          </p>
          <Link
            href={`/learn/programs/${id}`}
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Back to Program
          </Link>
        </div>
      )}
    </div>
  )
}