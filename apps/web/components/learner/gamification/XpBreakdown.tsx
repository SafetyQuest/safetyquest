// components/learner/gamification/XpBreakdown.tsx
'use client'

import React from 'react'
import { 
  Zap, 
  Target, 
  TrendingUp, 
  Award,
  ChevronRight,
  Star
} from 'lucide-react'

// Simple className merge utility
function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter((x): x is string => typeof x === 'string' && x.length > 0).join(' ')
}

interface XpBreakdownProps {
  breakdown: {
    base: number
    difficultyMultiplier: number
    levelMultiplier: number
    performanceBonus: number
    performanceLabel: string
    lessonXp: number
    badgeXp: number
    totalXp: number
  }
  showFormula?: boolean
  compact?: boolean
  className?: string
}

export default function XpBreakdown({
  breakdown,
  showFormula = false,
  compact = false,
  className
}: XpBreakdownProps) {
  const {
    base,
    difficultyMultiplier,
    levelMultiplier,
    performanceBonus,
    performanceLabel,
    lessonXp,
    badgeXp,
    totalXp
  } = breakdown

  const getDifficultyLabel = (multiplier: number): string => {
    if (multiplier >= 2.0) return 'Advanced'
    if (multiplier >= 1.5) return 'Intermediate'
    return 'Beginner'
  }

  const getDifficultyColor = (multiplier: number): string => {
    if (multiplier >= 2.0) return 'text-red-600 bg-red-50'
    if (multiplier >= 1.5) return 'text-amber-600 bg-amber-50'
    return 'text-green-600 bg-green-50'
  }

  const getPerformanceColor = (label: string): string => {
    switch (label) {
      case 'Perfect!': return 'text-purple-600 bg-purple-50'
      case 'Excellent': return 'text-green-600 bg-green-50'
      case 'Good': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 text-sm",
        className
      )}>
        <Zap className="w-4 h-4 text-yellow-500" />
        <span className="font-bold text-yellow-600">+{totalXp} XP</span>
        {badgeXp > 0 && (
          <span className="text-purple-600 text-xs">
            (includes +{badgeXp} badge bonus)
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border border-yellow-200 p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold text-gray-900">XP Earned</span>
        </div>
        <div className="text-2xl font-bold text-yellow-600">
          +{totalXp} XP
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-2">
        {/* Base XP */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Target className="w-4 h-4" />
            <span>Base XP</span>
          </div>
          <span className="font-medium">{base}</span>
        </div>

        {/* Difficulty Multiplier */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span>Difficulty</span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              getDifficultyColor(difficultyMultiplier)
            )}>
              {getDifficultyLabel(difficultyMultiplier)}
            </span>
          </div>
          <span className="font-medium">×{difficultyMultiplier}</span>
        </div>

        {/* Level Multiplier */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Star className="w-4 h-4" />
            <span>Level Bonus</span>
          </div>
          <span className="font-medium">×{levelMultiplier}</span>
        </div>

        {/* Performance Bonus */}
        {performanceBonus > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Award className="w-4 h-4" />
              <span>Performance</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-full",
                getPerformanceColor(performanceLabel)
              )}>
                {performanceLabel}
              </span>
            </div>
            <span className="font-medium text-green-600">+{performanceBonus}</span>
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-yellow-200 my-2" />

        {/* Lesson XP Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Lesson XP</span>
          <span className="font-medium">{lessonXp}</span>
        </div>

        {/* Badge Bonus */}
        {badgeXp > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-purple-600">
              <Award className="w-4 h-4" />
              <span>Badge Bonus</span>
            </div>
            <span className="font-medium text-purple-600">+{badgeXp}</span>
          </div>
        )}
      </div>

      {/* Formula (optional) */}
      {showFormula && (
        <div className="mt-4 pt-3 border-t border-yellow-200">
          <div className="text-xs text-gray-500 font-mono bg-white/50 rounded p-2">
            ({base} × {difficultyMultiplier} × {levelMultiplier}) + {performanceBonus}
            {badgeXp > 0 && ` + ${badgeXp}`} = {totalXp}
          </div>
        </div>
      )}
    </div>
  )
}

// Simple inline version for use in result cards
export function XpBadge({ 
  xp, 
  className 
}: { 
  xp: number
  className?: string 
}) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-3 py-1 rounded-full",
      "bg-gradient-to-r from-yellow-100 to-amber-100",
      "border border-yellow-300",
      "text-yellow-700 font-bold",
      className
    )}>
      <Zap className="w-4 h-4" />
      +{xp} XP
    </div>
  )
}