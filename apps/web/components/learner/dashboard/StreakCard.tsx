// UPDATED: apps/web/components/learner/dashboard/StreakCard.tsx
'use client'

import { motion } from 'framer-motion'

interface DailyActivity {
  date: string
  hasActivity: boolean
}

interface StreakCardProps {
  currentStreak: number
  longestStreak?: number
  dailyActivity: DailyActivity[] // NEW: Real data from database
}

export default function StreakCard({ currentStreak, longestStreak, dailyActivity }: StreakCardProps) {
  // Process daily activity data for display
  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' })[0]
  }

  // Ensure we have exactly 7 days
  const displayDays = dailyActivity.slice(-7).map(day => ({
    day: getDayLabel(day.date),
    hasActivity: day.hasActivity,
  }))

  // Pad with empty days if needed
  while (displayDays.length < 7) {
    displayDays.unshift({ day: '-', hasActivity: false })
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl shadow-sm overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--danger-light) 0%, var(--warning-light) 100%)',
        border: '1px solid var(--danger)',
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3
            className="text-lg font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Daily Streak
          </h3>
          
          {/* Flame Icon with Pulse */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ color: 'var(--danger)' }}
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2c1.5 3.5 3 5.5 5 7-1.5 0-2.5 1-3 2 2 0 4 1 5 3.5-3-1-5.5 0-7 2.5-.5-2-2-3.5-4-4 1-1.5 1-3.5 0-5 1.5 1 3 1.5 4.5 1C11 6.5 11 4 12 2z" />
            </svg>
          </motion.div>
        </div>

        {/* Streak Counter */}
        <div className="text-center mb-6">
          <motion.div
            className="text-6xl font-black leading-none mb-2"
            style={{ 
              color: 'var(--danger-dark)',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 10, delay: 0.2 }}
          >
            {currentStreak}
          </motion.div>
          <div
            className="text-sm font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-secondary)' }}
          >
            {currentStreak === 1 ? 'Day' : 'Days'}
          </div>
        </div>

        {/* Mini Calendar */}
        <div className="mb-4">
          <div className="flex justify-between gap-1">
            {displayDays.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 + 0.3 }}
                className="flex-1 text-center"
              >
                <div
                  className="text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {day.day}
                </div>
                <div
                  className="h-8 rounded-md transition-all"
                  style={{
                    background: day.hasActivity
                      ? 'var(--success)'
                      : 'var(--surface)',
                    border: day.hasActivity
                      ? '2px solid var(--success-dark)'
                      : '2px solid var(--border)',
                    opacity: day.hasActivity ? 1 : 0.4,
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Best Streak */}
        {longestStreak && longestStreak > currentStreak && (
          <div
            className="text-center pt-4 border-t"
            style={{ borderColor: 'rgba(0,0,0,0.1)' }}
          >
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Best Streak
            </div>
            <div
              className="text-lg font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {longestStreak} days 🏆
            </div>
          </div>
        )}

        {/* Motivation Message */}
        <div
          className="mt-4 text-center text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          {currentStreak === 0 && "Start your streak today!"}
          {currentStreak > 0 && currentStreak < 7 && "Keep it going! 🔥"}
          {currentStreak >= 7 && currentStreak < 30 && "You're on fire! 🚀"}
          {currentStreak >= 30 && "Legendary streak! 👑"}
        </div>
      </div>
    </motion.div>
  )
}