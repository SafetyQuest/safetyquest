// apps/web/app/learn/(learner)/dashboard/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { getDashboardData, getUserPrograms } from '@/lib/learner/queries'
import Link from 'next/link'
import ProgressOverview from '@/components/learner/dashboard/ProgressOverview'
import ProgramCard from '@/components/learner/dashboard/ProgramCard'
import RecentActivity from '@/components/learner/dashboard/RecentActivity'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  // Use reusable query functions
  const data = await getDashboardData(session.user.id)
  const programs = await getUserPrograms(session.user.id)
  
  // Take only first 6 programs for dashboard
  const featuredPrograms = programs.slice(0, 6)

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session.user.name}! 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Track your progress and continue your safety training journey
        </p>
      </div>

      {/* Progress Overview */}
      <ProgressOverview summary={data.summary} />

      {/* My Programs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">My Programs</h2>
          {programs.length > 6 && (
            <Link
              href="/learn/programs"
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          )}
        </div>
        
        {featuredPrograms.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No programs assigned yet</p>
            <p className="text-sm text-gray-400 mt-2">Contact your administrator to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPrograms.map((program) => (
              <ProgramCard key={program.id} program={program} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <RecentActivity activities={data.recentActivity} />
    </div>
  )
}