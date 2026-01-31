'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Award,
  Search,
  Trophy,
  Users,
  BookOpen,
  Compass,
  Star,
  Footprints,
  Sword,
  Crown,
  GraduationCap,
  Shield,
  Castle,
  Gem,
  Medal,
  Sparkles,
  Target,
  Crosshair,
  TrendingUp,
  BarChart,
  Brain,
  Mountain,
  Flag,
  Flame,
  Calendar,
  Clock,
  Rocket,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Zap,
  CheckCircle
} from 'lucide-react'
import BadgeDetailModal from '@/components/admin/BadgeDetailModal'

// Icon mapper - hardcoded Lucide icons (UNCHANGED)
const iconMap: Record<string, any> = {
  BookOpen,
  Compass,
  Star,
  Footprints,
  Sword,
  Crown,
  GraduationCap,
  Shield,
  Trophy,
  Castle,
  Gem,
  Medal,
  Award,
  Sparkles,
  Target,
  Crosshair,
  TrendingUp,
  BarChart,
  Brain,
  Mountain,
  Flag,
  Flame,
  Calendar,
  Clock,
  Rocket,
  CheckCircle2,
  ShieldCheck,
  Zap,
  CheckCircle
}

// Tier text colors for requirements - UPDATED TO USE CSS VARIABLES
const tierTextColors = {
  bronze: 'text-[var(--warning-dark)]',
  silver: 'text-[var(--text-secondary)]',
  gold: 'text-[var(--warning-dark)]',
  platinum: 'text-[var(--highlight-dark)]'
}

const tierBgColors = {
  bronze: 'bg-[var(--warning-light)]',
  silver: 'bg-[var(--surface)]',
  gold: 'bg-[var(--warning-light)]',
  platinum: 'bg-[var(--highlight-light)]'
}

// Color schemes based on badge names/vibe (UNCHANGED - badge design preserved)
const getBadgeColorScheme = (badgeName: string, tier: string) => {
  const name = badgeName.toLowerCase()
  
  // Specific color mappings based on vibe
  if (name.includes('awakening')) return 'from-blue-400 to-indigo-500'
  if (name.includes('climb')) return 'from-green-400 to-emerald-500'
  if (name.includes('pathfinder')) return 'from-teal-400 to-cyan-500'
  if (name.includes('lore') || name.includes('hunter')) return 'from-purple-400 to-violet-500'
  if (name.includes('knight')) return 'from-indigo-500 to-blue-600'
  if (name.includes('lord')) return 'from-purple-600 to-pink-600'
  if (name.includes('who knows')) return 'from-yellow-400 to-orange-500'
  
  if (name.includes('novice')) return 'from-green-400 to-teal-500'
  if (name.includes('squire')) return 'from-blue-400 to-indigo-500'
  if (name.includes('baron') || name.includes('viscount')) return 'from-purple-500 to-pink-500'
  if (name.includes('duke') || name.includes('archduke')) return 'from-red-500 to-rose-600'
  
  if (name.includes('perfect') || name.includes('flawless') || name.includes('precision')) return 'from-pink-500 to-rose-600'
  if (name.includes('triple') || name.includes('crown')) return 'from-yellow-500 to-amber-600'
  if (name.includes('unbroken')) return 'from-purple-600 to-fuchsia-600'
  
  if (name.includes('high achiever')) return 'from-blue-400 to-cyan-500'
  if (name.includes('consistent') || name.includes('excellence')) return 'from-green-500 to-emerald-600'
  if (name.includes('top performer')) return 'from-yellow-500 to-orange-500'
  if (name.includes('elite') || name.includes('scholar')) return 'from-purple-600 to-violet-700'
  
  if (name.includes('challenge') || name.includes('breaker')) return 'from-red-500 to-orange-600'
  if (name.includes('conqueror')) return 'from-red-600 to-rose-700'
  if (name.includes('master of difficulty')) return 'from-orange-600 to-red-700'
  
  if (name.includes('fire')) return 'from-orange-500 to-red-500'
  if (name.includes('committed')) return 'from-blue-500 to-indigo-600'
  if (name.includes('dedicated')) return 'from-purple-500 to-fuchsia-600'
  if (name.includes('champion')) return 'from-yellow-500 to-amber-600'
  if (name.includes('unstoppable')) return 'from-red-600 to-pink-600'
  if (name.includes('legend')) return 'from-yellow-400 to-pink-500'
  
  if (name.includes('training complete')) return 'from-green-600 to-emerald-700'
  if (name.includes('certified')) return 'from-blue-600 to-indigo-700'
  
  // Fallback based on tier
  if (tier === 'platinum') return 'from-purple-500 to-pink-600'
  if (tier === 'gold') return 'from-yellow-500 to-orange-500'
  if (tier === 'silver') return 'from-gray-400 to-gray-600'
  return 'from-amber-600 to-orange-700' // bronze
}

const tierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎'
}

// Special badge requirement descriptions (UNCHANGED)
const getSpecialBadgeRequirement = (badgeKey: string) => {
  if (badgeKey === 'special_complete') {
    return {
      number: 'All',
      text: 'Complete all assigned programs'
    }
  }
  if (badgeKey === 'special_certified') {
    return {
      number: '90%+ Average Score',
      text: 'Average across all programs'
    }
  }
  return null
}

// Section definitions (UNCHANGED)
const sections = [
  {
    id: 'lesson',
    title: 'LESSON MILESTONES',
    description: 'Earned by completing lessons',
    icon: BookOpen,
    groupByFamily: true
  },
  {
    id: 'course',
    title: 'COURSE MILESTONES',
    description: 'Earned by completing courses',
    icon: GraduationCap,
    groupByFamily: true
  },
  {
    id: 'program',
    title: 'PROGRAM MILESTONES',
    description: 'Earned by completing programs',
    icon: Trophy,
    groupByFamily: true
  },
  {
    id: 'accuracy_perfect',
    title: 'Accuracy - Perfect Scores (100%)',
    description: 'Earned by achieving perfect quiz scores',
    icon: Target,
    groupByFamily: false
  },
  {
    id: 'accuracy_excellent',
    title: 'Accuracy - Excellent Scores (90%+)',
    description: 'Earned by achieving excellent quiz scores',
    icon: TrendingUp,
    groupByFamily: false
  },
  {
    id: 'difficulty',
    title: 'Difficulty-Based (Advanced Lessons)',
    description: 'Earned by completing advanced difficulty lessons',
    icon: Mountain,
    groupByFamily: false
  },
  {
    id: 'streak',
    title: 'Streak Badges',
    description: 'Earned by maintaining consecutive learning days',
    icon: Flame,
    groupByFamily: false
  },
  {
    id: 'special',
    title: 'Special Achievements',
    description: 'Rare badges for exceptional accomplishments',
    icon: Sparkles,
    groupByFamily: false
  }
]

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
  const [activeSectionId, setActiveSectionId] = useState<string>('all')
  const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const res = await fetch('/api/admin/badges')
      if (!res.ok) throw new Error('Failed to fetch badges')
      return res.json()
    }
  })

  // Organize badges by section (LOGIC PRESERVED VERBATIM)
  const badgesBySection = useMemo(() => {
    if (!data?.badges) return {}

    const organized: Record<string, any[]> = {}

    sections.forEach(section => {
      organized[section.id] = []
    })

    data.badges.forEach((badge: Badge) => {
      let sectionId = badge.category

      // Special handling for accuracy badges
      if (badge.category === 'accuracy') {
        if (badge.family === 'perfect') {
          sectionId = 'accuracy_perfect'
        } else if (badge.family === 'excellent') {
          sectionId = 'accuracy_excellent'
        }
      }

      const section = sections.find(s => s.id === sectionId)
      if (!section) return

      if (section.groupByFamily) {
        // Group by family for lessons, courses, programs
        const familyKey = badge.family || badge.badgeKey
        let familyGroup = organized[sectionId].find((g: any) => g.familyKey === familyKey)
        
        if (!familyGroup) {
          familyGroup = {
            type: 'family',
            familyKey,
            familyName: badge.name,
            icon: badge.icon,
            badges: [],
            totalEarned: 0
          }
          organized[sectionId].push(familyGroup)
        }
        
        familyGroup.badges.push(badge)
        familyGroup.totalEarned += badge.earnedCount
      } else {
        // Individual badges for accuracy, streak, difficulty, special
        organized[sectionId].push({
          type: 'individual',
          badge
        })
      }
    })

    // Sort badges within families
    Object.values(organized).forEach(items => {
      items.forEach(item => {
        if (item.type === 'family' && item.badges) {
          const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
          item.badges.sort((a: Badge, b: Badge) => 
            tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
          )
        }
      })
    })

    return organized
  }, [data?.badges])

  // Filter by search and section (LOGIC PRESERVED VERBATIM)
  const filteredContent = useMemo(() => {
    const filtered: Record<string, any[]> = {}

    Object.entries(badgesBySection).forEach(([sectionId, items]) => {
      if (activeSectionId !== 'all' && sectionId !== activeSectionId) return

      const matchingItems = items.filter(item => {
        if (item.type === 'family') {
          return item.familyName.toLowerCase().includes(searchQuery.toLowerCase())
        } else {
          return item.badge.name.toLowerCase().includes(searchQuery.toLowerCase())
        }
      })

      if (matchingItems.length > 0) {
        filtered[sectionId] = matchingItems
      }
    })

    return filtered
  }, [badgesBySection, searchQuery, activeSectionId])

  if (isLoading) {
    return (
      <div className="p-8 bg-[var(--surface)] min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-10 bg-[var(--surface-hover)] rounded w-48"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-24 bg-[var(--surface-hover)] rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <div className="h-8 bg-[var(--surface-hover)] rounded w-64 mb-4"></div>
                <div className="grid grid-cols-6 gap-8">
                  {[1, 2, 3, 4, 5, 6].map(j => (
                    <div key={j} className="h-48 bg-[var(--surface-hover)] rounded-lg"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-8 bg-[var(--surface)] min-h-screen flex items-center justify-center">
        <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--danger-light)] p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-[var(--danger-dark)] mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Failed to load badges</h3>
          <button
            onClick={() => refetch()}
            className="mt-4 px-6 py-2 bg-[var(--primary)] text-[var(--text-inverse)] rounded-md hover:bg-[var(--primary-dark)] transition-colors duration-[--transition-base]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const { badges, stats } = data
  const totalBadges = badges.length

  return (
    <div className="p-8 bg-[var(--surface)] min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
          <Trophy className="w-8 h-8 text-[var(--highlight-dark)]" />
          Badge Management
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Manage {totalBadges} badges across all categories
        </p>
      </div>

      {/* Compact Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Badges</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{totalBadges}</p>
            </div>
            <div className="p-4 bg-[var(--primary-surface)] rounded-lg">
              <Award className="w-8 h-8 text-[var(--primary)]" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total Awards Given</p>
              <p className="text-3xl font-bold text-[var(--text-primary)]">{stats.totalAwards.toLocaleString()}</p>
              <p className="text-sm text-[var(--text-muted)] mt-1">to {stats.totalUsers.toLocaleString()} users</p>
            </div>
            <div className="p-4 bg-[var(--success-light)] rounded-lg">
              <Users className="w-8 h-8 text-[var(--success-dark)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="bg-[var(--background)] rounded-lg shadow-sm border border-[var(--border)] p-6 mb-8 space-y-4">
        {/* Search Bar */}
        <div className="flex items-center px-3 py-3 border border-[var(--border)] rounded-lg focus-within:ring-2 focus-within:ring-[var(--primary-light)] focus-within:border-transparent">
          <Search className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
          <input
            type="text"
            placeholder="Search badges by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full ml-3 bg-transparent outline-none text-base placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveSectionId('all')}
            className={`px-4 py-2 rounded-full font-medium transition-all ${
              activeSectionId === 'all'
                ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg'
                : 'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
            }`}
          >
            All Badges
          </button>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSectionId(section.id)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                activeSectionId === section.id
                  ? 'bg-[var(--primary)] text-[var(--text-inverse)] shadow-lg'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Badge Sections - COMPLETE LOGIC PRESERVED */}
      <div className="space-y-16">
        {sections.map(section => {
          const sectionContent = filteredContent[section.id]
          if (!sectionContent || sectionContent.length === 0) return null

          const SectionIcon = section.icon

          return (
            <div key={section.id} className="space-y-8">
              {/* Section Header */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] shadow-lg">
                  <SectionIcon className="w-7 h-7 text-[var(--text-inverse)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">{section.title}</h2>
                  <p className="text-sm text-[var(--text-secondary)]">{section.description}</p>
                </div>
              </div>

              {/* Badges Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
                {sectionContent.map((item, idx) => {
                  if (item.type === 'family') {
                    // Family card for lessons, courses, programs
                    const IconComponent = iconMap[item.icon] || Award
                    const colorScheme = getBadgeColorScheme(item.familyName, item.badges[0].tier)

                    return (
                      <div key={item.familyKey} className="flex flex-col items-center text-center space-y-3">
                        {/* Large Icon */}
                        <div 
                          className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${colorScheme} shadow-xl flex items-center justify-center transform transition-transform hover:scale-110 cursor-pointer`}
                          onClick={() => setSelectedBadgeId(item.badges[0].id)}
                        >
                          <IconComponent className="w-16 h-16 text-white" />
                        </div>

                        {/* Name */}
                        <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                          {item.familyName}
                        </h3>

                        {/* Description */}
                        {item.badges[0].description && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            {item.badges[0].description}
                          </p>
                        )}

                        {/* Requirements */}
                        <div className="w-full py-2 px-3 bg-[var(--surface)] rounded-lg">
                          <p className="text-sm font-bold">
                            {item.badges.map((badge: Badge, index: number) => {
                              const tierColor = tierTextColors[badge.tier as keyof typeof tierTextColors]
                              return (
                                <span key={badge.id}>
                                  <span className={tierColor}>
                                    {badge.requirement}
                                  </span>
                                  {index < item.badges.length - 1 && (
                                    <span className="text-[var(--text-muted)] mx-1">→</span>
                                  )}
                                </span>
                              )
                            })}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            {section.id === 'lesson' && 'lessons'}
                            {section.id === 'course' && 'courses'}
                            {section.id === 'program' && 'programs'}
                          </p>
                        </div>

                        {/* Tier Medals */}
                        <div className="flex items-center justify-center gap-2">
                          {item.badges.map((badge: Badge) => (
                            <button
                              key={badge.id}
                              onClick={() => setSelectedBadgeId(badge.id)}
                              className="flex flex-col items-center group"
                              title={`${badge.tier} - ${badge.earnedCount} users`}
                            >
                              <span className={`text-2xl transition-transform group-hover:scale-125 ${
                                badge.earnedCount === 0 ? 'opacity-30 grayscale' : ''
                              }`}>
                                {tierEmojis[badge.tier as keyof typeof tierEmojis]}
                              </span>
                              {badge.earnedCount > 0 && (
                                <span className="text-xs font-bold text-[var(--text-primary)] mt-1">
                                  {badge.earnedCount}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Total */}
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Users className="w-3 h-3" />
                          <span className="font-semibold text-[var(--text-primary)]">{item.totalEarned}</span>
                          <span>earned</span>
                        </div>
                      </div>
                    )
                  } else {
                    // Individual badge for accuracy, streak, etc
                    const badge = item.badge
                    const IconComponent = iconMap[badge.icon] || Award
                    const colorScheme = getBadgeColorScheme(badge.name, badge.tier)
                    const tierEmoji = tierEmojis[badge.tier as keyof typeof tierEmojis]
                    const tierColor = tierTextColors[badge.tier as keyof typeof tierTextColors]
                    const tierBg = tierBgColors[badge.tier as keyof typeof tierBgColors]
                    
                    // Check if it's a special badge
                    const specialReq = getSpecialBadgeRequirement(badge.badgeKey)

                    return (
                      <div key={badge.id} className="flex flex-col items-center text-center space-y-3">
                        {/* Large Icon with Tier Emoji */}
                        <div 
                          className="relative cursor-pointer"
                          onClick={() => setSelectedBadgeId(badge.id)}
                        >
                          <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${colorScheme} shadow-xl flex items-center justify-center transform transition-transform hover:scale-110`}>
                            <IconComponent className="w-16 h-16 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 text-3xl">
                            {tierEmoji}
                          </div>
                        </div>

                        {/* Name */}
                        <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                          {badge.name}
                        </h3>

                        {/* Description */}
                        {badge.description && (
                          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                            {badge.description}
                          </p>
                        )}

                        {/* Requirement */}
                        <div className={`w-full py-2 px-3 ${tierBg} rounded-lg`}>
                          {specialReq ? (
                            <>
                              <p className={`text-sm font-bold ${tierColor}`}>
                                {specialReq.number}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                {specialReq.text}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className={`text-sm font-bold ${tierColor}`}>
                                {badge.requirement}
                              </p>
                              <p className="text-xs text-[var(--text-muted)]">
                                {section.id === 'accuracy_perfect' && 'perfect scores'}
                                {section.id === 'accuracy_excellent' && 'excellent scores'}
                                {section.id === 'difficulty' && 'advanced lessons'}
                                {section.id === 'streak' && 'days streak'}
                              </p>
                            </>
                          )}
                        </div>

                        {/* Earned Count */}
                        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Users className="w-3 h-3" />
                          <span className="font-semibold text-[var(--text-primary)]">{badge.earnedCount}</span>
                          <span>earned</span>
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* No Results */}
      {Object.keys(filteredContent).length === 0 && (
        <div className="text-center py-16">
          <Award className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">No badges found</h3>
          <p className="text-[var(--text-secondary)]">Try adjusting your search or category filter</p>
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