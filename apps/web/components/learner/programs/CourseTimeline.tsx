// apps/web/components/learner/programs/CourseTimeline.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseInProgram } from '@/lib/learner/queries'
import ProgressBar from '../shared/ProgressBar'

interface CourseTimelineProps {
  courses: CourseInProgram[]
  programId: string
}

export default function CourseTimeline({ courses, programId }: CourseTimelineProps) {
  if (courses.length === 0) {
    return (
      <div 
        className="rounded-xl p-12 text-center"
        style={{
          background: 'var(--background)',
          border: '2px dashed var(--border)',
        }}
      >
        <span className="text-6xl mb-4 block">📚</span>
        <p style={{ color: 'var(--text-muted)' }}>No courses in this program yet</p>
      </div>
    )
  }

  const getDifficultyConfig = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return { bg: 'var(--success-light)', text: 'var(--success-dark)', border: 'var(--success)' }
      case 'intermediate':
        return { bg: 'var(--warning-light)', text: 'var(--warning-dark)', border: 'var(--warning)' }
      case 'advanced':
        return { bg: 'var(--danger-light)', text: 'var(--danger-dark)', border: 'var(--danger)' }
      default:
        return { bg: 'var(--surface)', text: 'var(--text-secondary)', border: 'var(--border)' }
    }
  }

  return (
    <div className="relative">
      {/* Connecting Line */}
      <div 
        className="absolute left-8 top-12 bottom-12 w-1 hidden md:block"
        style={{
          background: 'linear-gradient(180deg, var(--border) 0%, var(--surface) 100%)',
        }}
      />

      {/* Course Nodes */}
      <div className="space-y-6">
        {courses.map((course, index) => {
          const isLocked = course.isLocked
          const isComplete = course.progress === 100
          const isInProgress = course.progress > 0 && course.progress < 100
          const isClickable = !isLocked
          
          const difficulty = getDifficultyConfig(course.difficulty)

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
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-start space-x-6">
                {/* Timeline Node */}
                <div className="flex flex-col items-center flex-shrink-0">
                  {/* Node Circle */}
                  <motion.div
                    whileHover={isClickable ? { scale: 1.1, rotate: 5 } : {}}
                    className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: isLocked
                        ? 'var(--surface)'
                        : isComplete
                        ? 'var(--success-light)'
                        : isInProgress
                        ? 'var(--warning-light)'
                        : 'var(--primary-surface)',
                      border: `3px solid ${nodeColor}`,
                      boxShadow: isClickable ? 'var(--shadow-md)' : 'none',
                    }}
                  >
                    {isLocked ? (
                      <svg className="w-7 h-7" style={{ color: nodeColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    ) : isComplete ? (
                      <svg className="w-8 h-8" style={{ color: nodeColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : isInProgress ? (
                      <svg className="w-7 h-7" style={{ color: nodeColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span 
                        className="text-2xl font-black"
                        style={{ color: nodeColor }}
                      >
                        {index + 1}
                      </span>
                    )}
                  </motion.div>

                  {/* Status Label */}
                  <span 
                    className="mt-2 text-xs font-semibold"
                    style={{ color: nodeColor }}
                  >
                    {isLocked ? '🔒' : isComplete ? '✓' : isInProgress ? '🔥' : ''}
                  </span>
                </div>

                {/* Course Card */}
                <motion.div
                  whileHover={isClickable ? { y: -4 } : {}}
                  className="flex-1 group"
                >
                  <div
                    className="rounded-xl shadow-sm transition-all p-6"
                    style={{
                      background: 'var(--background)',
                      border: `2px solid ${isClickable ? nodeColor : 'var(--border)'}`,
                      opacity: isLocked ? 0.7 : 1,
                      cursor: isClickable ? 'pointer' : 'default',
                      borderLeft: `6px solid ${nodeColor}`,
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2 flex-wrap">
                          <h3 
                            className="text-xl font-bold transition-colors"
                            style={{ 
                              color: isClickable ? 'var(--text-primary)' : 'var(--text-muted)' ,
                            }}
                          >
                            {course.title}
                          </h3>
                          
                          {/* Difficulty Badge */}
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold"
                            style={{
                              background: difficulty.bg,
                              color: difficulty.text,
                              border: `1px solid ${difficulty.border}`,
                            }}
                          >
                            {course.difficulty}
                          </span>
                        </div>

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

                    {/* Progress Section */}
                    {!isLocked && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-4 text-sm flex-wrap gap-2">
                            <div className="flex items-center space-x-2" style={{ color: 'var(--text-secondary)' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>{course.completedLessons}/{course.totalLessons} lessons</span>
                            </div>
                            
                            {course.hasQuiz && (
                              <div className="flex items-center space-x-1" style={{ color: 'var(--primary)' }}>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs font-medium">Quiz</span>
                              </div>
                            )}
                          </div>

                          <span 
                            className="text-xl font-bold"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {course.progress}%
                          </span>
                        </div>

                        <ProgressBar 
                          progress={course.progress}
                          variant={isComplete ? 'success' : isInProgress ? 'warning' : 'default'}
                        />
                      </div>
                    )}

                    {/* Footer */}
                    <div 
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: `1px solid var(--border)` }}
                    >
                      {isLocked ? (
                        <p 
                          className="text-sm flex items-center space-x-2"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Complete previous course first</span>
                        </p>
                      ) : (
                        <>
                          <span 
                            className="text-xs"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Course {course.order + 1}
                          </span>

                          <div 
                            className="flex items-center space-x-2 font-semibold transition-transform group-hover:translate-x-2"
                            style={{ color: 'var(--primary)' }}
                          >
                            <span>
                              {isComplete ? 'Review' : isInProgress ? 'Continue' : 'Start'}
                            </span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )

          if (isClickable) {
            return (
              <Link key={course.id} href={`/learn/programs/${programId}/courses/${course.id}`}>
                {content}
              </Link>
            )
          }

          return <div key={course.id}>{content}</div>
        })}
      </div>
    </div>
  )
}