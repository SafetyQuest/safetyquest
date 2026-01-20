// components/learner/gamification/BadgeUnlockModal.tsx
'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import BadgeIcon from './BadgeIcon'

type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum'

interface Badge {
  id: string
  key: string
  name: string
  description: string | null
  tier: BadgeTier
  icon: string
  xpBonus: number
}

interface BadgeUnlockModalProps {
  badges: Badge[]
  isOpen: boolean
  onClose: () => void
  onViewAll?: () => void
}

const tierLabels: Record<BadgeTier, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum'
}

const tierBgColors: Record<BadgeTier, string> = {
  bronze: 'bg-amber-100 text-amber-800',
  silver: 'bg-gray-100 text-gray-700',
  gold: 'bg-yellow-100 text-yellow-800',
  platinum: 'bg-purple-100 text-purple-800'
}

// Simple confetti implementation without external library
function Confetti() {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    color: string
    delay: number
  }>>([])

  useEffect(() => {
    const colors = ['#FACC15', '#EC4899', '#8B5CF6', '#22C55E', '#3B82F6', '#F97316']
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: particle.color,
            left: `${particle.x}%`,
            top: '-10px'
          }}
          initial={{ y: -10, opacity: 1, rotate: 0 }}
          animate={{ 
            y: 400, 
            opacity: 0,
            rotate: 360,
            x: (Math.random() - 0.5) * 100
          }}
          transition={{ 
            duration: 2,
            delay: particle.delay,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

export default function BadgeUnlockModal({ 
  badges, 
  isOpen, 
  onClose, 
  onViewAll 
}: BadgeUnlockModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  
  // Reset index when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0)
    }
  }, [isOpen])

  if (badges.length === 0) return null

  const currentBadge = badges[currentIndex]
  const hasMore = currentIndex < badges.length - 1
  const totalXp = badges.reduce((sum, b) => sum + b.xpBonus, 0)

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 15 }}
            className="relative bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Confetti */}
            <Confetti />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            {/* Badge counter */}
            {badges.length > 1 && (
              <div className="absolute top-4 left-4 text-sm text-gray-500">
                {currentIndex + 1} / {badges.length}
              </div>
            )}

            {/* Celebration Header */}
            <div className="text-4xl mb-4">🎉</div>
            
            {/* Badge Icon */}
            <motion.div
              key={currentBadge.id}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: 'spring', damping: 10 }}
              className="flex justify-center mb-4"
            >
              <BadgeIcon 
                icon={currentBadge.icon} 
                tier={currentBadge.tier} 
                earned={true} 
                size="xl" 
              />
            </motion.div>

            {/* Badge Title */}
            <motion.div
              key={`info-${currentBadge.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                Badge Unlocked!
              </h2>
              <h3 className="text-xl font-semibold text-blue-600 mb-1">
                {currentBadge.name}
              </h3>
              <span className={`
                inline-block px-3 py-1 rounded-full text-sm font-medium mb-3
                ${tierBgColors[currentBadge.tier]}
              `}>
                {tierLabels[currentBadge.tier]}
              </span>
              {currentBadge.description && (
                <p className="text-gray-600 mb-4">
                  {currentBadge.description}
                </p>
              )}
            </motion.div>

            {/* XP Bonus */}
            {currentBadge.xpBonus > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6"
              >
                <div className="text-3xl font-bold text-yellow-600">
                  +{currentBadge.xpBonus} XP
                </div>
                <div className="text-sm text-yellow-700">Bonus Reward!</div>
              </motion.div>
            )}

            {/* Total XP (if multiple badges) */}
            {badges.length > 1 && currentIndex === badges.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-500 mb-4"
              >
                Total badge XP earned: <span className="font-bold text-yellow-600">+{totalXp} XP</span>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl
                           hover:bg-blue-700 transition-colors font-medium"
              >
                {hasMore ? 'Next Badge' : 'Continue'}
              </button>
              {onViewAll && !hasMore && (
                <button
                  onClick={onViewAll}
                  className="flex-1 px-6 py-3 border-2 border-gray-200 rounded-xl
                             hover:bg-gray-50 transition-colors font-medium"
                >
                  View All
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}