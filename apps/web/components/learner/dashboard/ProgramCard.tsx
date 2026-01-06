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
  }
}

export default function ProgramCard({ program }: ProgramCardProps) {
  // Determine accent color based on progress
  const getAccentColor = () => {
    if (program.progress === 100) return 'var(--success)'
    if (program.progress > 0) return 'var(--warning)'
    return 'var(--primary-light)'
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

  return (
    <Link href={`/learn/programs/${program.id}`}>
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
        <div className="p-6 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <h3 
              className="text-xl font-semibold line-clamp-2 flex-1 pr-2 group-hover:text-[var(--primary)] transition-colors"
              style={{ color: 'var(--text-primary)' }}
            >
              {program.title}
            </h3>
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
                    ? 'Start Program' 
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