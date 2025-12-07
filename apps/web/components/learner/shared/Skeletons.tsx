// apps/web/components/learner/shared/Skeletons.tsx

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg" />
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-2 bg-gray-200 rounded" />
        <div className="h-2 bg-gray-200 rounded w-5/6" />
      </div>
    </div>
  )
}

// Program Card Skeleton
export function ProgramCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
        <div className="w-16 h-16 bg-gray-200 rounded-full ml-4" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-2 bg-gray-200 rounded" />
        <div className="flex justify-between text-xs">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-3 bg-gray-200 rounded w-16" />
        </div>
      </div>
      <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
        <div className="h-3 bg-gray-200 rounded w-24" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    </div>
  )
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between mb-2">
        <div className="h-4 bg-gray-200 rounded w-24" />
        <div className="w-8 h-8 bg-gray-200 rounded" />
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-1" />
      <div className="h-3 bg-gray-200 rounded w-32" />
    </div>
  )
}

// List Item Skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-3 p-4 bg-white rounded-lg border border-gray-200 animate-pulse">
      <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
      <div className="w-20 h-6 bg-gray-200 rounded-full" />
    </div>
  )
}

// Table Row Skeleton
export function TableRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-32" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-24" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded w-20" />
      </td>
      <td className="px-6 py-4">
        <div className="h-6 bg-gray-200 rounded-full w-16" />
      </td>
    </tr>
  )
}

// Page Loading Skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="h-8 bg-gray-200 rounded w-64 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  )
}

// Dashboard Loading Skeleton
export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Programs Section */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProgramCardSkeleton />
          <ProgramCardSkeleton />
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-3">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </div>
    </div>
  )
}

// Lesson Player Loading Skeleton
export function LessonPlayerLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Progress Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="h-2 bg-gray-200 rounded w-full mb-4" />
        <div className="flex justify-center space-x-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-3 h-3 bg-gray-200 rounded-full" />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
        <div className="mt-8 flex justify-between">
          <div className="h-12 bg-gray-200 rounded w-32" />
          <div className="h-12 bg-gray-200 rounded w-32" />
        </div>
      </div>
    </div>
  )
}

// Full Page Spinner
export function FullPageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

// Inline Spinner
export function InlineSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  }

  return (
    <div
      className={`${sizes[size]} border-blue-200 border-t-blue-600 rounded-full animate-spin`}
    />
  )
}