// NEW: apps/web/components/learner/dashboard/StartLearningCard.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Program {
  id: string
  title: string
  description: string | null
  totalLessons: number
  completedLessons: number
  progress: number
}

interface StartLearningCardProps {
  program: Program // Best program to start
}

export default function StartLearningCard({ program }: StartLearningCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <Link href={`/learn/programs/${program.id}`}>
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
              {/* Left: Icon */}
              <div className="flex-shrink-0">
                <motion.div
                  className="w-40 h-40 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                  }}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                >
                  <svg 
                    className="w-20 h-20" 
                    style={{ color: 'var(--background)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                    />
                  </svg>
                </motion.div>

                {/* Pulse Ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: '2px solid var(--background)',
                    opacity: 0,
                  }}
                  animate={{
                    scale: [1, 1.3],
                    opacity: [0.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                  }}
                />
              </div>

              {/* Right: Program Info */}
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
                    {program.progress > 0 ? 'Continue Your Journey' : 'Start Your Journey'}
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
                  {program.title}
                </motion.h2>

                {/* Description */}
                {program.description && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-base mb-4 line-clamp-2"
                    style={{ color: 'rgba(255, 255, 255, 0.9)' }}
                  >
                    {program.description}
                  </motion.p>
                )}

                {/* Program Stats */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center md:justify-start space-x-4 text-sm mb-6"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{program.totalLessons} lessons</span>
                  </div>
                  {program.progress > 0 && (
                    <>
                      <span>•</span>
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>{program.completedLessons} complete</span>
                      </div>
                    </>
                  )}
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
                  <span>{program.progress > 0 ? 'Continue Program' : 'Start Program'}</span>
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