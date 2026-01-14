// UPDATED: apps/web/app/learn/(learner)/dashboard/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { getDashboardData, getUserPrograms, getCurrentLesson } from '@/lib/learner/queries'
import CompactStatsBar from '@/components/learner/dashboard/CompactStatsBar'
import ContinueLearningCard from '@/components/learner/dashboard/ContinueLearningCard'
import StartLearningCard from '@/components/learner/dashboard/StartLearningCard'
import WelcomeCard from '@/components/learner/dashboard/WelcomeCard'
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
  const currentLesson = await getCurrentLesson(session.user.id)

  // Smart Hero Card Logic
  const getHeroCard = () => {
    // State 1: Has lesson in progress → Continue Learning
    if (currentLesson) {
      return <ContinueLearningCard lesson={currentLesson} />
    }

    // State 2: Has programs but no active lesson → Start Learning
    if (programs.length > 0) {
      // Find best program to suggest:
      // Priority: First not-started program OR first in-progress program OR first program
      const suggestedProgram = 
        programs.find(p => p.progress === 0) ||           // Not started
        programs.find(p => p.progress > 0 && p.progress < 100) || // In progress
        programs[0]                                        // Any program

      return <StartLearningCard program={suggestedProgram} />
    }

    // State 3: No programs assigned → Welcome
    return <WelcomeCard />
  }

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

      {/* Smart Hero Card - Always shows! */}
      {getHeroCard()}

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
            longestStreak={data.summary.longestStreak}
            dailyActivity={data.dailyActivity}
          />

          {/* Activity Feed */}
          <ActivitySidebar activities={data.recentActivity} maxItems={5} />
        </div>
      </div>
    </div>
  )
}