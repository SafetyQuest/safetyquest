// apps/web/components/learner/courses/LessonTimeline.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { LessonInCourse } from '@/lib/learner/queries'

interface LessonTimelineProps {
  lessons: LessonInCourse[]
  programId: string
  courseId: string
}

export default function LessonTimeline({ lessons, programId, courseId }: LessonTimelineProps) {
  if (lessons.length === 0) {
    return (
      <div 
        className="rounded-xl p-12 text-center"
        style={{
          background: 'var(--background)',
          border: '2px dashed var(--border)',
        }}
      >
        <span className="text-6xl mb-4 block">📝</span>
        <p style={{ color: 'var(--text-muted)' }}>No lessons in this course yet</p>
      </div>
    )
  }

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return { bg: 'var(--success-light)', text: 'var(--success-dark)', dots: '●' }
      case 'intermediate':
        return { bg: 'var(--warning-light)', text: 'var(--warning-dark)', dots: '●●' }
      case 'advanced':
        return { bg: 'var(--danger-light)', text: 'var(--danger-dark)', dots: '●●●' }
      default:
        return { bg: 'var(--surface)', text: 'var(--text-secondary)', dots: '●' }
    }
  }

  return (
    <div className="relative">
      {/* Connecting Line */}
      <div 
        className="absolute left-6 top-10 bottom-10 w-0.5 hidden md:block"
        style={{
          background: 'linear-gradient(180deg, var(--border) 0%, var(--surface) 100%)',
        }}
      />

      {/* Lesson Nodes */}
      <div className="space-y-3">
        {lessons.map((lesson, index) => {
          const isLocked = lesson.isLocked
          const isComplete = lesson.attempt?.passed
          const isInProgress = lesson.attempt && !lesson.attempt.passed
          const isClickable = !isLocked
          
          const difficulty = getDifficultyConfig(lesson.difficulty)

          const nodeColor = isLocked
            ? 'var(--text-muted)'
            : isComplete
            ? 'var(--success)'
            : isInProgress
            ? 'var(--warning)'
            : 'var(--primary-light)'

          const content = (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
            >
              <div className="flex items-center space-x-4">
                {/* Timeline Node */}
                <motion.div
                  whileHover={isClickable ? { scale: 1.15 } : {}}
                  className="relative z-10 w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: isLocked
                      ? 'var(--surface)'
                      : isComplete
                      ? 'var(--success-light)'
                      : isInProgress
                      ? 'var(--warning-light)'
                      : 'var(--primary-surface)',
                    border: `2px solid ${nodeColor}`,
                    boxShadow: isClickable ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {isLocked ? (
                    <svg className="w-5 h-5" style={{ color: nodeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ) : isComplete ? (
                    <svg className="w-6 h-6" style={{ color: nodeColor }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span 
                      className="text-lg font-black"
                      style={{ color: nodeColor }}
                    >
                      {index + 1}
                    </span>
                  )}
                </motion.div>

                {/* Lesson Card - Horizontal Layout */}
                <motion.div
                  whileHover={isClickable ? { y: -2 } : {}}
                  className="flex-1 group"
                >
                  <div
                    className="rounded-xl shadow-sm transition-all p-4"
                    style={{
                      background: 'var(--background)',
                      border: `1px solid ${isClickable ? nodeColor : 'var(--border)'}`,
                      borderLeft: `4px solid ${nodeColor}`,
                      opacity: isLocked ? 0.7 : 1,
                      cursor: isClickable ? 'pointer' : 'default',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      {/* Left: Lesson Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 
                            className="text-base font-bold truncate"
                            style={{ 
                              color: isClickable ? 'var(--text-primary)' : 'var(--text-muted)',
                            }}
                          >
                            {lesson.title}
                          </h3>
                          
                          {lesson.hasQuiz && !isLocked && (
                            <span
                              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                              style={{
                                background: 'var(--primary-surface)',
                                color: 'var(--primary)',
                              }}
                            >
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center flex-wrap gap-2 text-xs">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: difficulty.bg,
                              color: difficulty.text,
                            }}
                          >
                            {difficulty.dots}
                          </span>

                          {lesson.attempt && !isLocked && (
                            <>
                              <span style={{ color: 'var(--text-muted)' }}>•</span>
                              <span 
                                className="font-semibold"
                                style={{ 
                                  color: lesson.attempt.passed ? 'var(--success)' : 'var(--warning)',
                                }}
                              >
                                {lesson.attempt.scorePercentage}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Right: Status + Action */}
                      <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                        {/* Status Badge */}
                        {isLocked ? (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--surface)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            🔒
                          </span>
                        ) : isComplete ? (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--success-light)',
                              color: 'var(--success-dark)',
                            }}
                          >
                            ✓
                          </span>
                        ) : isInProgress ? (
                          <span 
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                            style={{
                              background: 'var(--warning-light)',
                              color: 'var(--warning-dark)',
                            }}
                          >
                            🔥
                          </span>
                        ) : null}

                        {/* Action */}
                        {!isLocked && (
                          <div 
                            className="flex items-center space-x-1 text-xs font-semibold transition-transform group-hover:translate-x-1"
                            style={{ color: 'var(--primary)' }}
                          >
                            <span>
                              {isComplete ? 'Review' : isInProgress ? 'Continue' : 'Start'}
                            </span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {isLocked && (
                      <div 
                        className="mt-2 pt-2 text-center"
                        style={{ borderTop: '1px solid var(--border)' }}
                      >
                        <p 
                          className="text-xs flex items-center justify-center space-x-1"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Complete previous lesson</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )

          if (isClickable) {
            return (
              <Link 
                key={lesson.id} 
                href={`/learn/programs/${programId}/courses/${courseId}/lessons/${lesson.id}`}
              >
                {content}
              </Link>
            )
          }

          return <div key={lesson.id}>{content}</div>
        })}
      </div>
    </div>
  )
}