// apps/web/components/learner/courses/LessonCard.tsx
'use client'

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

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return {
          bg: 'var(--success-light)',
          text: 'var(--success-dark)',
          border: 'var(--success)',
          icon: '●',
        }
      case 'intermediate':
        return {
          bg: 'var(--warning-light)',
          text: 'var(--warning-dark)',
          border: 'var(--warning)',
          icon: '●●',
        }
      case 'advanced':
        return {
          bg: 'var(--danger-light)',
          text: 'var(--danger-dark)',
          border: 'var(--danger)',
          icon: '●●●',
        }
      default:
        return {
          bg: 'var(--surface)',
          text: 'var(--text-secondary)',
          border: 'var(--border)',
          icon: '●',
        }
    }
  }

  const getAccentColor = () => {
    if (lesson.isLocked) return 'var(--border-medium)'
    if (lesson.attempt?.passed) return 'var(--success)'
    if (lesson.attempt) return 'var(--warning)'
    return 'var(--primary-light)'
  }

  const difficultyConfig = getDifficultyConfig(lesson.difficulty)

  const content = (
    <div
      className="group rounded-xl shadow-sm transition-all"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${getAccentColor()}`,
        opacity: lesson.isLocked ? 0.65 : 1,
        cursor: isClickable ? 'pointer' : 'not-allowed',
      }}
    >
      <div className="p-5 flex items-center space-x-4">
        {/* Order number / Status icon */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all"
          style={{
            background: lesson.isLocked
              ? 'var(--surface)'
              : lesson.attempt?.passed
              ? 'var(--success-light)'
              : lesson.attempt
              ? 'var(--warning-light)'
              : 'var(--primary-surface)',
            color: lesson.isLocked
              ? 'var(--text-muted)'
              : lesson.attempt?.passed
              ? 'var(--success)'
              : lesson.attempt
              ? 'var(--warning)'
              : 'var(--primary)',
            border: lesson.isLocked
              ? '2px solid var(--border)'
              : lesson.attempt?.passed
              ? '2px solid var(--success)'
              : lesson.attempt
              ? '2px solid var(--warning)'
              : '2px solid var(--primary-light)',
          }}
        >
          {lesson.attempt?.passed ? (
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : lesson.isLocked ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Lesson info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 
              className="text-lg font-semibold truncate transition-colors"
              style={{ 
                color: isClickable ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {lesson.title}
            </h3>
            
            {/* Quiz indicator */}
            {lesson.hasQuiz && !lesson.isLocked && (
              <div 
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--primary-surface)',
                  color: 'var(--primary)',
                }}
                title="Includes quiz"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Description */}
          {lesson.description && (
            <p 
              className="text-sm line-clamp-1 mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              {lesson.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center flex-wrap gap-3 text-xs">
            {/* Difficulty */}
            <span 
              className="inline-flex items-center px-2 py-1 rounded-full font-semibold"
              style={{
                background: difficultyConfig.bg,
                color: difficultyConfig.text,
                border: `1px solid ${difficultyConfig.border}`,
              }}
            >
              <span className="mr-1">{difficultyConfig.icon}</span>
              {lesson.difficulty}
            </span>

            {/* Attempt info */}
            {lesson.attempt && !lesson.isLocked && (
              <>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span 
                  className="font-semibold"
                  style={{ 
                    color: lesson.attempt.passed ? 'var(--success)' : 'var(--warning)',
                  }}
                >
                  Score: {lesson.attempt.scorePercentage}%
                </span>
                
                {lesson.attempt.timeSpent && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {Math.floor(lesson.attempt.timeSpent / 60)}m {lesson.attempt.timeSpent % 60}s
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Status badges and action */}
        <div className="flex flex-col items-end space-y-2 flex-shrink-0">
          {/* Status badge */}
          {lesson.isLocked ? (
            <span 
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'var(--surface)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Locked
            </span>
          ) : lesson.attempt?.passed ? (
            <span 
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'var(--success-light)',
                color: 'var(--success-dark)',
                border: '1px solid var(--success)',
              }}
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Completed
            </span>
          ) : lesson.attempt ? (
            <span 
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'var(--warning-light)',
                color: 'var(--warning-dark)',
                border: '1px solid var(--warning)',
              }}
            >
              In Progress
            </span>
          ) : (
            <span 
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: 'var(--primary-surface)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-light)',
              }}
            >
              Not Started
            </span>
          )}

          {/* Action text */}
          {!lesson.isLocked && (
            <div 
              className="text-xs font-semibold flex items-center space-x-1 transition-transform group-hover:translate-x-1"
              style={{ color: 'var(--primary)' }}
            >
              <span>
                {lesson.attempt?.passed ? 'Review' : lesson.attempt ? 'Continue' : 'Start'}
              </span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Lock message */}
      {lesson.isLocked && (
        <div 
          className="px-5 pb-4 pt-2 text-center"
          style={{ 
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <p 
            className="text-sm flex items-center justify-center space-x-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Complete the previous lesson to unlock</span>
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