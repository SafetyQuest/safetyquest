// apps/web/components/learner/courses/LessonCard.tsx

import Link from 'next/link'
import { LessonInCourse } from '@/lib/learner/queries'

interface LessonCardProps {
  lesson: LessonInCourse
  programId: string
  courseId: string
  index: number
}

export default function LessonCard({ 
  lesson, 
  programId, 
  courseId, 
  index 
}: LessonCardProps) {
  const isClickable = !lesson.isLocked

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'text-green-600'
      case 'intermediate':
        return 'text-yellow-600'
      case 'advanced':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const content = (
    <div
      className={`bg-white rounded-lg border-2 p-5 transition-all ${
        lesson.isLocked
          ? 'border-gray-200 opacity-60'
          : lesson.attempt?.passed
          ? 'border-green-200 hover:border-green-300 hover:shadow-md cursor-pointer'
          : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* Order number */}
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-lg text-lg font-bold flex-shrink-0 ${
            lesson.isLocked
              ? 'bg-gray-100 text-gray-400'
              : lesson.attempt?.passed
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-50 text-blue-700'
          }`}
        >
          {lesson.attempt?.passed ? '✓' : index + 1}
        </div>

        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {lesson.title}
            </h3>
            {lesson.hasQuiz && (
              <span className="text-xs text-blue-600">🎯</span>
            )}
          </div>
          {lesson.description && (
            <p className="text-sm text-gray-600 line-clamp-1 mb-2">
              {lesson.description}
            </p>
          )}
          <div className="flex items-center space-x-3 text-xs text-gray-500">
            <span className={getDifficultyColor(lesson.difficulty)}>
              {lesson.difficulty}
            </span>
            {lesson.attempt && (
              <>
                <span>•</span>
                <span className="font-medium text-gray-700">
                  Score: {lesson.attempt.scorePercentage}%
                </span>
                {lesson.attempt.timeSpent && (
                  <>
                    <span>•</span>
                    <span>
                      {Math.floor(lesson.attempt.timeSpent / 60)}m {lesson.attempt.timeSpent % 60}s
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
          {lesson.isLocked ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              🔒 Locked
            </span>
          ) : lesson.attempt?.passed ? (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              ✓ Completed
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {lesson.attempt ? 'In Progress' : 'Start'}
            </span>
          )}

          {!lesson.isLocked && (
            <div className="text-xs font-medium text-blue-600">
              {lesson.attempt?.passed ? 'Review' : lesson.attempt ? 'Continue' : 'Start'} →
            </div>
          )}
        </div>
      </div>

      {/* Lock message */}
      {lesson.isLocked && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500 text-center">
            Complete the previous lesson to unlock
          </p>
        </div>
      )}
    </div>
  )

  if (isClickable) {
    return (
      <Link
        href={`/learn/programs/${programId}/courses/${courseId}/lessons/${lesson.id}`}
      >
        {content}
      </Link>
    )
  }

  return content
}