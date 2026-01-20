// NEW: apps/web/components/learner/dashboard/WelcomeCard.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function WelcomeCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div
        className="rounded-2xl shadow-lg overflow-hidden"
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

          <div className="relative text-center">
            {/* Icon */}
            <motion.div
              className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            >
              <span className="text-6xl">👋</span>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-4xl font-black mb-4"
              style={{ color: 'var(--background)' }}
            >
              Welcome to SafetyQuest!
            </motion.h2>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg mb-8 max-w-2xl mx-auto"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              Your safety training journey is about to begin. Programs will appear here once your administrator assigns them to you.
            </motion.p>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="inline-block rounded-xl p-6 mb-6"
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <h3 
                className="font-bold mb-3 text-lg"
                style={{ color: 'var(--background)' }}
              >
                What's Next?
              </h3>
              <ul 
                className="text-left space-y-2 text-sm"
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>Your administrator will assign training programs to you</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>You'll receive a notification when programs are ready</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="flex-shrink-0">✓</span>
                  <span>Start learning at your own pace once assigned</span>
                </li>
              </ul>
            </motion.div>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, type: 'spring', stiffness: 200 }}
            >
              <Link href="/learn/programs">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl font-bold text-lg shadow-lg"
                  style={{
                    background: 'var(--background)',
                    color: 'var(--primary)',
                  }}
                >
                  <span>View Programs</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}