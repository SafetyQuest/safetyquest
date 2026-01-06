// apps/web/components/learner/dashboard/RecentActivity.tsx
'use client'

import { motion } from 'framer-motion'

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

interface RecentActivityProps {
  activities: Activity[]
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Recent Activity
        </h2>
        <div 
          className="rounded-xl shadow-sm p-12 text-center"
          style={{
            background: 'var(--background)',
            border: '2px dashed var(--border)',
          }}
        >
          <div 
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ background: 'var(--surface)' }}
          >
            <svg className="w-8 h-8" style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            No recent activity yet
          </p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Start a lesson to see your progress here
          </p>
        </div>
      </div>
    )
  }

  const getActivityConfig = (type: Activity['type']) => {
    switch (type) {
      case 'LESSON_COMPLETED':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'var(--success-light)',
          iconColor: 'var(--success)',
          borderColor: 'var(--success)',
        }
      case 'COURSE_COMPLETED':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          ),
          bgColor: 'var(--primary-surface)',
          iconColor: 'var(--primary)',
          borderColor: 'var(--primary-light)',
        }
      case 'BADGE_EARNED':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ),
          bgColor: 'var(--highlight-light)',
          iconColor: 'var(--highlight)',
          borderColor: 'var(--highlight)',
        }
      case 'PROGRAM_STARTED':
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          bgColor: 'var(--warning-light)',
          iconColor: 'var(--warning)',
          borderColor: 'var(--warning)',
        }
      default:
        return {
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          bgColor: 'var(--surface)',
          iconColor: 'var(--text-muted)',
          borderColor: 'var(--border)',
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

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return past.toLocaleDateString()
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
        Recent Activity
      </h2>
      
      <div 
        className="rounded-xl shadow-sm overflow-hidden"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        {activities.map((activity, index) => {
          const config = getActivityConfig(activity.type)
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              className="group transition-all"
              style={{
                borderBottom: index < activities.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div 
                className="p-4 transition-colors"
                style={{
                  background: 'transparent',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div 
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ 
                      background: config.bgColor,
                      color: config.iconColor,
                      border: `1px solid ${config.borderColor}`,
                    }}
                  >
                    {config.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-semibold mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {activity.title}
                    </p>
                    
                    {/* Details */}
                    <div className="flex items-center flex-wrap gap-2 text-xs">
                      {activity.details.programTitle && (
                        <>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            {activity.details.programTitle}
                          </span>
                          {activity.details.courseTitle && (
                            <>
                              <span style={{ color: 'var(--text-muted)' }}>•</span>
                              <span style={{ color: 'var(--text-secondary)' }}>
                                {activity.details.courseTitle}
                              </span>
                            </>
                          )}
                        </>
                      )}
                      
                      {activity.details.score !== undefined && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>•</span>
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full font-semibold"
                            style={{
                              background: activity.details.score >= 80 
                                ? 'var(--success-light)' 
                                : activity.details.score >= 60
                                ? 'var(--warning-light)'
                                : 'var(--danger-light)',
                              color: activity.details.score >= 80
                                ? 'var(--success-dark)'
                                : activity.details.score >= 60
                                ? 'var(--warning-dark)'
                                : 'var(--danger-dark)',
                            }}
                          >
                            {activity.details.score}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div 
                    className="flex-shrink-0 text-xs whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {getTimeAgo(activity.timestamp)}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}