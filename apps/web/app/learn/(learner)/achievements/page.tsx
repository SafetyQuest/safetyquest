'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Trophy,
  Award,
  Lock,
  Star,
  TrendingUp,
  Zap,
  BookOpen,
  Compass,
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
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { LevelProgress } from '@/components/learner/gamification'

// Icon mapper
const iconMap: Record<string, any> = {
  BookOpen, Compass, Star, Footprints, Sword, Crown,
  GraduationCap, Shield, Trophy, Castle, Gem, Medal,
  Award, Sparkles, Target, Crosshair, TrendingUp,
  BarChart, Brain, Mountain, Flag, Flame, Calendar,
  Clock, Rocket, CheckCircle2, ShieldCheck, Zap, CheckCircle
}

// Color schemes based on badge names/vibe (same as admin page)
const getBadgeColorScheme = (badgeName: string, tier: string) => {
  const name = badgeName.toLowerCase()
  
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
  
  if (tier === 'platinum') return 'from-purple-500 to-pink-600'
  if (tier === 'gold') return 'from-yellow-500 to-orange-500'
  if (tier === 'silver') return 'from-gray-400 to-gray-600'
  return 'from-amber-600 to-orange-700'
}

const tierBorderColors = {
  bronze: 'from-amber-600 to-amber-800',
  silver: 'from-gray-400 to-gray-600',
  gold: 'from-yellow-400 to-orange-500',
  platinum: 'from-purple-500 to-pink-600'
}

const tierGlowColors = {
  bronze: 'shadow-amber-500/50',
  silver: 'shadow-gray-400/50',
  gold: 'shadow-yellow-500/60',
  platinum: 'shadow-purple-500/70'
}

const tierShimmerColors = {
  bronze:    'rgba(255, 200, 100, 0.85)',
  silver:    'rgba(200, 210, 220, 0.80)',
  gold:      'rgba(255, 220, 100, 0.90)',
  platinum:  'rgba(220, 150, 255, 0.85)'
}

const tierDotColors = {
  bronze: 'bg-amber-600',
  silver: 'bg-gray-500',
  gold: 'bg-yellow-500',
  platinum: 'bg-purple-500'
}

const tierLabels = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum'
}

const tierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎'
}

const progressLabels: Record<string, string> = {
  lesson: 'Lessons',
  course: 'Courses',
  program: 'Programs'
}

