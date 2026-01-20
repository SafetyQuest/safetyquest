// components/learner/gamification/BadgeFamilyCard.tsx
'use client'

import React from 'react'
import { CheckCircle, Lock } from 'lucide-react'
import BadgeIcon from './BadgeIcon'

// Simple className merge utility
function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter((x): x is string => typeof x === 'string' && x.length > 0).join(' ')
}

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface Badge {
  id: string
  key: string
  name: string
  description: string | null
  tier: BadgeTier
  icon: string
  requirement: number
  xpBonus: number
}

interface BadgeFamilyCardProps {
  familyName: string
  familyBadges: Badge[]
  earnedBadgeKeys: Set<string>
  currentProgress: number
  icon: string
  onClick?: () => void
}

const tierColors = {
  bronze: { 
    bg: 'bg-amber-500', 
    text: 'text-amber-800', 
    light: 'bg-amber-100',
    ring: 'ring-amber-500'
  },
  silver: { 
    bg: 'bg-gray-400', 
    text: 'text-gray-700', 
    light: 'bg-gray-100',
    ring: 'ring-gray-400'
  },
  gold: { 
    bg: 'bg-yellow-500', 
    text: 'text-yellow-800', 
    light: 'bg-yellow-100',
    ring: 'ring-yellow-500'
  },
  platinum: { 
    bg: 'bg-purple-500', 
    text: 'text-purple-800', 
    light: 'bg-purple-100',
    ring: 'ring-purple-500'
  }
}

const tierLabels: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum'
}

export default function BadgeFamilyCard({
  familyName,
  familyBadges,
  earnedBadgeKeys,
  currentProgress,
  icon,
  onClick
}: BadgeFamilyCardProps) {
  // Sort badges by requirement
  const sortedBadges = [...familyBadges].sort((a, b) => a.requirement - b.requirement)
  
  // Find highest earned tier
  const earnedTiers = sortedBadges.filter(b => earnedBadgeKeys.has(b.key))
  const highestEarned = earnedTiers[earnedTiers.length - 1]
  const nextTier = sortedBadges.find(b => !earnedBadgeKeys.has(b.key))
  
  // Calculate progress
  const progressPercent = nextTier 
    ? Math.min(100, (currentProgress / nextTier.requirement) * 100)
    : 100

  const isComplete = !nextTier

  return (
    <div 
      className={cn(
        "bg-white rounded-xl border shadow-sm hover:shadow-md transition-all p-5",
        onClick && "cursor-pointer",
        isComplete && "ring-2 ring-purple-200"
      )}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <BadgeIcon 
          icon={icon} 
          tier={highestEarned?.tier || 'bronze'} 
          earned={!!highestEarned} 
          size="md"
          showLock={!highestEarned}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg text-gray-900 truncate">{familyName}</h3>
          {highestEarned ? (
            <span className={cn(
              "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
              tierColors[highestEarned.tier].light,
              tierColors[highestEarned.tier].text
            )}>
              {tierLabels[highestEarned.tier]}
            </span>
          ) : (
            <span className="text-sm text-gray-500">Not yet earned</span>
          )}
        </div>
        {isComplete && (
          <div className="flex-shrink-0">
            <CheckCircle className="w-6 h-6 text-green-500" />
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {nextTier && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to {tierLabels[nextTier.tier]}</span>
            <span className="font-medium">{currentProgress}/{nextTier.requirement}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all duration-500",
                tierColors[nextTier.tier].bg
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Complete message */}
      {isComplete && (
        <div className="mb-4 text-center py-2 bg-green-50 rounded-lg">
          <span className="text-sm text-green-700 font-medium">
            ✨ All tiers unlocked!
          </span>
        </div>
      )}

      {/* Tier Pills */}
      <div className="flex gap-1.5">
        {sortedBadges.map((badge) => {
          const earned = earnedBadgeKeys.has(badge.key)
          return (
            <div
              key={badge.key}
              className={cn(
                "flex-1 h-8 rounded-lg flex items-center justify-center",
                "transition-all cursor-default group relative",
                earned 
                  ? `${tierColors[badge.tier].bg} text-white` 
                  : 'bg-gray-100 text-gray-400'
              )}
              title={`${tierLabels[badge.tier]}: ${badge.requirement} required`}
            >
              {earned ? (
                <CheckCircle size={16} />
              ) : (
                <Lock size={14} />
              )}
              
              {/* Tooltip */}
              <div className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                opacity-0 group-hover:opacity-100 transition-opacity
                bg-gray-900 text-white text-xs rounded-lg px-2 py-1
                whitespace-nowrap pointer-events-none z-10
              ">
                {tierLabels[badge.tier]}: {badge.requirement}
                {earned && ` ✓`}
              </div>
            </div>
          )
        })}
      </div>

      {/* XP Info */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>
          {earnedTiers.length}/{sortedBadges.length} tiers
        </span>
        <span>
          +{earnedTiers.reduce((sum, b) => sum + b.xpBonus, 0)} XP earned
        </span>
      </div>
    </div>
  )
}