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
      {/* Responsive Breadcrumb */}
      {/* Mobile: Shortened version */}
      <nav className="flex md:hidden items-center space-x-2 text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
        <Link 
          href={`/learn/programs/${id}/courses/${courseId}`} 
          className="hover:underline flex items-center space-x-1"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to Course</span>
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span 
          className="truncate max-w-[180px]"
          style={{ color: 'var(--text-primary)' }}
          title={lesson.title}
        >
          {lesson.title}
        </span>
      </nav>

      {/* Desktop: Full breadcrumb */}
      <nav className="hidden md:flex items-center space-x-2 text-sm mb-4 flex-wrap">
        <Link 
          href="/learn/dashboard" 
          className="hover:underline whitespace-nowrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          Dashboard
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link 
          href="/learn/programs" 
          className="hover:underline whitespace-nowrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          Programs
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link 
          href={`/learn/programs/${id}`} 
          className="hover:underline whitespace-nowrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          Program
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <Link 
          href={`/learn/programs/${id}/courses/${courseId}`} 
          className="hover:underline whitespace-nowrap"
          style={{ color: 'var(--text-secondary)' }}
        >
          Course
        </Link>
        <span style={{ color: 'var(--text-muted)' }}>/</span>
        <span 
          className="truncate max-w-[200px]"
          style={{ color: 'var(--text-primary)' }}
          title={lesson.title}
        >
          {lesson.title}
        </span>
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