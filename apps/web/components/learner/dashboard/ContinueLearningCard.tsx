// FIXED: apps/web/components/learner/dashboard/ContinueLearningCard.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface ContinueLearningCardProps {
  lesson: {
    id: string
    lessonId: string      // NEW: actual lesson ID
    programId: string     // NEW: for URL
    courseId: string      // NEW: for URL
    title: string
    courseTitle: string
    programTitle: string
    progress: number // 0-100
    stepNumber: number
    totalSteps: number
  }
}

export default function ContinueLearningCard({ lesson }: ContinueLearningCardProps) {
  // Circle progress values
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (lesson.progress / 100) * circumference

  // Correct URL structure
  const lessonUrl = `/learn/programs/${lesson.programId}/courses/${lesson.courseId}/lessons/${lesson.lessonId}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link href={lessonUrl}>
        <div
          className="group rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            border: '2px solid var(--primary-light)',
          }}
        >
          <div className="relative p-8 md:p-10">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `radial-gradient(circle at 20px 20px, var(--background) 2px, transparent 0)`,
                backgroundSize: '40px 40px',
              }}
            />

            <div className="relative flex flex-col md:flex-row items-center gap-8">
              {/* Left: Circular Progress */}
              <div className="flex-shrink-0">
                <div className="relative w-40 h-40">
                  {/* Background Circle */}
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                    <circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="12"
                      fill="none"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                      cx="80"
                      cy="80"
                      r={radius}
                      stroke="var(--success)"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                      style={{
                        strokeDasharray: circumference,
                      }}
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <motion.div
                        className="text-4xl font-black mb-1"
                        style={{ color: 'var(--background)' }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
                      >
                        {lesson.progress}%
                      </motion.div>
                      <div
                        className="text-xs font-semibold uppercase tracking-wide"
                        style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                      >
                        Complete
                      </div>
                    </div>
                  </div>

                  {/* Pulse Ring */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: '2px solid var(--success)',
                      opacity: 0,
                    }}
                    animate={{
                      scale: [1, 1.2],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeOut',
                    }}
                  />
                </div>
              </div>

              {/* Right: Lesson Info */}
              <div className="flex-1 text-center md:text-left">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-full mb-4"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <svg className="w-4 h-4" style={{ color: 'var(--background)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--background)' }}>
                    Continue Learning
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl md:text-3xl font-black mb-3 line-clamp-2"
                  style={{ color: 'var(--background)' }}
                >
                  {lesson.title}
                </motion.h2>

                {/* Breadcrumb */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-center md:justify-start space-x-2 text-sm mb-4"
                  style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                >
                  <span className="font-medium">{lesson.programTitle}</span>
                  <span>→</span>
                  <span className="font-medium">{lesson.courseTitle}</span>
                </motion.div>

                {/* Progress Info */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center md:justify-start space-x-4 text-sm mb-6"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>
                      Step {lesson.stepNumber} of {lesson.totalSteps}
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{Math.ceil((lesson.totalSteps - lesson.stepNumber) * 5)} min left</span>
                  </div>
                </motion.div>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all group-hover:shadow-xl"
                  style={{
                    background: 'var(--background)',
                    color: 'var(--primary)',
                  }}
                >
                  <span>Continue Lesson</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}