// apps/web/components/learner/dashboard/CompactStatsBar.tsx
'use client'

import { motion } from 'framer-motion'

interface CompactStatsBarProps {
  summary: {
    totalPrograms: number
    totalLessons: number
    completedLessons: number
    totalXp: number
    currentLevel: number
    currentStreak: number
    badges: number
  }
}

export default function CompactStatsBar({ summary }: CompactStatsBarProps) {
  const stats = [
    {
      label: 'Level',
      value: summary.currentLevel,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'var(--warning)',
    },
    {
      label: 'XP',
      value: summary.totalXp.toLocaleString(),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'var(--highlight)',
    },
    {
      label: 'Streak',
      value: `${summary.currentStreak}d`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      ),
      color: 'var(--danger)',
    },
    {
      label: 'Programs',
      value: summary.totalPrograms,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'var(--primary)',
    },
    {
      label: 'Lessons',
      value: `${summary.completedLessons}/${summary.totalLessons}`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'var(--success)',
    },
    {
      label: 'Badges',
      value: summary.badges,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      color: 'var(--highlight)',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl shadow-sm overflow-hidden"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
      }}
    >
      <div className="flex flex-wrap divide-x divide-[var(--border)]">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center space-x-3 px-6 py-4 flex-1 min-w-[160px] group cursor-default hover:bg-[var(--surface)] transition-colors"
          >
            {/* Icon */}
            <div
              className="flex-shrink-0 transition-transform group-hover:scale-110"
              style={{ color: stat.color }}
            >
              {stat.icon}
            </div>

            {/* Value & Label */}
            <div className="flex-1 min-w-0">
              <div
                className="text-2xl font-bold leading-none mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs font-medium uppercase tracking-wide"
                style={{ color: 'var(--text-secondary)' }}
              >
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}