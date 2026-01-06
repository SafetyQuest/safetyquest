// UPDATED: apps/web/app/learn/(learner)/programs/[id]/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../api/auth/[...nextauth]/route'
import { getProgramDetail } from '@/lib/learner/queries'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CompactProgramHeader from '@/components/learner/programs/CompactProgramHeader'
import ProgramSidebar from '@/components/learner/programs/ProgramSidebar'
import CourseTimeline from '@/components/learner/programs/CourseTimeline'

export default async function ProgramDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/learn/login')
  }

  const { id } = await params

  // Fetch program details
  let program
  try {
    program = await getProgramDetail(session.user.id, id)
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
            href="/learn/programs"
            className="inline-block px-6 py-3 rounded-lg font-semibold transition-all"
            style={{
              background: 'var(--danger)',
              color: 'var(--background)',
            }}
          >
            Back to Programs
          </Link>
        </div>
      </div>
    )
  }

  // Find current focus course (first in-progress or first not-started)
  const currentCourse = 
    program.courses.find(c => c.progress > 0 && c.progress < 100) ||
    program.courses.find(c => c.progress === 0)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Compact Sticky Header */}
      <CompactProgramHeader program={program} />

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Learning Journey</span>
            </h2>
            <p 
              className="text-sm mt-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Complete courses in order to progress through the program
            </p>
          </div>

          <CourseTimeline courses={program.courses} programId={id} />
        </div>

        {/* Sidebar: Stats & Context (1/3 width) */}
        <div className="lg:col-span-1">
          <ProgramSidebar 
            program={program} 
            currentCourse={currentCourse || null} 
          />
        </div>
      </div>
    </div>
  )
}