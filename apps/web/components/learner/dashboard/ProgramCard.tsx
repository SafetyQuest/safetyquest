// apps/web/components/learner/dashboard/ProgramCard.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface ProgramCardProps {
  program: {
    id: string
    title: string
    description: string | null
    totalLessons: number
    completedLessons: number
    progress: number
    source: 'course' | 'program'
    courseId?: string
  }
}

export default function ProgramCard({ program }: ProgramCardProps) {
  // Determine accent color based on progress
  const getAccentColor = () => {
    if (program.progress === 100) return 'var(--success)'
    if (program.progress > 0) return 'var(--warning)'
    return 'var(--primary-light)'
  }

  // Get type badge styling
  const getTypeBadge = () => {
    if (program.source === 'course') {
      return {
        label: 'Course',
        icon: (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
        background: 'var(--primary-surface)',
        color: 'var(--primary)',
        borderColor: 'var(--primary-light)',
      }
    }
    
    return {
      label: 'Program',
      icon: (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#ffffff',
      borderColor: '#667eea',
    }
  }

  // Determine status badge
  const getStatusBadge = () => {
    if (program.progress === 100) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
          style={{
            background: 'var(--success-light)',
            color: 'var(--success-dark)',
            border: '1px solid var(--success)',
          }}
        >
          ✓ Complete
        </span>
      )
    }
    
    if (program.progress > 0) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
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
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
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

  // Get progress bar gradient
  const getProgressGradient = () => {
    if (program.progress === 100) {
      return 'linear-gradient(90deg, var(--success), var(--success-dark))'
    }
    if (program.progress >= 50) {
      return 'linear-gradient(90deg, var(--primary-light), var(--primary))'
    }
    return 'linear-gradient(90deg, var(--warning), var(--warning-dark))'
  }

  const href =
  program.source === 'course' && program.courseId
    ? `/learn/programs/${program.id}/courses/${program.courseId}`
    : `/learn/programs/${program.id}`

  const typeBadge = getTypeBadge()

  return (
    <Link href={href}>
      <motion.div
        className="group relative rounded-xl shadow-sm transition-all duration-300 cursor-pointer h-full"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderLeft: `4px solid ${getAccentColor()}`,
        }}
        whileHover={{ 
          y: -4,
          boxShadow: 'var(--shadow-lg)',
        }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Type Badge - Top Right Corner */}
        <div className="absolute top-4 right-4 z-10">
          <span 
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm"
            style={{
              background: typeBadge.background,
              color: typeBadge.color,
              border: `1px solid ${typeBadge.borderColor}`,
            }}
          >
            {typeBadge.icon}
            <span>{typeBadge.label}</span>
          </span>
        </div>

        <div className="p-6 pt-9 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4 pr-20">
            <h3 
              className="text-xl font-semibold line-clamp-2 flex-1 group-hover:text-[var(--primary)] transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {program.title}
            </h3>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            {getStatusBadge()}
          </div>

          {/* Description */}
          {program.description && (
            <p 
              className="text-sm mb-4 line-clamp-2 flex-grow"
              style={{ color: 'var(--text-secondary)' }}
            >
              {program.description}
            </p>
          )}

          {/* Stats */}
          <div className="space-y-4 mt-auto">
            {/* Progress Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span 
                  className="text-sm font-medium"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Progress
                </span>
                <span 
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {program.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div 
                className="w-full h-3 rounded-full overflow-hidden relative"
                style={{ background: 'var(--surface)' }}
              >
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: getProgressGradient() }}
                  initial={{ width: 0 }}
                  animate={{ width: `${program.progress}%` }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                >
                  {/* Shimmer Effect */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      animation: 'shimmer 2s infinite',
                    }}
                  />
                </motion.div>
              </div>

              {/* Lessons Count */}
              <div 
                className="flex items-center justify-between mt-2 text-sm"
                style={{ color: 'var(--text-secondary)' }}
              >
                <span>
                  {program.completedLessons} of {program.totalLessons} lessons
                </span>
                {program.progress === 100 && (
                  <span 
                    className="font-semibold flex items-center space-x-1"
                    style={{ color: 'var(--success)' }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Done</span>
                  </span>
                )}
              </div>
            </div>

            {/* Action */}
            <div 
              className="pt-4 border-t"
              style={{ borderColor: 'var(--border)' }}
            >
              <span 
                className="text-sm font-semibold flex items-center space-x-2 group-hover:translate-x-1 transition-transform"
                style={{ color: 'var(--primary)' }}
              >
                <span>
                  {program.progress === 0 
                    ? program.source === 'course'
                      ? 'Start Course'
                      : 'Start Program'
                    : program.progress === 100 
                    ? 'Review' 
                    : 'Continue'}
                </span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </div>

          {/* Hover Gradient Overlay */}
          <div 
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${getAccentColor()}, transparent)`,
            }}
          />
        </div>
      </motion.div>
    </Link>
  )
}