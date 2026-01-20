// components/learner/gamification/LevelProgress.tsx
'use client'

import React from 'react'

// Simple className merge utility
function cn(...inputs: (string | boolean | undefined | null)[]): string {
  return inputs.filter((x): x is string => typeof x === 'string' && x.length > 0).join(' ')
}

type LevelTier = 'novice' | 'practitioner' | 'professional' | 'expert' | 'leader' | 'master'

interface LevelProgressProps {
  currentXp: number
  level: number
  showDetails?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Level tier configuration
const levelTiers = {
  novice: {
    name: 'Safety Novice',
    range: [1, 5],
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-500',
    text: 'text-green-600',
    lightBg: 'bg-green-100'
  },
  practitioner: {
    name: 'Safety Practitioner',
    range: [6, 10],
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-100'
  },
  professional: {
    name: 'Safety Professional',
    range: [11, 15],
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    lightBg: 'bg-purple-100'
  },
  expert: {
    name: 'Safety Expert',
    range: [16, 20],
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    lightBg: 'bg-amber-100'
  },
  leader: {
    name: 'Safety Leader',
    range: [21, 25],
    gradient: 'from-red-600 to-red-700',
    bg: 'bg-red-600',
    text: 'text-red-600',
    lightBg: 'bg-red-100'
  },
  master: {
    name: 'Safety Master',
    range: [26, Infinity],
    gradient: 'from-purple-500 via-pink-500 to-amber-500',
    bg: 'bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500',
    lightBg: 'bg-purple-100'
  }
}

function getLevelTierKey(level: number): LevelTier {
  if (level >= 26) return 'master'
  if (level >= 21) return 'leader'
  if (level >= 16) return 'expert'
  if (level >= 11) return 'professional'
  if (level >= 6) return 'practitioner'
  return 'novice'
}

function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1
}

function xpForLevel(level: number): number {
  return (level - 1) * 1000
}

function getLevelProgress(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp)
  const xpAtCurrentLevel = xpForLevel(currentLevel)
  const xpToNext = 1000
  const progressXp = currentXp - xpAtCurrentLevel
  return Math.min(100, (progressXp / xpToNext) * 100)
}

function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp)
  const xpForNext = xpForLevel(currentLevel + 1)
  return xpForNext - currentXp
}

export default function LevelProgress({
  currentXp,
  level,
  showDetails = true,
  size = 'md',
  className
}: LevelProgressProps) {
  const tierKey = getLevelTierKey(level)
  const tier = levelTiers[tierKey]
  const progress = getLevelProgress(currentXp)
  const xpNeeded = xpToNextLevel(currentXp)
  const xpInLevel = currentXp - xpForLevel(level)

  const sizeClasses = {
    sm: {
      container: 'p-3',
      levelBadge: 'w-10 h-10 text-lg',
      title: 'text-sm',
      bar: 'h-2',
      text: 'text-xs'
    },
    md: {
      container: 'p-4',
      levelBadge: 'w-14 h-14 text-xl',
      title: 'text-base',
      bar: 'h-3',
      text: 'text-sm'
    },
    lg: {
      container: 'p-5',
      levelBadge: 'w-16 h-16 text-2xl',
      title: 'text-lg',
      bar: 'h-4',
      text: 'text-base'
    }
  }

  const sizes = sizeClasses[size]
  const isMaster = tierKey === 'master'

  return (
    <div className={cn(
      "bg-white rounded-xl border shadow-sm",
      sizes.container,
      className
    )}>
      <div className="flex items-center gap-4">
        {/* Level Badge */}
        <div className={cn(
          "rounded-full flex items-center justify-center font-bold text-white flex-shrink-0",
          sizes.levelBadge,
          isMaster ? "animate-aurora bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 bg-[length:200%_200%]" : `bg-gradient-to-br ${tier.gradient}`
        )}>
          {level}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="flex items-center justify-between mb-1">
            <h3 className={cn(
              "font-semibold truncate",
              sizes.title,
              isMaster ? tier.text : tier.text
            )}>
              {tier.name}
            </h3>
            {showDetails && (
              <span className={cn("font-medium", sizes.text, tier.text)}>
                Level {level}
              </span>
            )}
          </div>

          {/* Progress Bar */}
          <div className={cn(
            "w-full rounded-full overflow-hidden",
            tier.lightBg,
            sizes.bar
          )}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isMaster 
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500 animate-shimmer-bg bg-[length:200%_100%]"
                  : `bg-gradient-to-r ${tier.gradient}`
              )}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* XP Text */}
          {showDetails && (
            <div className={cn(
              "flex justify-between mt-1 text-gray-500",
              sizes.text
            )}>
              <span>{xpInLevel.toLocaleString()} / 1,000 XP</span>
              <span>{xpNeeded.toLocaleString()} XP to next level</span>
            </div>
          )}
        </div>
      </div>

      {/* Tier Progress (optional) */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className={cn("flex justify-between items-center", sizes.text)}>
            <span className="text-gray-500">Total XP</span>
            <span className="font-bold text-gray-900">
              {currentXp.toLocaleString()} XP
            </span>
          </div>
        </div>
      )}
    </div>
  )
}