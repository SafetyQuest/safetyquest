// apps/web/components/learner/programs/CourseCard.tsx

import Link from 'next/link'
import { CourseInProgram } from '@/lib/learner/queries'
import ProgressBar from '@/components/learner/shared/ProgressBar'

interface CourseCardProps {
  course: CourseInProgram
  programId: string
  index: number
}

export default function CourseCard({ course, programId, index }: CourseCardProps) {
  const isClickable = !course.isLocked

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'bg-green-100 text-green-800'
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const content = (
    <div
      className={`bg-white rounded-lg border-2 p-6 transition-all ${
        course.isLocked
          ? 'border-gray-200 opacity-60'
          : course.progress === 100
          ? 'border-green-300 hover:border-green-400 hover:shadow-md cursor-pointer'
          : 'border-blue-200 hover:border-blue-400 hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Left side - Course info */}
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {/* Order number */}
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold ${
                course.isLocked
                  ? 'bg-gray-100 text-gray-400'
                  : course.progress === 100
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}
            >
              {index + 1}
            </div>

            {/* Title */}
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {course.title}
              </h3>
              {course.description && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {course.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right side - Status badges */}
        <div className="flex flex-col items-end space-y-2 ml-4">
          {/* Difficulty badge */}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(
              course.difficulty
            )}`}
          >
            {course.difficulty}
          </span>

          {/* Lock/Complete status */}
          {course.isLocked ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              🔒 Locked
            </span>
          ) : course.progress === 100 ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
              ✓ Complete
            </span>
          ) : course.progress > 0 ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              In Progress
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              Not Started
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!course.isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-semibold text-gray-900">
              {course.progress}%
            </span>
          </div>
          <ProgressBar progress={course.progress} />
        </div>
      )}

      {/* Footer info */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>
            📝 {course.completedLessons}/{course.totalLessons} lessons
          </span>
          {course.hasQuiz && (
            <span className="inline-flex items-center">
              🎯 Final Quiz
            </span>
          )}
        </div>

        {!course.isLocked && (
          <div className="text-sm font-medium text-blue-600">
            {course.progress === 0
              ? 'Start Course'
              : course.progress === 100
              ? 'Review'
              : 'Continue'}{' '}
            →
          </div>
        )}

        {course.isLocked && (
          <div className="text-sm text-gray-500">
            Complete previous course to unlock
          </div>
        )}
      </div>
    </div>
  )

  if (isClickable) {
    return (
      <Link href={`/learn/programs/${programId}/courses/${course.id}`}>
        {content}
      </Link>
    )
  }

  return content
}