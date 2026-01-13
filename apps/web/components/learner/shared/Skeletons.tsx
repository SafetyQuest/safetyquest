// apps/web/components/learner/shared/Skeletons.tsx

export function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <div 
          className="h-8 w-64 rounded-lg mb-2 animate-pulse"
          style={{ background: 'var(--surface)' }}
        />
        <div 
          className="h-4 w-96 rounded-lg animate-pulse"
          style={{ background: 'var(--surface)' }}
        />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl shadow-sm p-6 animate-pulse"
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
            }}
          >
            <div 
              className="w-12 h-12 rounded-lg mb-4"
              style={{ background: 'var(--surface)' }}
            />
            <div 
              className="h-8 w-16 rounded mb-2"
              style={{ background: 'var(--surface)' }}
            />
            <div 
              className="h-4 w-20 rounded"
              style={{ background: 'var(--surface)' }}
            />
          </div>
        ))}
      </div>

      {/* Programs section */}
      <div>
        <div 
          className="h-7 w-48 rounded-lg mb-4 animate-pulse"
          style={{ background: 'var(--surface)' }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <ProgramCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div 
          className="h-7 w-40 rounded-lg mb-4 animate-pulse"
          style={{ background: 'var(--surface)' }}
        />
        <RecentActivitySkeleton />
      </div>
    </div>
  )
}

export function ProgramCardSkeleton() {
  return (
    <div
      className="rounded-xl shadow-sm p-6 animate-pulse"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--border-medium)',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div 
          className="h-6 w-3/4 rounded"
          style={{ background: 'var(--surface)' }}
        />
        <div 
          className="h-6 w-20 rounded-full"
          style={{ background: 'var(--surface)' }}
        />
      </div>

      {/* Description */}
      <div className="space-y-2 mb-4">
        <div 
          className="h-4 w-full rounded"
          style={{ background: 'var(--surface)' }}
        />
        <div 
          className="h-4 w-4/5 rounded"
          style={{ background: 'var(--surface)' }}
        />
      </div>

      {/* Progress section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div 
            className="h-4 w-16 rounded"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-6 w-12 rounded"
            style={{ background: 'var(--surface)' }}
          />
        </div>
        
        {/* Progress bar */}
        <div 
          className="h-3 w-full rounded-full"
          style={{ background: 'var(--surface)' }}
        >
          <div 
            className="h-3 rounded-full shimmer"
            style={{ 
              width: '60%',
              background: 'linear-gradient(90deg, var(--primary-surface), var(--surface), var(--primary-surface))',
              backgroundSize: '200% 100%',
            }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div 
            className="h-3 w-24 rounded"
            style={{ background: 'var(--surface)' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div 
        className="pt-4 mt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div 
          className="h-4 w-28 rounded"
          style={{ background: 'var(--surface)' }}
        />
      </div>
    </div>
  )
}

export function CourseCardSkeleton() {
  return (
    <div
      className="rounded-xl shadow-sm p-6 animate-pulse"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--border-medium)',
      }}
    >
      <div className="flex items-start space-x-3 mb-4">
        {/* Number circle */}
        <div 
          className="w-10 h-10 rounded-full"
          style={{ background: 'var(--surface)' }}
        />
        
        {/* Content */}
        <div className="flex-1">
          <div 
            className="h-6 w-3/4 rounded mb-2"
            style={{ background: 'var(--surface)' }}
          />
          <div className="space-y-2 mb-3">
            <div 
              className="h-4 w-full rounded"
              style={{ background: 'var(--surface)' }}
            />
            <div 
              className="h-4 w-5/6 rounded"
              style={{ background: 'var(--surface)' }}
            />
          </div>
        </div>

        {/* Badges */}
        <div className="space-y-2">
          <div 
            className="h-6 w-20 rounded-full"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-6 w-24 rounded-full"
            style={{ background: 'var(--surface)' }}
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div 
            className="h-4 w-16 rounded"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-4 w-10 rounded"
            style={{ background: 'var(--surface)' }}
          />
        </div>
        <div 
          className="h-3 w-full rounded-full"
          style={{ background: 'var(--surface)' }}
        />
      </div>

      {/* Footer */}
      <div 
        className="flex items-center justify-between pt-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <div 
          className="h-4 w-32 rounded"
          style={{ background: 'var(--surface)' }}
        />
        <div 
          className="h-4 w-20 rounded"
          style={{ background: 'var(--surface)' }}
        />
      </div>
    </div>
  )
}

