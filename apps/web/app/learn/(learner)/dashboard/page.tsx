// FINAL VERSION: apps/web/app/learn/(learner)/dashboard/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { getDashboardData, getUserPrograms, getCurrentLesson } from '@/lib/learner/queries'
import CompactStatsBar from '@/components/learner/dashboard/CompactStatsBar'
import ContinueLearningCard from '@/components/learner/dashboard/ContinueLearningCard'
import ProgramsKanban from '@/components/learner/dashboard/ProgramsKanban'
import ActivitySidebar from '@/components/learner/dashboard/ActivitySidebar'
import StreakCard from '@/components/learner/dashboard/StreakCard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  // Fetch all data
  const data = await getDashboardData(session.user.id)
  const programs = await getUserPrograms(session.user.id)
  const currentLesson = await getCurrentLesson(session.user.id) // ✅ REAL DATA

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Welcome back, {session.user.name}! 👋
        </h1>
        <p className="mt-2" style={{ color: 'var(--text-secondary)' }}>
          Track your progress and continue your safety training journey
        </p>
      </div>

      {/* Compact Stats Bar */}
      <CompactStatsBar summary={data.summary} />

      {/* Continue Learning Hero (only show if there's a lesson in progress) */}
      {currentLesson && (
        <ContinueLearningCard lesson={currentLesson} />
      )}

      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Programs (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              My Programs
            </h2>
            <ProgramsKanban programs={programs} />
          </div>
        </div>

        {/* Right Column: Sidebar (1/3 width on desktop) */}
        <div className="space-y-6">
          {/* Streak Card */}
          <StreakCard 
            currentStreak={data.summary.currentStreak}
            longestStreak={data.summary.longestStreak} // ✅ REAL DATA
            dailyActivity={data.dailyActivity} // ✅ REAL DATA
          />

          {/* Activity Feed */}
          <ActivitySidebar activities={data.recentActivity} maxItems={5} />
        </div>
      </div>
    </div>
  )
}