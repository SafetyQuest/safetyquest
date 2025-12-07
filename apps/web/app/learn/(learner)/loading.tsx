// apps/web/app/learn/(learner)/loading.tsx

import { DashboardLoadingSkeleton } from '@/components/learner/shared/Skeletons'

export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <DashboardLoadingSkeleton />
    </div>
  )
}