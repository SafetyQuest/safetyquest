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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Simple Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
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
        <span className="text-gray-900">{lesson.title}</span>
      </nav>

      {/* Lesson Player (contains its own header now) */}
      <LessonPlayer
        lesson={lesson}
        userId={session.user.id}
        programId={id}
        courseId={courseId}
      />
    </div>
  )
}