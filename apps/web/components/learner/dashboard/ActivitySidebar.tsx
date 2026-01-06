// FIXED: apps/web/components/learner/dashboard/ActivitySidebar.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface Activity {
  type: 'LESSON_COMPLETED' | 'COURSE_COMPLETED' | 'BADGE_EARNED' | 'PROGRAM_STARTED'
  title: string
  timestamp: string
  details: {
    programTitle?: string
    courseTitle?: string
    score?: number
    badgeIcon?: string
  }
}

interface ActivitySidebarProps {
  activities: Activity[]
  maxItems?: number
}

export default function ActivitySidebar({ activities, maxItems = 5 }: ActivitySidebarProps) {
  const displayActivities = activities.slice(0, maxItems)

  const getActivityConfig = (type: Activity['type']) => {
    switch (type) {
      case 'LESSON_COMPLETED':
        return {
          icon: '✓',
          bgColor: 'var(--success-light)',
          iconColor: 'var(--success)',
        }
      case 'COURSE_COMPLETED':
        return {
          icon: '🎓',
          bgColor: 'var(--primary-surface)',
          iconColor: 'var(--primary)',
        }
      case 'BADGE_EARNED':
        return {
          icon: '🏆',
          bgColor: 'var(--highlight-light)',
          iconColor: 'var(--highlight)',
        }
      case 'PROGRAM_STARTED':
        return {
          icon: '⚡',
          bgColor: 'var(--warning-light)',
          iconColor: 'var(--warning)',
        }
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return past.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (displayActivities.length === 0) {
    return (
      <div className="rounded-xl shadow-sm p-6 text-center"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
          style={{ background: 'var(--surface)' }}
        >
          <svg className="w-6 h-6" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
          No activity yet
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Complete lessons to see activity
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl shadow-sm overflow-hidden"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h3>
      </div>

      {/* Activity List */}
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {displayActivities.map((activity, index) => {
          const config = getActivityConfig(activity.type)

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-3 hover:bg-[var(--surface)] transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{
                    background: config.bgColor,
                    color: config.iconColor,
                  }}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-semibold line-clamp-2 mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {activity.title}
                  </p>

                  {/* Score Badge - FIXED: Check if score is valid number */}
                  {activity.details.score !== undefined && 
                   !isNaN(activity.details.score) && 
                   isFinite(activity.details.score) && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold mb-1"
                      style={{
                        background:
                          activity.details.score >= 80
                            ? 'var(--success-light)'
                            : activity.details.score >= 60
                            ? 'var(--warning-light)'
                            : 'var(--danger-light)',
                        color:
                          activity.details.score >= 80
                            ? 'var(--success-dark)'
                            : activity.details.score >= 60
                            ? 'var(--warning-dark)'
                            : 'var(--danger-dark)',
                      }}
                    >
                      {Math.round(activity.details.score)}%
                    </span>
                  )}

                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {getTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* View All Link */}
      {activities.length > maxItems && (
        <Link href="/learn/activity">
          <div
            className="px-4 py-3 text-center border-t hover:bg-[var(--surface)] transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border)' }}
          >
            <span
              className="text-sm font-semibold"
              style={{ color: 'var(--primary)' }}
            >
              View All Activity →
            </span>
          </div>
        </Link>
      )}
    </div>
  )
}