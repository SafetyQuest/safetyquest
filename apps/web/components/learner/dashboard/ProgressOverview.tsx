// apps/web/components/learner/dashboard/ProgressOverview.tsx
'use client'

import { motion } from 'framer-motion'

interface ProgressOverviewProps {
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

interface StatConfig {
  name: string
  value: string | number
  color: 'primary' | 'success' | 'warning' | 'highlight' | 'danger'
  icon: JSX.Element
  suffix?: string
}

export default function ProgressOverview({ summary }: ProgressOverviewProps) {
  const stats: StatConfig[] = [
    {
      name: 'Programs',
      value: summary.totalPrograms,
      color: 'primary',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      name: 'Lessons Completed',
      value: `${summary.completedLessons}/${summary.totalLessons}`,
      color: 'success',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      name: 'Level',
      value: summary.currentLevel,
      color: 'warning',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      )
    },
    {
      name: 'Total XP',
      value: summary.totalXp.toLocaleString(),
      color: 'highlight',
      suffix: 'XP',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      name: 'Day Streak',
      value: summary.currentStreak,
      color: 'danger',
      suffix: summary.currentStreak === 1 ? 'day' : 'days',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        </svg>
      )
    },
    {
      name: 'Badges',
      value: summary.badges,
      color: 'highlight',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      )
    }
  ]

  const getColorStyles = (color: StatConfig['color']) => {
    switch (color) {
      case 'primary':
        return {
          bg: 'var(--primary-surface)',
          icon: 'var(--primary)',
          text: 'var(--primary-dark)'
        }
      case 'success':
        return {
          bg: 'var(--success-light)',
          icon: 'var(--success)',
          text: 'var(--success-dark)'
        }
      case 'warning':
        return {
          bg: 'var(--warning-light)',
          icon: 'var(--warning)',
          text: 'var(--warning-dark)'
        }
      case 'danger':
        return {
          bg: 'var(--danger-light)',
          icon: 'var(--danger)',
          text: 'var(--danger-dark)'
        }
      case 'highlight':
        return {
          bg: 'var(--highlight-light)',
          icon: 'var(--highlight)',
          text: 'var(--highlight-dark)'
        }
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
        const colors = getColorStyles(stat.color)
        
        return (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="group rounded-xl shadow-sm hover:shadow-md transition-all p-6 cursor-default"
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
            }}
            whileHover={{ y: -2 }}
          >
            {/* Icon */}
            <div 
              className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 transition-transform group-hover:scale-110"
              style={{ 
                background: colors.bg, 
                color: colors.icon,
              }}
            >
              {stat.icon}
            </div>

            {/* Value */}
            <div 
              className="text-3xl font-bold mb-1" 
              style={{ color: 'var(--text-primary)' }}
            >
              {stat.value}
              {stat.suffix && (
                <span className="text-lg ml-1" style={{ color: 'var(--text-secondary)' }}>
                  {stat.suffix}
                </span>
              )}
            </div>

            {/* Label */}
            <div 
              className="text-sm font-medium" 
              style={{ color: 'var(--text-secondary)' }}
            >
              {stat.name}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}