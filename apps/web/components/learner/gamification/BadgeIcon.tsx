// components/learner/gamification/BadgeIcon.tsx
'use client'

import React from 'react'
import * as Icons from 'lucide-react'
import { Lock } from 'lucide-react'

// Simple className merge utility that handles arrays
function cn(...inputs: (string | boolean | undefined | null | (string | boolean | undefined | null)[])[]): string {
  return inputs
    .flat()
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' ')
}

const tierColors = {
  bronze: {
    gradient: 'from-amber-600 to-amber-800',
    border: 'border-amber-700',
    shadow: 'shadow-amber-500/30'
  },
  silver: {
    gradient: 'from-gray-300 to-gray-500',
    border: 'border-gray-400',
    shadow: 'shadow-gray-400/30'
  },
  gold: {
    gradient: 'from-yellow-400 to-orange-500',
    border: 'border-yellow-500',
    shadow: 'shadow-yellow-500/40'
  },
  platinum: {
    gradient: 'from-purple-400 to-pink-500',
    border: 'border-purple-500',
    shadow: 'shadow-purple-500/50'
  }
}

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface BadgeIconProps {
  icon: string
  tier: BadgeTier
  earned: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showLock?: boolean
  className?: string
  animate?: boolean
}

export default function BadgeIcon({ 
  icon, 
  tier, 
  earned, 
  size = 'md', 
  showLock = true,
  className = '',
  animate = false
}: BadgeIconProps) {
  // Get the icon component dynamically
  const IconComponent = (Icons as any)[icon] || Icons.Award
  
  const sizeClasses = {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-28 h-28'
  }
  
  const iconSizes = {
    xs: 14,
    sm: 18,
    md: 24,
    lg: 36,
    xl: 48
  }

  const borderWidths = {
    xs: 'border-2',
    sm: 'border-2',
    md: 'border-4',
    lg: 'border-4',
    xl: 'border-[6px]'
  }

  const lockSizes = {
    xs: 8,
    sm: 10,
    md: 12,
    lg: 16,
    xl: 20
  }

  const colors = tierColors[tier]

  const earnedClasses = `bg-gradient-to-br ${colors.gradient} ${colors.border} shadow-lg ${colors.shadow} hover:scale-110`
  const unearnedClasses = 'bg-gray-200 border-gray-300 grayscale opacity-50'

  return (
    <div className={cn('relative group', className)}>
      {/* Badge Circle */}
      <div className={cn(
        sizeClasses[size],
        borderWidths[size],
        'rounded-full flex items-center justify-center transition-all duration-300',
        earned ? earnedClasses : unearnedClasses,
        animate && earned && tier === 'platinum' && 'animate-pulse'
      )}>
        <IconComponent 
          size={iconSizes[size]} 
          className={earned ? 'text-white' : 'text-gray-400'} 
        />
      </div>
      
      {/* Lock Overlay */}
      {!earned && showLock && (
        <div className="absolute -bottom-1 -right-1 bg-gray-500 rounded-full p-1 shadow">
          <Lock size={lockSizes[size]} className="text-white" />
        </div>
      )}

      {/* Hover glow effect for earned badges */}
      {earned && (
        <div className={cn(
          'absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity',
          `bg-gradient-to-br ${colors.gradient}`,
          'blur-md -z-10'
        )} />
      )}
    </div>
  )
}