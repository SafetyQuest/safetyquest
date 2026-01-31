// apps/web/app/learn/(learner)/layout.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import LearnerNav from '@/components/learner/layout/LearnerNav'
// import DashboardSwitcher from '@/components/shared/DashboardSwitcher';

export default async function LearnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  
  // ✅ Only redirect if not authenticated
  if (!session) {
    redirect('/learn/login')
  }
  
  // ✅ REMOVED role check - all authenticated users can access!
  // This allows admins to view their training
  
  return (
    <div className="min-h-screen bg-gray-50">
      <LearnerNav user={session.user} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      {/* <DashboardSwitcher /> NOT USING ANYMORE*/}
    </div>
  )
}