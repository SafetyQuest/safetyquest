// apps/web/app/learn/(learner)/programs/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../api/auth/[...nextauth]/route'
import { getUserPrograms } from '@/lib/learner/queries'
import ProgramCard from '@/components/learner/dashboard/ProgramCard'

export default async function ProgramsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    return null
  }

  // Use reusable query function
  const programs = await getUserPrograms(session.user.id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
        <p className="mt-2 text-gray-600">
          All your assigned training programs in one place
        </p>
      </div>

      {/* Filter/Sort Options (Future Enhancement) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {programs.length} {programs.length === 1 ? 'program' : 'programs'} assigned
          </span>
        </div>
      </div>

      {/* Programs Grid */}
      {programs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <span className="text-6xl mb-4 block">📚</span>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Assigned</h3>
          <p className="text-gray-500">Contact your administrator to get started with safety training</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </div>
      )}
    </div>
  )
}