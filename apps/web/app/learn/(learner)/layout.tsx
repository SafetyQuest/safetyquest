// apps/web/app/learn/(learner)/layout.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import LearnerNav from '@/components/learner/layout/LearnerNav'

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/learn/login')
  }

  // Redirect to admin if not a learner
  if (session.user.role !== 'LEARNER') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LearnerNav user={session.user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}