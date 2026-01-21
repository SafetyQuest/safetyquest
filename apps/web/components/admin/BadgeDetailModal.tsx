// apps/web/app/admin/(dashboard)/settings/badges/BadgeDetailModal.tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { X, Award, Users, Zap, Calendar, Building, Loader2 } from 'lucide-react'

const tierColors = {
  bronze: {
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    gradient: 'from-amber-600 to-amber-800'
  },
  silver: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    gradient: 'from-gray-400 to-gray-600'
  },
  gold: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    gradient: 'from-yellow-400 to-orange-500'
  },
  platinum: {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    gradient: 'from-purple-400 to-pink-500'
  }
}

const categoryLabels: Record<string, string> = {
  lesson: 'Lessons',
  course: 'Courses',
  program: 'Programs',
  accuracy: 'Accuracy',
  difficulty: 'Difficulty',
  streak: 'Streaks',
  special: 'Special'
}

interface BadgeDetailModalProps {
  badgeId: string
  onClose: () => void
}

export default function BadgeDetailModal({ badgeId, onClose }: BadgeDetailModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['badge-detail', badgeId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/badges/${badgeId}`)
      if (!res.ok) throw new Error('Failed to fetch badge details')
      return res.json()
    }
  })

  const colors = data?.badge?.tier 
    ? tierColors[data.badge.tier as keyof typeof tierColors] 
    : tierColors.bronze

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.gradient} px-6 py-8 text-white relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <Award className="w-10 h-10 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{data?.badge?.name}</h2>
                <p className="text-white/80 mt-1">{data?.badge?.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {data?.badge?.tier}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    {categoryLabels[data?.badge?.category] || data?.badge?.category}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-20 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-600">Failed to load badge details</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.stats.earnedCount}</div>
                  <div className="text-sm text-gray-600">Users Earned</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.stats.earnedPercentage}%</div>
                  <div className="text-sm text-gray-600">of All Users</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-900">{data.badge.requirement}</div>
                  <div className="text-sm text-gray-600">Requirement</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">+{data.badge.xpBonus}</div>
                  <div className="text-sm text-gray-600">XP Bonus</div>
                </div>
              </div>

              {/* Dates */}
              {(data.stats.firstAwarded || data.stats.lastAwarded) && (
                <div className="flex items-center gap-6 mb-6 text-sm text-gray-600">
                  {data.stats.firstAwarded && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>First awarded: {new Date(data.stats.firstAwarded).toLocaleDateString()}</span>
                    </div>
                  )}
                  {data.stats.lastAwarded && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Last awarded: {new Date(data.stats.lastAwarded).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Users List - Department Breakdown Section Removed */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Users Who Earned This Badge ({data.users.length})
                </h3>
                
                {data.users.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">User</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Department</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Level</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-gray-700">Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.slice(0, 20).map((user: any) => (
                          <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {user.department || '-'}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-gray-900">Lvl {user.level}</span>
                              <span className="text-xs text-gray-500 ml-1">({user.xp.toLocaleString()} XP)</span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(user.awardedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.users.length > 20 && (
                      <div className="bg-gray-50 px-4 py-2 text-center text-sm text-gray-600">
                        And {data.users.length - 20} more users...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No users have earned this badge yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}