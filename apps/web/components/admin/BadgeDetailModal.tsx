'use client'

import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { X, Award, Users, Zap, Calendar, Building, Loader2 } from 'lucide-react'

// Tier colors - UPDATED TO USE CSS VARIABLES
const tierColors = {
  bronze: {
    bg: 'bg-[var(--warning-light)]',
    text: 'text-[var(--warning-dark)]',
    border: 'border-[var(--warning)]',
    gradient: 'from-[var(--warning)] to-[var(--warning-dark)]'
  },
  silver: {
    bg: 'bg-[var(--surface)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border-[var(--border)]',
    gradient: 'from-[var(--text-secondary)] to-[var(--text-primary)]'
  },
  gold: {
    bg: 'bg-[var(--warning-light)]',
    text: 'text-[var(--warning-dark)]',
    border: 'border-[var(--warning)]',
    gradient: 'from-[var(--warning)] to-[var(--warning-dark)]'
  },
  platinum: {
    bg: 'bg-[var(--highlight-light)]',
    text: 'text-[var(--highlight-dark)]',
    border: 'border-[var(--highlight)]',
    gradient: 'from-[var(--highlight)] to-[var(--highlight-dark)]'
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

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

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
      <div className="relative bg-[var(--background)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-[var(--border)]">
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
              <Loader2 className="w-8 h-8 animate-spin text-white" />
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
              <div className="h-20 bg-[var(--surface-hover)] rounded-lg animate-pulse" />
              <div className="h-40 bg-[var(--surface-hover)] rounded-lg animate-pulse" />
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-[var(--danger-dark)]">Failed to load badge details</p>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[var(--surface)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{data.stats.earnedCount}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Users Earned</div>
                </div>
                <div className="bg-[var(--surface)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{data.stats.earnedPercentage}%</div>
                  <div className="text-sm text-[var(--text-secondary)]">of All Users</div>
                </div>
                <div className="bg-[var(--surface)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--text-primary)]">{data.badge.requirement}</div>
                  <div className="text-sm text-[var(--text-secondary)]">Requirement</div>
                </div>
                <div className="bg-[var(--surface)] rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-[var(--highlight-dark)]">+{data.badge.xpBonus}</div>
                  <div className="text-sm text-[var(--text-secondary)]">XP Bonus</div>
                </div>
              </div>

              {/* Dates */}
              {(data.stats.firstAwarded || data.stats.lastAwarded) && (
                <div className="flex items-center gap-6 mb-6 text-sm text-[var(--text-secondary)]">
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

              {/* Users List */}
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-[var(--text-secondary)]" />
                  Users Who Earned This Badge ({data.users.length})
                </h3>
                
                {data.users.length > 0 ? (
                  <div className="border border-[var(--border)] rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-[var(--surface)] border-b border-[var(--border)]">
                        <tr>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">User</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">Department</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">Level</th>
                          <th className="text-left px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">Earned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.users.slice(0, 20).map((user: any) => (
                          <tr key={user.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-hover)]">
                            <td className="px-4 py-2">
                              <div>
                                <p className="text-sm font-medium text-[var(--text-primary)]">{user.name}</p>
                                <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--text-primary)]">
                              {user.department || '-'}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-[var(--text-primary)]">Lvl {user.level}</span>
                              <span className="text-xs text-[var(--text-muted)] ml-1">({user.xp.toLocaleString()} XP)</span>
                            </td>
                            <td className="px-4 py-2 text-sm text-[var(--text-muted)]">
                              {new Date(user.awardedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.users.length > 20 && (
                      <div className="bg-[var(--surface)] px-4 py-2 text-center text-sm text-[var(--text-secondary)]">
                        And {data.users.length - 20} more users...
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[var(--surface)] rounded-lg">
                    <Award className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-[var(--text-secondary)]">No users have earned this badge yet</p>
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