export function LessonCardSkeleton() {
  return (
    <div
      className="rounded-xl shadow-sm p-5 animate-pulse"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderLeft: '4px solid var(--border-medium)',
      }}
    >
      <div className="flex items-center space-x-4">
        {/* Number circle */}
        <div 
          className="w-12 h-12 rounded-xl"
          style={{ background: 'var(--surface)' }}
        />

        {/* Content */}
        <div className="flex-1">
          <div 
            className="h-5 w-48 rounded mb-2"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-4 w-64 rounded mb-2"
            style={{ background: 'var(--surface)' }}
          />
          <div className="flex items-center space-x-3">
            <div 
              className="h-5 w-20 rounded-full"
              style={{ background: 'var(--surface)' }}
            />
            <div 
              className="h-3 w-16 rounded"
              style={{ background: 'var(--surface)' }}
            />
          </div>
        </div>

        {/* Status badge */}
        <div className="space-y-2">
          <div 
            className="h-7 w-24 rounded-full"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-4 w-16 rounded ml-auto"
            style={{ background: 'var(--surface)' }}
          />
        </div>
      </div>
    </div>
  )
}

export function RecentActivitySkeleton() {
  return (
    <div
      className="rounded-xl shadow-sm overflow-hidden"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
      }}
    >
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="p-4 animate-pulse"
          style={{
            borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
          }}
        >
          <div className="flex items-start space-x-4">
            {/* Icon */}
            <div 
              className="w-10 h-10 rounded-lg"
              style={{ background: 'var(--surface)' }}
            />

            {/* Content */}
            <div className="flex-1">
              <div 
                className="h-4 w-48 rounded mb-2"
                style={{ background: 'var(--surface)' }}
              />
              <div className="flex items-center space-x-2">
                <div 
                  className="h-3 w-32 rounded"
                  style={{ background: 'var(--surface)' }}
                />
                <div 
                  className="h-3 w-16 rounded"
                  style={{ background: 'var(--surface)' }}
                />
              </div>
            </div>

            {/* Timestamp */}
            <div 
              className="h-3 w-12 rounded"
              style={{ background: 'var(--surface)' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProgressOverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="rounded-xl shadow-sm p-6 animate-pulse"
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
          }}
        >
          <div 
            className="w-12 h-12 rounded-lg mb-4"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-8 w-16 rounded mb-1"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-4 w-20 rounded"
            style={{ background: 'var(--surface)' }}
          />
        </div>
      ))}
    </div>
  )
}

export function LessonPlayerSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Progress bar */}
      <div 
        className="h-2 w-full rounded-full"
        style={{ background: 'var(--surface)' }}
      >
        <div 
          className="h-2 rounded-full"
          style={{ 
            width: '40%',
            background: 'var(--primary-surface)',
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center space-x-2">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i}
            className="w-8 h-8 rounded-full"
            style={{ background: 'var(--surface)' }}
          />
        ))}
      </div>

      {/* Content area */}
      <div
        className="rounded-xl shadow-sm p-8"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        <div 
          className="h-8 w-64 rounded mb-4"
          style={{ background: 'var(--surface)' }}
        />
        <div className="space-y-3 mb-6">
          <div 
            className="h-4 w-full rounded"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-4 w-5/6 rounded"
            style={{ background: 'var(--surface)' }}
          />
          <div 
            className="h-4 w-4/5 rounded"
            style={{ background: 'var(--surface)' }}
          />
        </div>

        {/* Game area placeholder */}
        <div 
          className="h-64 rounded-lg mb-6"
          style={{ background: 'var(--surface)' }}
        />

        {/* Button */}
        <div 
          className="h-12 w-32 rounded-lg ml-auto"
          style={{ background: 'var(--surface)' }}
        />
      </div>
    </div>
  )
}