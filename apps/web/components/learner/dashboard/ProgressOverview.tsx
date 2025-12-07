// apps/web/components/learner/dashboard/ProgressOverview.tsx

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

export default function ProgressOverview({ summary }: ProgressOverviewProps) {
  const stats = [
    {
      name: 'Programs',
      value: summary.totalPrograms,
      icon: '📚',
      color: 'bg-blue-50 text-blue-700'
    },
    {
      name: 'Lessons Completed',
      value: `${summary.completedLessons}/${summary.totalLessons}`,
      icon: '✅',
      color: 'bg-green-50 text-green-700'
    },
    {
      name: 'Level',
      value: summary.currentLevel,
      icon: '⭐',
      color: 'bg-yellow-50 text-yellow-700'
    },
    {
      name: 'Total XP',
      value: summary.totalXp.toLocaleString(),
      icon: '💎',
      color: 'bg-purple-50 text-purple-700'
    },
    {
      name: 'Day Streak',
      value: summary.currentStreak,
      icon: '🔥',
      color: 'bg-orange-50 text-orange-700'
    },
    {
      name: 'Badges',
      value: summary.badges,
      icon: '🏆',
      color: 'bg-pink-50 text-pink-700'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.name}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
        >
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg ${stat.color} mb-3`}>
            <span className="text-2xl">{stat.icon}</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
          <div className="text-sm text-gray-500">{stat.name}</div>
        </div>
      ))}
    </div>
  )
}