// Sections — matches admin exactly
const sections = [
  {
    id: 'lesson',
    title: 'Lesson Milestones',
    description: 'Earned by completing lessons',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-600',
    groupByFamily: true
  },
  {
    id: 'course',
    title: 'Course Milestones',
    description: 'Earned by completing courses',
    icon: GraduationCap,
    color: 'from-green-500 to-emerald-600',
    groupByFamily: true
  },
  {
    id: 'program',
    title: 'Program Milestones',
    description: 'Earned by completing programs',
    icon: Trophy,
    color: 'from-purple-500 to-violet-600',
    groupByFamily: true
  },
  {
    id: 'accuracy_perfect',
    title: 'Accuracy - Perfect Scores (100%)',
    description: 'Earned by achieving perfect quiz scores',
    icon: Target,
    color: 'from-pink-500 to-rose-600',
    groupByFamily: false
  },
  {
    id: 'accuracy_excellent',
    title: 'Accuracy - Excellent Scores (90%+)',
    description: 'Earned by achieving excellent quiz scores',
    icon: TrendingUp,
    color: 'from-green-500 to-emerald-600',
    groupByFamily: false
  },
  {
    id: 'difficulty',
    title: 'Difficulty Challenges',
    description: 'Earned by completing advanced difficulty lessons',
    icon: Mountain,
    color: 'from-red-500 to-orange-600',
    groupByFamily: false
  },
  {
    id: 'streak',
    title: 'Streak Rewards',
    description: 'Earned by maintaining consecutive learning days',
    icon: Flame,
    color: 'from-orange-500 to-red-600',
    groupByFamily: false
  },
  {
    id: 'special',
    title: 'Special Achievements',
    description: 'Rare badges for exceptional accomplishments',
    icon: Sparkles,
    color: 'from-yellow-400 to-pink-500',
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
  earned: boolean
  awardedAt: Date | null
}

// Helper: map flat badges to grouped families (like admin)
function groupBadgesBySection(badges: Badge[]) {
  const grouped: Record<string, any[]> = {}

  sections.forEach(section => {
    grouped[section.id] = []
  })

  badges.forEach(badge => {
    let sectionId = badge.category

    // Special handling for accuracy badges (match admin)
    if (badge.category === 'accuracy') {
      if (badge.family === 'perfect') {
        sectionId = 'accuracy_perfect'
      } else if (badge.family === 'excellent') {
        sectionId = 'accuracy_excellent'
      } else {
        return // skip unknown accuracy types
      }
    }

    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    if (section.groupByFamily) {
      const familyKey = badge.family || badge.badgeKey
      let familyGroup = grouped[sectionId].find((g: any) => g.familyKey === familyKey)
      
      if (!familyGroup) {
        familyGroup = {
          type: 'family',
          familyKey,
          familyName: badge.name,
          icon: badge.icon,
          category: sectionId,
          badges: [],
          earnedCount: 0,
          highestEarnedTier: null,
          nextTierBadge: null,
          currentProgress: 0
        }
        grouped[sectionId].push(familyGroup)
      }
      
      familyGroup.badges.push(badge)
      if (badge.earned) {
        familyGroup.earnedCount += 1
      }
    } else {
      // Individual badge
      grouped[sectionId].push({
        type: 'individual',
        badge
      })
    }
  })

  // Sort tiers within families
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
  Object.values(grouped).forEach(items => {
    items.forEach(item => {
      if (item.type === 'family' && item.badges) {
        item.badges.sort((a: Badge, b: Badge) => 
          tierOrder.indexOf(a.tier) - tierOrder.indexOf(b.tier)
        )
      }
    })
  })

  return grouped
}

// Compute progression for a family (only for groupByFamily = true)
function computeFamilyProgress(family: any) {
  const earnedTiers = new Set(family.badges.filter((b: Badge) => b.earned).map((b: Badge) => b.tier))
  const tierOrder = ['bronze', 'silver', 'gold', 'platinum']
  let highestIndex = -1

  tierOrder.forEach((tier, idx) => {
    if (earnedTiers.has(tier)) highestIndex = idx
  })

  const highestTier = highestIndex >= 0 ? tierOrder[highestIndex] : null
  const nextTierBadge = highestIndex < 3 ? family.badges[highestIndex + 1] : null
  const currentProgress = highestIndex >= 0 
    ? family.badges[highestIndex].requirement 
    : 0

  return {
    earnedCount: earnedTiers.size,
    highestEarnedTier: highestTier,
    nextTierBadge,
    currentProgress
  }
}

export default function AchievementsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['learner-achievements'],
    queryFn: async () => {
      const res = await fetch('/api/learner/achievements')
      if (!res.ok) throw new Error('Failed to fetch achievements')
      return res.json()
    }
  })

  // Group and enrich badges like admin does
  const familiesBySection = useMemo(() => {
    if (!data?.badges) return {}
    
    const grouped = groupBadgesBySection(data.badges)
    
    // Enrich families with progress
    Object.entries(grouped).forEach(([sectionId, items]) => {
      const section = sections.find(s => s.id === sectionId)
      if (!section?.groupByFamily) return

      items.forEach((item: any) => {
        if (item.type === 'family') {
          const progress = computeFamilyProgress(item)
          Object.assign(item, progress)
        }
      })
    })
    
    return grouped
  }, [data?.badges])

  const filteredSections = useMemo(() => {
    if (selectedCategory === 'all') return familiesBySection
    
    return {
      [selectedCategory]: familiesBySection[selectedCategory] || []
    }
  }, [familiesBySection, selectedCategory])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to load achievements
            </h3>
            <p className="text-gray-600">Please try refreshing the page</p>
          </div>
        </div>
      </div>
    )
  }

  const { user } = data
  const completionPercentage = Math.round((user.earnedBadgesCount / user.totalBadges) * 100)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <style jsx global>{`
        @keyframes shimmer-sweep {
          0% { transform: translateX(-150%) translateY(-150%) rotate(30deg); }
          100% { transform: translateX(150%) translateY(150%) rotate(30deg); }
        }
        .animate-shimmer-sweep { animation: shimmer-sweep 2.5s ease-in-out infinite; }
      `}</style>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your Achievements</h1>
          <p className="text-lg text-gray-600">Track your learning journey and unlock amazing badges!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <LevelProgress currentXp={user.xp} level={user.level} showDetails={true} size="lg" />
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6">
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-200" />
                  <circle cx="64" cy="64" r="56" stroke="url(#gradient)" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - completionPercentage / 100)}`}
                    className="transition-all duration-1000" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{completionPercentage}%</span>
                  <span className="text-xs text-gray-500">Complete</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-purple-600">{user.earnedBadgesCount}</span> of{' '}
                <span className="font-bold">{user.totalBadges}</span> badges earned
              </p>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-white rounded-xl shadow-lg border p-6">
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setSelectedCategory('all')} className={`px-6 py-3 rounded-xl font-semibold transition-all ${selectedCategory === 'all' ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              All Achievements
            </button>
            {sections.map(section => (
              <button key={section.id} onClick={() => setSelectedCategory(section.id)} className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${selectedCategory === section.id ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <section.icon className="w-5 h-5" />{section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Badge Sections */}
        <div className="space-y-12">
          {sections.map(section => {
            const sectionFamilies = filteredSections[section.id]
            if (!sectionFamilies || sectionFamilies.length === 0) return null

            const SectionIcon = section.icon
            return (
              <div key={section.id} className="space-y-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${section.color} shadow-xl`}>
                    <SectionIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{section.title}</h2>
                    <p className="text-gray-600 mt-1">{section.description}</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {sectionFamilies.filter(f => f.type === 'family' ? f.earnedCount > 0 : f.badge.earned).length} of {sectionFamilies.length} unlocked
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                  {sectionFamilies.map(item => {
                    const isFamily = item.type === 'family'
                    const family = isFamily ? item : null
                    const badge = !isFamily ? item.badge : null

                    // 🔹 Use section.id as displayCategory for UI logic
                    const displayCategory = sections.find(s => s.id === section.id)?.id || badge.category;

                    const renderData = isFamily ? family : {
                      familyKey: badge.id,
                      familyName: badge.name,
                      icon: badge.icon,
                      category: badge.category,
                      displayCategory, // ← critical fix for accuracy badges
                      badges: [{ ...badge, earned: badge.earned }],
                      earnedCount: badge.earned ? 1 : 0,
                      highestEarnedTier: badge.earned ? badge.tier : null,
                      nextTierBadge: null,
                      currentProgress: 0
                    }

                    const IconComponent = iconMap[renderData.icon] || Award
                    const highestTier = renderData.highestEarnedTier || 'bronze'
                    const isEarned = renderData.earnedCount > 0
                    const tierBorder = tierBorderColors[highestTier as keyof typeof tierBorderColors]
                    const tierGlow = tierGlowColors[highestTier as keyof typeof tierGlowColors]
                    const iconColorScheme = isEarned 
                      ? getBadgeColorScheme(renderData.familyName, highestTier)
                      : 'from-gray-400 to-gray-500'

                    const isTrueTieredFamily = isFamily && sections.find(s => s.id === renderData.category)?.groupByFamily

                    // --- Requirement/Condition Logic ---
                    const mainBadge = renderData.badges[0]
                    let requirementText = ''
                    let requirementNumber = ''

                    // Special badges
                    if (mainBadge.badgeKey === 'special_complete') {
                      requirementNumber = 'Complete All'
                      requirementText = 'assigned programs'
                    } else if (mainBadge.badgeKey === 'special_certified') {
                      requirementNumber = 'Get 90%+ Average Score'
                      requirementText = 'across all programs'
                    } 
                    // Regular non-tiered badges
                    else if (!isTrueTieredFamily) {
                      requirementNumber = String(mainBadge.requirement)
                      if (renderData.displayCategory === 'accuracy_perfect') {
                        requirementText = 'perfect score quizzes to unlock'
                      } else if (renderData.displayCategory === 'accuracy_excellent') {
                        requirementText = 'excellent score quizzes (90%+ scores) to unlock'
                      } else if (renderData.displayCategory === 'difficulty') {
                        requirementText = 'advanced difficulty lessons to unlock'
                      } else if (renderData.displayCategory === 'streak') {
                        requirementText = 'consecutive learning days to unlock'
                      } else if (renderData.displayCategory === 'special') {
                        requirementText = 'exceptional accomplishment'
                      }
                    }

                    return (
                      <div key={renderData.familyKey} className="group relative flex flex-col items-center">
                        <div className="relative mb-4 z-0">
                          {isEarned && (
                            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tierBorder} blur-xl opacity-40 animate-pulse`} />
                          )}
                          <div className={`relative w-32 h-32 rounded-full p-2 ${isEarned ? `bg-gradient-to-br ${tierBorder} ${tierGlow} shadow-2xl` : 'bg-gray-300'}`}>
                            <div className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden ${isEarned ? `bg-gradient-to-br ${iconColorScheme}` : 'bg-gray-200'}`}>
                              {isEarned && (
                                <div className="absolute inset-0 overflow-hidden" style={{ borderRadius: '9999px', '--shimmer-color': tierShimmerColors[highestTier as keyof typeof tierShimmerColors] || 'rgba(255,255,255,0.95)' } as React.CSSProperties}>
                                  <div className="w-[200%] h-[200%] absolute -left-1/2 -top-1/2 animate-shimmer-sweep" style={{ background: 'linear-gradient(120deg, transparent 40%, var(--shimmer-color) 50%, transparent 60%)', transformOrigin: 'center center' }} />
                                </div>
                              )}
                              <IconComponent className={`relative z-10 w-16 h-16 transition-all duration-300 ${isEarned ? 'text-white group-hover:scale-110 drop-shadow-lg' : 'text-gray-400'}`} />
                              {!isEarned && (
                                <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-[1px] flex items-center justify-center z-10">
                                  <Lock className="w-8 h-8 text-gray-500" />
                                </div>
                              )}
                            </div>
                          </div>
                          {isEarned && (
                            <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-white shadow-xl flex items-center justify-center border-3 border-white z-20">
                              <span className="text-2xl leading-none">{tierEmojis[highestTier as keyof typeof tierEmojis]}</span>
                            </div>
                          )}
                        </div>

                        <div className="text-center space-y-1.5 w-full">
                          <h3 className={`font-bold text-lg leading-tight px-2 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                            {renderData.familyName}
                          </h3>

                          {isEarned ? (
                            <>
                              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                highestTier === 'platinum' ? 'bg-purple-100 text-purple-700' :
                                highestTier === 'gold' ? 'bg-yellow-100 text-yellow-700' :
                                highestTier === 'silver' ? 'bg-gray-200 text-gray-800' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {tierLabels[highestTier as keyof typeof tierLabels]}
                              </div>

                              {isTrueTieredFamily && renderData.nextTierBadge && highestTier !== 'platinum' ? (
                                <>
                                  <p className="text-sm text-gray-600 mt-1">
                                    Next tier: {tierLabels[renderData.nextTierBadge.tier as keyof typeof tierLabels]}
                                  </p>
                                  {renderData.currentProgress > 0 && (
                                    <div className="mt-2 px-2">
                                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                                          style={{ width: `${Math.min(100, (renderData.currentProgress / renderData.nextTierBadge.requirement) * 100)}%` }} />
                                      </div>
                                      <p className="text-sm text-gray-500 mt-1">
                                        {progressLabels[renderData.category]}: {renderData.currentProgress} / {renderData.nextTierBadge.requirement}
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : null}
                            </>
                          ) : (
                            <>
                              {isTrueTieredFamily && renderData.nextTierBadge ? (
                                <p className="text-sm text-gray-600 font-medium">
                                  {renderData.nextTierBadge.requirement} {progressLabels[renderData.category]} to unlock
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 italic">Locked</p>
                              )}
                              {isTrueTieredFamily && renderData.currentProgress > 0 && renderData.nextTierBadge && (
                                <div className="mt-2 px-2">
                                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 rounded-full"
                                      style={{ width: `${Math.min(100, (renderData.currentProgress / renderData.nextTierBadge.requirement) * 100)}%` }} />
                                  </div>
                                  <p className="text-sm text-gray-500 mt-1">
                                    {progressLabels[renderData.category]}: {renderData.currentProgress} / {renderData.nextTierBadge.requirement}
                                  </p>
                                </div>
                              )}
                            </>
                          )}

                          {/* 🔹 Requirement/Condition Text (for non-tiered badges) */}
                          {!isTrueTieredFamily && (
                            <div className="mt-2 px-2 space-y-0.5">
                              {mainBadge.badgeKey === 'special_complete' || mainBadge.badgeKey === 'special_certified' ? (
                                <>
                                  <p className="text-sm font-bold text-gray-900">{requirementNumber}</p>
                                  <p className="text-sm text-gray-600">{requirementText}</p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-600">
                                  {requirementNumber} {requirementText}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Tier dots: colored by tier if earned, else gray */}
                          <div className="flex items-center justify-center gap-1.5 pt-1">
                            {isTrueTieredFamily && (
                              renderData.badges.map((b: Badge) => (
                                <div
                                  key={b.id}
                                  className={`w-2 h-2 rounded-full transition-all ${
                                    b.earned 
                                      ? `${tierDotColors[b.tier as keyof typeof tierDotColors]} shadow-sm` 
                                      : 'bg-gray-300'
                                  }`}
                                  title={`${tierLabels[b.tier as keyof typeof tierLabels]}${b.earned ? ' ✓' : ''}`}
                                />
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {Object.keys(filteredSections).length === 0 && (
          <div className="bg-white rounded-xl shadow-lg border p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No achievements in this category yet</h3>
            <p className="text-gray-600">Keep learning to unlock badges!</p>
          </div>
        )}
      </div>
    </div>
  )
}