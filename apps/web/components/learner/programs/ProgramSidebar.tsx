// apps/web/components/learner/programs/ProgramSidebar.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ProgramDetail, CourseInProgram } from '@/lib/learner/queries'

interface ProgramSidebarProps {
  program: ProgramDetail
  currentCourse?: CourseInProgram | null
}

export default function ProgramSidebar({ program, currentCourse }: ProgramSidebarProps) {
  const totalLessons = program.courses.reduce((sum, c) => sum + c.totalLessons, 0)
  const completedLessons = program.courses.reduce((sum, c) => sum + c.completedLessons, 0)

  return (
    <div className="space-y-6">
      {/* Quick Stats Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl shadow-sm p-6"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 
          className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center space-x-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Overview</span>
        </h3>

        <div className="space-y-4">
          {/* Total Courses */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Total Courses
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: 'var(--primary)' }}
            >
              {program.courses.length}
            </span>
          </div>

          {/* Total Lessons */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Total Lessons
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {totalLessons}
            </span>
          </div>

          {/* Completed */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Completed
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: 'var(--success)' }}
            >
              {completedLessons}
            </span>
          </div>

          {/* Progress Bar */}
          <div 
            className="pt-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Overall Progress
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {program.overallProgress}%
              </span>
            </div>
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    program.overallProgress === 100
                      ? 'var(--success)'
                      : program.overallProgress >= 50
                      ? 'var(--primary)'
                      : 'var(--warning)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${program.overallProgress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current Focus Card */}
      {currentCourse && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl shadow-sm p-6"
          style={{
            background: 'linear-gradient(135deg, var(--primary-surface) 0%, var(--surface) 100%)',
            border: '1px solid var(--primary-light)',
          }}
        >
          <h3 
            className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center space-x-2"
            style={{ color: 'var(--primary)' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>Current Focus</span>
          </h3>

          <div>
            <h4 
              className="font-bold mb-2 line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {currentCourse.title}
            </h4>
            
            {currentCourse.description && (
              <p 
                className="text-xs mb-3 line-clamp-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {currentCourse.description}
              </p>
            )}

            <div 
              className="flex items-center justify-between text-xs mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span>{currentCourse.completedLessons} of {currentCourse.totalLessons} lessons</span>
              <span className="font-bold">{currentCourse.progress}%</span>
            </div>

            <Link href={`/learn/programs/${program.id}/courses/${currentCourse.id}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--background)',
                }}
              >
                <span>Continue Course</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Completion Message */}
      {program.overallProgress === 100 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl shadow-sm p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--success-light) 0%, var(--surface) 100%)',
            border: '1px solid var(--success)',
          }}
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 
            className="font-bold mb-2"
            style={{ color: 'var(--success-dark)' }}
          >
            Program Complete!
          </h3>
          <p 
            className="text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            Congratulations on completing all courses!
          </p>
        </motion.div>
      )}

      {/* Assigned Date */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Assigned {new Date(program.assignedAt).toLocaleDateString('en-US', { 
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </motion.div>
    </div>
  )
}