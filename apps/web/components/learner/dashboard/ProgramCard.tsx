// apps/web/components/learner/dashboard/ProgramCard.tsx

import Link from 'next/link'

interface ProgramCardProps {
  program: {
    id: string
    title: string
    description: string | null
    totalLessons: number
    completedLessons: number
    progress: number
  }
}

export default function ProgramCard({ program }: ProgramCardProps) {
  return (
    <Link href={`/learn/programs/${program.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
        <div className="flex flex-col h-full">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {program.title}
          </h3>

          {/* Description */}
          {program.description && (
            <p className="text-sm text-gray-600 mb-4 line-clamp-2 flex-grow">
              {program.description}
            </p>
          )}

          {/* Stats */}
          <div className="space-y-3 mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Progress</span>
              <span className="font-semibold text-gray-900">{program.progress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${program.progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {program.completedLessons} of {program.totalLessons} lessons
              </span>
              {program.progress === 100 && (
                <span className="text-green-600 font-medium">✓ Complete</span>
              )}
            </div>
          </div>

          {/* Action */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-blue-600 hover:text-blue-700">
              {program.progress === 0 ? 'Start Program' : program.progress === 100 ? 'Review' : 'Continue'} →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}