// apps/web/app/admin/(dashboard)/settings/badges/page.tsx
'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  Search,
  Filter,
  Trophy,
  Zap,
  Users,
  TrendingUp,
  Clock,
  ChevronDown,
  X,
  Grid3X3,
  List,
  AlertCircle
} from 'lucide-react'
import BadgeDetailModal from '@/components/admin/BadgeDetailModal'

// Badge tier colors
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

const categoryIcons: Record<string, string> = {
  lesson: '📖',
  course: '📚',
  program: '🎯',
  accuracy: '🎯',
  difficulty: '⚡',
  streak: '🔥',
  special: '⭐'
}

interface Badge {
  id: string
  badgeKey: string
  name: string
  description: string | null
  category: string
  family: string | null
  tier: string
  icon: string
  requirement: number
  xpBonus: number
  earnedCount: number
  earnedPercentage: number
}

export default function AdminBadgesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [tierFilter, setTierFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const res = await fetch('/api/admin/badges')
      if (!res.ok) throw new Error('Failed to fetch badges')
      return res.json()
    }
  })

  if (isLoading) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load badges</h3>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const { badges, stats, recentAwards } = data

  // Filter badges
  const filteredBadges = badges.filter((badge: Badge) => {
    const matchesSearch = badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      badge.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || badge.category === categoryFilter
    const matchesTier = tierFilter === 'all' || badge.tier === tierFilter
    return matchesSearch && matchesCategory && matchesTier
  })

  // Group badges by category for display
  const badgesByCategory = filteredBadges.reduce((acc: Record<string, Badge[]>, badge: Badge) => {
    if (!acc[badge.category]) acc[badge.category] = []
    acc[badge.category].push(badge)
    return acc
  }, {})

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Award className="w-8 h-8 text-purple-600" />
          Badge Management
        </h1>
        <p className="text-gray-600 mt-1">View and manage all gamification badges</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Badges</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBadges}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total XP Available</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalXpAvailable.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Zap className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Awards</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAwards.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tier Breakdown */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Badges by Tier</h3>
        <div className="grid grid-cols-4 gap-4">
          {['bronze', 'silver', 'gold', 'platinum'].map(tier => {
            const tierData = stats.byTier[tier] || { count: 0, awarded: 0, xp: 0 }
            const colors = tierColors[tier as keyof typeof tierColors]
            return (
              <div key={tier} className={`rounded-lg border-2 ${colors.border} p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-br ${colors.gradient}`}></div>
                  <span className={`font-semibold capitalize ${colors.text}`}>{tier}</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Badges:</span>
                    <span className="font-medium">{tierData.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Awarded:</span>
                    <span className="font-medium">{tierData.awarded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">XP Value:</span>
                    <span className="font-medium">{tierData.xp.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Most/Least Earned + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Most Earned */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Most Earned
          </h3>
          <div className="space-y-3">
            {stats.mostEarned.map((badge: any, idx: number) => (
              <div 
                key={badge.id} 
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                onClick={() => setSelectedBadgeId(badge.id)}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium">{badge.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${tierColors[badge.tier as keyof typeof tierColors].bg} ${tierColors[badge.tier as keyof typeof tierColors].text}`}>
                    {badge.tier}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{badge.earnedCount} ({badge.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Least Earned */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-600" />
            Rarest Badges
          </h3>
          <div className="space-y-3">
            {stats.leastEarned.length > 0 ? stats.leastEarned.map((badge: any, idx: number) => (
              <div 
                key={badge.id} 
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-2 px-2 rounded"
                onClick={() => setSelectedBadgeId(badge.id)}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{badge.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${tierColors[badge.tier as keyof typeof tierColors].bg} ${tierColors[badge.tier as keyof typeof tierColors].text}`}>
                    {badge.tier}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{badge.earnedCount} ({badge.percentage}%)</span>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No badges earned yet</p>
            )}
          </div>
        </div>

        {/* Recent Awards */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Awards
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentAwards.length > 0 ? recentAwards.slice(0, 8).map((award: any) => (
              <div key={award.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">{award.user.name}</p>
                  <p className="text-xs text-gray-500">
                    {award.badge.name}
                    <span className={`ml-1 px-1 py-0.5 rounded ${tierColors[award.badge.tier as keyof typeof tierColors].bg} ${tierColors[award.badge.tier as keyof typeof tierColors].text}`}>
                      {award.badge.tier}
                    </span>
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(award.awardedAt).toLocaleDateString()}
                </span>
              </div>
            )) : (
              <p className="text-sm text-gray-500">No recent awards</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search badges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Tier Filter */}
          <div className="relative">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Tiers</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Active Filters */}
          {(searchQuery || categoryFilter !== 'all' || tierFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('')
                setCategoryFilter('all')
                setTierFilter('all')
              }}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Badge Grid/List */}
      {viewMode === 'grid' ? (
        <div className="space-y-8">
          {Object.entries(badgesByCategory).map(([category, categoryBadges]) => {
            // Only group by family for lesson, course, program categories
            const shouldGroupByFamily = ['lesson', 'course', 'program'].includes(category)

            if (shouldGroupByFamily) {
              // Group badges by family within category
              const badgesByFamily = (categoryBadges as Badge[]).reduce((acc: Record<string, Badge[]>, badge) => {
                const familyKey = badge.family || badge.badgeKey
                if (!acc[familyKey]) acc[familyKey] = []
                acc[familyKey].push(badge)
                return acc
              }, {})

              // Sort badges within each family by tier order
              const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
              Object.values(badgesByFamily).forEach(familyBadges => {
                familyBadges.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier))
              })

              const familyCount = Object.keys(badgesByFamily).length

              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>{categoryIcons[category] || '🏆'}</span>
                    {categoryLabels[category] || category}
                    <span className="text-sm font-normal text-gray-500">
                      ({familyCount} {familyCount === 1 ? 'badge' : 'badges'}, {(categoryBadges as Badge[]).length} tiers)
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.entries(badgesByFamily).map(([familyKey, familyBadges]) => {
                      const primaryBadge = familyBadges[0]
                      const totalEarned = familyBadges.reduce((sum, b) => sum + b.earnedCount, 0)
                      const totalXp = familyBadges.reduce((sum, b) => sum + b.xpBonus, 0)
                      
                      return (
                        <div
                          key={familyKey}
                          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                          {/* Badge Header */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                              <Award className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 truncate">{primaryBadge.name}</h4>
                              {primaryBadge.description && (
                                <p className="text-xs text-gray-500 truncate">{primaryBadge.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Tier Pills */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {familyBadges.map((badge) => {
                              const colors = tierColors[badge.tier as keyof typeof tierColors]
                              const hasEarners = badge.earnedCount > 0
                              return (
                                <button
                                  key={badge.id}
                                  onClick={() => setSelectedBadgeId(badge.id)}
                                  className={`
                                    flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
                                    border-2 transition-all hover:scale-105
                                    ${colors.border} ${colors.bg} ${colors.text}
                                    ${hasEarners ? 'opacity-100' : 'opacity-60'}
                                  `}
                                  title={`${badge.tier}: Requires ${badge.requirement}, +${badge.xpBonus} XP, ${badge.earnedCount} earned`}
                                >
                                  <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${colors.gradient}`} />
                                  <span className="capitalize">{badge.tier}</span>
                                  {hasEarners && (
                                    <span className="bg-white/50 px-1 rounded text-[10px]">
                                      {badge.earnedCount}
                                    </span>
                                  )}
                                </button>
                              )
                            })}
                          </div>

                          {/* Requirements Preview */}
                          <div className="text-xs text-gray-500 mb-3 flex items-center gap-3">
                            <span>
                              Req: {familyBadges.map(b => b.requirement).join(' → ')}
                            </span>
                          </div>

                          {/* Stats Footer */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              <span className="font-medium text-gray-900">{totalEarned}</span> earned total
                            </span>
                            <span className="text-purple-600 font-medium">
                              +{totalXp} XP available
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            } else {
              // Show individual badges for accuracy, difficulty, streak, special
              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span>{categoryIcons[category] || '🏆'}</span>
                    {categoryLabels[category] || category}
                    <span className="text-sm font-normal text-gray-500">({(categoryBadges as Badge[]).length})</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {(categoryBadges as Badge[]).map((badge) => {
                      const colors = tierColors[badge.tier as keyof typeof tierColors]
                      return (
                        <div
                          key={badge.id}
                          onClick={() => setSelectedBadgeId(badge.id)}
                          className={`bg-white rounded-lg border-2 ${colors.border} p-4 cursor-pointer hover:shadow-md transition-shadow`}
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center mb-3`}>
                              <Award className="w-7 h-7 text-white" />
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm">{badge.name}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full mt-1 ${colors.bg} ${colors.text}`}>
                              {badge.tier}
                            </span>
                            <div className="mt-2 text-xs text-gray-500">
                              <p>Requires: {badge.requirement}</p>
                              <p>+{badge.xpBonus} XP</p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                              <p className="text-xs font-medium text-gray-700">
                                {badge.earnedCount} earned ({badge.earnedPercentage}%)
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Badge</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Category</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Tiers</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Requirements</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">XP</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">Earned</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const rows: React.ReactNode[] = []
                const tierOrder = ['bronze', 'silver', 'gold', 'platinum']

                // Separate badges into grouped (lesson/course/program) and individual (others)
                const groupedCategories = ['lesson', 'course', 'program']
                const groupedBadges = filteredBadges.filter((b: Badge) => groupedCategories.includes(b.category))
                const individualBadges = filteredBadges.filter((b: Badge) => !groupedCategories.includes(b.category))

                // Process grouped badges by family
                const badgesByFamily = groupedBadges.reduce((acc: Record<string, Badge[]>, badge: Badge) => {
                  const familyKey = badge.family || badge.badgeKey
                  if (!acc[familyKey]) acc[familyKey] = []
                  acc[familyKey].push(badge)
                  return acc
                }, {})

                Object.values(badgesByFamily).forEach(familyBadges => {
                  familyBadges.sort((a, b) => tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier))
                })

                // Add family rows
                Object.entries(badgesByFamily).forEach(([familyKey, familyBadges]) => {
                  const primaryBadge = familyBadges[0]
                  const totalEarned = familyBadges.reduce((sum, b) => sum + b.earnedCount, 0)
                  const totalXp = familyBadges.reduce((sum, b) => sum + b.xpBonus, 0)

                  rows.push(
                    <tr key={familyKey} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                            <Award className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{primaryBadge.name}</p>
                            {primaryBadge.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{primaryBadge.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {categoryIcons[primaryBadge.category]} {categoryLabels[primaryBadge.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {familyBadges.map((badge) => {
                            const colors = tierColors[badge.tier as keyof typeof tierColors]
                            return (
                              <button
                                key={badge.id}
                                onClick={() => setSelectedBadgeId(badge.id)}
                                className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} font-medium capitalize hover:opacity-80 transition-opacity`}
                                title={`${badge.earnedCount} users earned`}
                              >
                                {badge.tier}
                                {badge.earnedCount > 0 && (
                                  <span className="ml-1 opacity-70">({badge.earnedCount})</span>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {familyBadges.map(b => b.requirement).join(' → ')}
                      </td>
                      <td className="px-4 py-3 text-sm text-purple-600 font-medium">+{totalXp}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{totalEarned}</span>
                      </td>
                    </tr>
                  )
                })

                // Add individual badge rows
                individualBadges.forEach((badge: Badge) => {
                  const colors = tierColors[badge.tier as keyof typeof tierColors]
                  rows.push(
                    <tr 
                      key={badge.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedBadgeId(badge.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors.gradient} flex items-center justify-center`}>
                            <Award className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{badge.name}</p>
                            {badge.description && (
                              <p className="text-xs text-gray-500 truncate max-w-[200px]">{badge.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-700">
                          {categoryIcons[badge.category]} {categoryLabels[badge.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${colors.bg} ${colors.text} font-medium capitalize`}>
                          {badge.tier}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{badge.requirement}</td>
                      <td className="px-4 py-3 text-sm text-purple-600 font-medium">+{badge.xpBonus}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{badge.earnedCount}</span>
                        <span className="text-xs text-gray-500 ml-1">({badge.earnedPercentage}%)</span>
                      </td>
                    </tr>
                  )
                })

                return rows
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* No Results */}
      {filteredBadges.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No badges found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadgeId && (
        <BadgeDetailModal
          badgeId={selectedBadgeId}
          onClose={() => setSelectedBadgeId(null)}
        />
      )}
    </div>
  )
}