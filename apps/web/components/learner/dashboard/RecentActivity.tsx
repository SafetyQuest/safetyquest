// apps/web/components/learner/dashboard/RecentActivity.tsx

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
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No recent activity yet</p>
          <p className="text-sm text-gray-400 mt-2">Start a lesson to see your progress here</p>
        </div>
      </div>
    )
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'LESSON_COMPLETED':
        return '✅'
      case 'COURSE_COMPLETED':
        return '🎓'
      case 'BADGE_EARNED':
        return '🏆'
      case 'PROGRAM_STARTED':
        return '🚀'
      default:
        return '📝'
    }
  }

  const getTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-100">
        {activities.map((activity, index) => (
          <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{getIcon(activity.type)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.title}
                </p>
                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                  <span>{activity.details.programTitle}</span>
                  {activity.details.courseTitle && (
                    <>
                      <span>•</span>
                      <span>{activity.details.courseTitle}</span>
                    </>
                  )}
                  {activity.details.score && (
                    <>
                      <span>•</span>
                      <span className="font-medium text-green-600">
                        {activity.details.score}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {getTimeAgo(activity.timestamp)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}