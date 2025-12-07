// apps/web/app/learn/(learner)/programs/[id]/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../api/auth/[...nextauth]/route'
import { getProgramDetail } from '@/lib/learner/queries'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/learner/programs/CourseCard'
import ProgressBar from '@/components/learner/shared/ProgressBar'

export default async function ProgramDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/learn/login')
  }

  // Await params before using
  const { id } = await params

  // Fetch program details using reusable query
  let program
  try {
    program = await getProgramDetail(session.user.id, id)
  } catch (error: any) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <span className="text-4xl mb-4 block">⚠️</span>
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700 mb-4">{error.message}</p>
          <Link
            href="/learn/programs"
            className="inline-block px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Programs
          </Link>
        </div>
      </div>
    )
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
        <span className="text-gray-900 font-medium">{program.title}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {program.title}
            </h1>
            {program.description && (
              <p className="text-gray-600 text-lg leading-relaxed">
                {program.description}
              </p>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Overall Progress
            </span>
            <span className="text-2xl font-bold text-gray-900">
              {program.overallProgress}%
            </span>
          </div>
          <ProgressBar progress={program.overallProgress} />
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              {program.courses.filter(c => c.progress === 100).length} of {program.courses.length} courses completed
            </span>
            <span>
              Assigned {new Date(program.assignedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {program.courses.length}
            </div>
            <div className="text-sm text-gray-600">Total Courses</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {program.courses.reduce((sum, c) => sum + c.totalLessons, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {program.courses.reduce((sum, c) => sum + c.completedLessons, 0)}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Courses Section */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Courses</h2>
          <span className="text-sm text-gray-500">
            Complete courses in order to unlock the next
          </span>
        </div>

        {program.courses.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <span className="text-6xl mb-4 block">📚</span>
            <p className="text-gray-500">No courses in this program yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {program.courses.map((course, index) => (
              <CourseCard
                key={course.id}
                course={course}
                programId={id}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completion Message */}
      {program.overallProgress === 100 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <span className="text-6xl mb-4 block">🎉</span>
          <h3 className="text-2xl font-bold text-green-900 mb-2">
            Congratulations!
          </h3>
          <p className="text-green-700">
            You've completed all courses in this program. Keep up the great work!
          </p>
        </div>
      )}
    </div>
  )
}