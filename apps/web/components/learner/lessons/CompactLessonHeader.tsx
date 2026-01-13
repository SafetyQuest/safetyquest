// apps/web/components/learner/lessons/CompactLessonHeader.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { LessonDetail } from '@/lib/learner/queries'

interface CompactLessonHeaderProps {
  lesson: LessonDetail
  programId: string
  courseId: string
  currentStepIndex: number
  totalSteps: number
  completedSteps: Set<number>
  accumulatedXp: number
  isSaving?: boolean
}

export default function CompactLessonHeader({
  lesson,
  programId,
  courseId,
  currentStepIndex,
  totalSteps,
  completedSteps,
  accumulatedXp,
  isSaving = false,
}: CompactLessonHeaderProps) {
  const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100)

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return 'var(--success)'
      case 'intermediate':
        return 'var(--warning)'
      case 'advanced':
        return 'var(--danger)'
      default:
        return 'var(--primary)'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-15 z-20 rounded-xl shadow-md mb-6"
      style={{
        background: 'linear-gradient(135deg, var(--background) 0%, var(--surface) 100%)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="p-4">
        {/* Top Row: Back button, Title, Progress */}
        <div className="flex items-center justify-between mb-3">
          {/* Left: Back + Title */}
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {/* Back Button */}
            <Link href={`/learn/programs/${programId}/courses/${courseId}`}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
            </Link>

            {/* Title + Difficulty */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h1 
                  className="text-xl font-bold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {lesson.title}
                </h1>
                {/* Difficulty Badge */}
                <span
                  className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{
                    background: `${getDifficultyColor(lesson.difficulty)}20`,
                    color: getDifficultyColor(lesson.difficulty),
                    border: `1px solid ${getDifficultyColor(lesson.difficulty)}`,
                  }}
                >
                  {lesson.difficulty}
                </span>
              </div>

              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-xs">
                <Link 
                  href="/learn/dashboard" 
                  className="hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Dashboard
                </Link>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <Link 
                  href="/learn/programs" 
                  className="hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Programs
                </Link>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <Link 
                  href={`/learn/programs/${programId}`}
                  className="hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Program
                </Link>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <Link 
                  href={`/learn/programs/${programId}/courses/${courseId}`}
                  className="hover:underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Course
                </Link>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ color: 'var(--text-muted)' }}>
                  {lesson.title.substring(0, 15)}...
                </span>
              </nav>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Step Progress */}
            <div className="text-center hidden md:block">
              <div 
                className="text-lg font-bold"
                style={{ color: 'var(--primary)' }}
              >
                {currentStepIndex + 1}/{totalSteps}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Steps</div>
            </div>

            {/* Progress Percentage */}
            <div className="text-center hidden md:block">
              <div 
                className="text-lg font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {progress}%
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Complete</div>
            </div>

            {/* XP */}
            {accumulatedXp > 0 && (
              <>
                <div 
                  className="hidden md:block w-px h-8"
                  style={{ background: 'var(--border)' }}
                />
                <div className="text-center">
                  <div 
                    className="text-lg font-bold"
                    style={{ color: 'var(--success)' }}
                  >
                    +{accumulatedXp}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>XP</div>
                </div>
              </>
            )}

            {/* Saving Indicator */}
            {isSaving && (
              <>
                <div 
                  className="hidden md:block w-px h-8"
                  style={{ background: 'var(--border)' }}
                />
                <div className="text-center">
                  <div 
                    className="text-xs italic"
                    style={{ color: 'var(--primary)' }}
                  >
                    Saving...
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bottom Row: Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                progress === 100
                  ? 'linear-gradient(90deg, var(--success), var(--success-dark))'
                  : progress >= 50
                  ? 'linear-gradient(90deg, var(--primary-light), var(--primary))'
                  : 'linear-gradient(90deg, var(--warning), var(--warning-dark))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Mobile Stats */}
        <div className="flex md:hidden items-center justify-between mt-3 text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>
            Step {currentStepIndex + 1} of {totalSteps} • {progress}%
          </span>
          {accumulatedXp > 0 && (
            <span 
              className="font-bold"
              style={{ color: 'var(--success)' }}
            >
              +{accumulatedXp} XP
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}