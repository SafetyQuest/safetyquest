// apps/web/components/learner/programs/CompactProgramHeader.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProgramDetail } from '@/lib/learner/queries'

interface CompactProgramHeaderProps {
  program: ProgramDetail
}

export default function CompactProgramHeader({ program }: CompactProgramHeaderProps) {
  // Calculate circular progress for display
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (program.overallProgress / 100) * circumference

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
            <Link href="/learn/programs">
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

            {/* Title */}
            <div className="flex-1 min-w-0">
              <h1 
                className="text-xl font-bold truncate"
                style={{ color: 'var(--text-primary)' }}
              >
                {program.title}
              </h1>
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-xs mt-1">
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
                <span style={{ color: 'var(--text-muted)' }}>
                  {program.title.substring(0, 20)}...
                </span>
              </nav>
            </div>
          </div>

          {/* Right: Circular Progress + Stats */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {/* Circular Progress */}
            <div className="relative w-16 h-16">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
                {/* Background circle */}
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke="var(--surface)"
                  strokeWidth="6"
                  fill="none"
                />
                {/* Progress circle */}
                <motion.circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={
                    program.overallProgress === 100
                      ? 'var(--success)'
                      : program.overallProgress >= 50
                      ? 'var(--primary)'
                      : 'var(--warning)'
                  }
                  strokeWidth="6"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                  style={{
                    strokeDasharray: circumference,
                  }}
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span 
                  className="text-sm font-black"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {program.overallProgress}%
                </span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-3 text-sm">
              <div className="text-center">
                <div 
                  className="text-lg font-bold"
                  style={{ color: 'var(--primary)' }}
                >
                  {program.courses.length}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Courses</div>
              </div>
              <div 
                className="w-px h-8"
                style={{ background: 'var(--border)' }}
              />
              <div className="text-center">
                <div 
                  className="text-lg font-bold"
                  style={{ color: 'var(--success)' }}
                >
                  {program.courses.filter(c => c.progress === 100).length}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Done</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row: Progress Bar */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              background:
                program.overallProgress === 100
                  ? 'linear-gradient(90deg, var(--success), var(--success-dark))'
                  : program.overallProgress >= 50
                  ? 'linear-gradient(90deg, var(--primary-light), var(--primary))'
                  : 'linear-gradient(90deg, var(--warning), var(--warning-dark))',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${program.overallProgress}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>

        {/* Mobile Stats */}
        <div className="flex md:hidden items-center justify-between mt-3 text-xs">
          <span style={{ color: 'var(--text-secondary)' }}>
            {program.courses.filter(c => c.progress === 100).length} of {program.courses.length} courses complete
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {new Date(program.assignedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </motion.div>
  )
}