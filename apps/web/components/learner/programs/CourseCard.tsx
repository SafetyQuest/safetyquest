// apps/web/components/learner/programs/CourseCard.tsx
'use client'

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

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return {
          bg: 'var(--success-light)',
          text: 'var(--success-dark)',
          border: 'var(--success)',
        }
      case 'intermediate':
        return {
          bg: 'var(--warning-light)',
          text: 'var(--warning-dark)',
          border: 'var(--warning)',
        }
      case 'advanced':
        return {
          bg: 'var(--danger-light)',
          text: 'var(--danger-dark)',
          border: 'var(--danger)',
        }
      default:
        return {
          bg: 'var(--surface)',
          text: 'var(--text-secondary)',
          border: 'var(--border)',
        }
    }
  }

  const getAccentColor = () => {
    if (course.isLocked) return 'var(--text-muted)'
    if (course.progress === 100) return 'var(--success)'
    if (course.progress > 0) return 'var(--warning)'
    return 'var(--primary-light)'
  }

  const getStatusBadge = () => {
    if (course.isLocked) {
      return (
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--surface)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Locked
        </span>
      )
    }

    if (course.progress === 100) {
      return (
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--success-light)',
            color: 'var(--success-dark)',
            border: '1px solid var(--success)',
          }}
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Complete
        </span>
      )
    }

    if (course.progress > 0) {
      return (
        <span 
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--warning-light)',
            color: 'var(--warning-dark)',
            border: '1px solid var(--warning)',
          }}
        >
          In Progress
        </span>
      )
    }

    return (
      <span 
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
        style={{
          background: 'var(--primary-surface)',
          color: 'var(--primary)',
          border: '1px solid var(--primary-light)',
        }}
      >
        Not Started
      </span>
    )
  }

  const difficultyConfig = getDifficultyConfig(course.difficulty)

  const content = (
    <div
      className="group rounded-xl shadow-sm transition-all p-6"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${getAccentColor()}`,
        opacity: course.isLocked ? 0.6 : 1,
        cursor: isClickable ? 'pointer' : 'default',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Left side - Course info */}
        <div className="flex-1 flex items-start space-x-3">
          {/* Order number */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-transform group-hover:scale-110"
            style={{
              background: course.isLocked
                ? 'var(--surface)'
                : course.progress === 100
                ? 'var(--success-light)'
                : 'var(--primary-surface)',
              color: course.isLocked
                ? 'var(--text-muted)'
                : course.progress === 100
                ? 'var(--success)'
                : 'var(--primary)',
              border: course.isLocked
                ? '2px solid var(--border)'
                : course.progress === 100
                ? '2px solid var(--success)'
                : '2px solid var(--primary-light)',
            }}
          >
            {index + 1}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0">
            <h3 
              className="text-xl font-semibold mb-2 transition-colors"
              style={{ 
                color: isClickable ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {course.title}
            </h3>
            {course.description && (
              <p 
                className="text-sm line-clamp-2 mb-3"
                style={{ color: 'var(--text-secondary)' }}
              >
                {course.description}
              </p>
            )}
          </div>
        </div>

        {/* Right side - Badges */}
        <div className="flex flex-col items-end space-y-2 ml-4 flex-shrink-0">
          {/* Difficulty badge */}
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: difficultyConfig.bg,
              color: difficultyConfig.text,
              border: `1px solid ${difficultyConfig.border}`,
            }}
          >
            {course.difficulty}
          </span>

          {/* Status badge */}
          {getStatusBadge()}
        </div>
      </div>

      {/* Progress bar */}
      {!course.isLocked && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span 
              className="text-sm font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              Progress
            </span>
            <span 
              className="text-sm font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {course.progress}%
            </span>
          </div>
          <ProgressBar 
            progress={course.progress} 
            variant={
              course.progress === 100 ? 'success' :
              course.progress >= 50 ? 'default' :
              'warning'
            }
          />
        </div>
      )}

      {/* Footer info */}
      <div 
        className="flex items-center justify-between pt-4"
        style={{ borderTop: `1px solid var(--border)` }}
      >
        <div className="flex items-center space-x-4 text-sm">
          {/* Lessons count */}
          <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{course.completedLessons}/{course.totalLessons} lessons</span>
          </div>

          {/* Quiz indicator */}
          {course.hasQuiz && (
            <div 
              className="inline-flex items-center space-x-1"
              style={{ color: 'var(--primary)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="text-xs font-medium">Final Quiz</span>
            </div>
          )}
        </div>

        {!course.isLocked && (
          <div 
            className="text-sm font-semibold flex items-center space-x-1 transition-transform group-hover:translate-x-1"
            style={{ color: 'var(--primary)' }}
          >
            <span>
              {course.progress === 0
                ? 'Start Course'
                : course.progress === 100
                ? 'Review'
                : 'Continue'}
            </span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}

        {course.isLocked && (
          <div 
            className="text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
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