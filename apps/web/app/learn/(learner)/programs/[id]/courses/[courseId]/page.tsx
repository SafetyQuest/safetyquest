// UPDATED: apps/web/app/learn/(learner)/programs/[id]/courses/[courseId]/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../api/auth/[...nextauth]/route'
import { getCourseDetail } from '@/lib/learner/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CompactCourseHeader from '@/components/learner/courses/CompactCourseHeader'
import CourseSidebar from '@/components/learner/courses/CourseSidebar'
import LessonTimeline from '@/components/learner/courses/LessonTimeline'

export default async function CourseDetailPage({
  params
}: {
  params: Promise<{ id: string; courseId: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/learn/login')
  }

  const { id, courseId } = await params

  // Fetch course details
  let course
  try {
    course = await getCourseDetail(session.user.id, id, courseId)
  } catch (error: any) {
    return (
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-xl p-8 text-center"
          style={{
            background: 'var(--danger-light)',
            border: '2px solid var(--danger)',
          }}
        >
          <span className="text-6xl mb-4 block">⚠️</span>
          <h2 
            className="text-2xl font-bold mb-3"
            style={{ color: 'var(--danger-dark)' }}
          >
            Access Denied
          </h2>
          <p 
            className="mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {error.message}
          </p>
          <Link
            href={`/learn/programs/${id}`}
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'var(--danger)',
              color: 'var(--background)',
            }}
          >
            Back to Program
          </Link>
        </div>
      </div>
    )
  }

  // Find next lesson (first not-passed or first in-progress)
  const nextLesson = 
    course.lessons.find(l => !l.isLocked && l.attempt && !l.attempt.passed) ||
    course.lessons.find(l => !l.isLocked && !l.attempt)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Compact Sticky Header */}
      <CompactCourseHeader course={course} programId={id} />

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Timeline (2/3 width) */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 
              className="text-2xl font-bold flex items-center space-x-3"
              style={{ color: 'var(--text-primary)' }}
            >
              <svg className="w-7 h-7" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Lessons</span>
            </h2>
            <p 
              className="text-sm mt-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Complete lessons in order to progress through the course
            </p>
          </div>

          <LessonTimeline 
            lessons={course.lessons} 
            programId={id} 
            courseId={courseId} 
          />
        </div>

        {/* Sidebar: Stats & Next Lesson (1/3 width) */}
        <div className="lg:col-span-1">
          <CourseSidebar 
            course={course}
            programId={id}
            courseId={courseId}
            nextLesson={nextLesson || null}
          />
        </div>
      </div>
    </div>
  )
}