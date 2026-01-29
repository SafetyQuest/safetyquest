// apps/web/components/learner/shared/QuizCelebrationModal.tsx
// ✅ UPDATED: Matches achievements page style with shimmer effects

'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  Trophy, Award, Star, BookOpen, Compass, Footprints, Sword, Crown,
  GraduationCap, Shield, Castle, Gem, Medal, Sparkles, Target, Crosshair,
  TrendingUp, BarChart, Brain, Mountain, Flag, Flame, Calendar, Clock,
  Rocket, CheckCircle2, ShieldCheck, Zap, CheckCircle
} from 'lucide-react'

interface Badge {
  id: string
  badgeKey: string
  name: string
  tier: string
  icon: string
  xpBonus: number
  category: string
  family: string | null
  description: string | null
}

interface LevelInfo {
  previous: number
  current: number
  leveledUp: boolean
  totalXp: number
}

interface QuizCelebrationModalProps {
  isOpen: boolean
  newBadges: Badge[]
  levelInfo: LevelInfo
  onClose: () => void
}

// Icon mapper (same as achievements page)
const iconMap: Record<string, any> = {
  BookOpen, Compass, Star, Footprints, Sword, Crown,
  GraduationCap, Shield, Trophy, Castle, Gem, Medal,
  Award, Sparkles, Target, Crosshair, TrendingUp,
  BarChart, Brain, Mountain, Flag, Flame, Calendar,
  Clock, Rocket, CheckCircle2, ShieldCheck, Zap, CheckCircle
}

// Color schemes (same as achievements page)
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

const tierShimmerColors = {
  bronze:    'rgba(255, 200, 100, 0.85)',
  silver:    'rgba(200, 210, 220, 0.80)',
  gold:      'rgba(255, 220, 100, 0.90)',
  platinum:  'rgba(220, 150, 255, 0.85)'
}

const tierEmojis = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎'
}

const tierLabels = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  platinum: 'Platinum'
}

export default function QuizCelebrationModal({
  isOpen,
  newBadges,
  levelInfo,
  onClose
}: QuizCelebrationModalProps) {
  const [step, setStep] = useState<'badges' | 'levelup'>('badges')
  
  const hasBadges = newBadges.length > 0
  const hasLevelUp = levelInfo.leveledUp

  useEffect(() => {
    if (isOpen) {
      if (hasBadges) {
        setStep('badges')
      } else if (hasLevelUp) {
        setStep('levelup')
      }

      if (hasBadges) {
        setTimeout(() => {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#F59E0B', '#8B5CF6', '#EC4899', '#FACC15'],
          })
        }, 300)
      }
    }
  }, [isOpen, hasBadges, hasLevelUp])

  const handleNext = () => {
    if (step === 'badges' && hasLevelUp) {
      setStep('levelup')
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.5 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        })
      }, 300)
    } else {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Shimmer animation keyframes */}
          <style jsx global>{`
            @keyframes shimmer-sweep {
              0% { transform: translateX(-150%) translateY(-150%) rotate(30deg); }
              100% { transform: translateX(150%) translateY(150%) rotate(30deg); }
            }
            .animate-shimmer-sweep { animation: shimmer-sweep 2.5s ease-in-out infinite; }
          `}</style>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
            }}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="max-w-2xl w-full pointer-events-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="rounded-2xl shadow-2xl p-8 md:p-12 relative max-h-[90vh] flex flex-col"
                style={{
                  background: 'var(--background)',
                  border: '3px solid var(--highlight)',
                }}
              >
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--border)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)'
                  }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {step === 'badges' && hasBadges && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200 }}
                      className="text-center mb-8"
                    >
                      <div className="text-6xl mb-4">🏆</div>
                      <h2 
                        className="text-3xl md:text-4xl font-bold mb-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        New Badges Earned!
                      </h2>
                      <p 
                        className="text-lg"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        You've unlocked {newBadges.length} {newBadges.length === 1 ? 'badge' : 'badges'}
                      </p>
                    </motion.div>

                    <div className="space-y-6 mb-8 overflow-y-auto flex-1" style={{ maxHeight: 'calc(90vh - 400px)', minHeight: '200px' }}>
                      {newBadges.map((badge, index) => {
                        const IconComponent = iconMap[badge.icon] || Award
                        const tier = badge.tier.toLowerCase()
                        const tierBorder = tierBorderColors[tier as keyof typeof tierBorderColors]
                        const iconColorScheme = getBadgeColorScheme(badge.name, tier)
                        
                        return (
                          <motion.div
                            key={badge.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex items-center gap-6 p-6 rounded-xl"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                            }}
                          >
                            {/* Badge Icon with Shimmer */}
                            <div className="relative flex-shrink-0">
                              {/* Glow effect */}
                              <div 
                                className={`absolute inset-0 rounded-full bg-gradient-to-br ${tierBorder} blur-xl opacity-40 animate-pulse`}
                              />
                              
                              {/* Badge circle */}
                              <div 
                                className={`relative w-20 h-20 rounded-full p-1 bg-gradient-to-br ${tierBorder} shadow-2xl`}
                              >
                                <div 
                                  className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden bg-gradient-to-br ${iconColorScheme}`}
                                >
                                  {/* Shimmer animation */}
                                  <div 
                                    className="absolute inset-0 overflow-hidden" 
                                    style={{ 
                                      borderRadius: '9999px',
                                      '--shimmer-color': tierShimmerColors[tier as keyof typeof tierShimmerColors] || 'rgba(255,255,255,0.95)'
                                    } as React.CSSProperties}
                                  >
                                    <div 
                                      className="w-[200%] h-[200%] absolute -left-1/2 -top-1/2 animate-shimmer-sweep" 
                                      style={{ 
                                        background: 'linear-gradient(120deg, transparent 40%, var(--shimmer-color) 50%, transparent 60%)',
                                        transformOrigin: 'center center'
                                      }}
                                    />
                                  </div>
                                  
                                  {/* Icon */}
                                  <IconComponent 
                                    className="relative z-10 w-10 h-10 text-white drop-shadow-lg" 
                                  />
                                </div>
                              </div>
                              
                              {/* Tier emoji badge */}
                              <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center border-2 border-white z-20">
                                <span className="text-lg leading-none">
                                  {tierEmojis[tier as keyof typeof tierEmojis]}
                                </span>
                              </div>
                            </div>

                            {/* Badge Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 
                                  className="font-bold text-xl truncate"
                                  style={{ color: 'var(--text-primary)' }}
                                >
                                  {badge.name}
                                </h3>
                                <span
                                  className="flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold uppercase"
                                  style={{
                                    background: tier === 'platinum' ? '#8B5CF6' :
                                               tier === 'gold' ? '#F59E0B' :
                                               tier === 'silver' ? '#6B7280' :
                                               '#D97706',
                                    color: 'white',
                                  }}
                                >
                                  {tierLabels[tier as keyof typeof tierLabels]}
                                </span>
                              </div>
                              
                              {badge.description && (
                                <p 
                                  className="text-sm mb-2 line-clamp-2"
                                  style={{ color: 'var(--text-secondary)' }}
                                >
                                  {badge.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-3 text-sm">
                                <span 
                                  className="px-3 py-1 rounded-full font-semibold"
                                  style={{
                                    background: 'var(--surface)',
                                    color: 'var(--text-secondary)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  {badge.category}
                                </span>
                                <span 
                                  className="font-bold flex items-center gap-1"
                                  style={{ 
                                    color: tier === 'platinum' ? '#8B5CF6' :
                                           tier === 'gold' ? '#F59E0B' :
                                           tier === 'silver' ? '#6B7280' :
                                           '#D97706'
                                  }}
                                >
                                  <Zap className="w-4 h-4" />
                                  +{badge.xpBonus} XP
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={handleNext}
                      className="w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all flex-shrink-0"
                      style={{
                        background: 'var(--highlight)',
                        color: 'var(--text-inverse)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--highlight-dark)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--highlight)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {hasLevelUp ? 'Continue →' : 'Awesome!'}
                    </motion.button>
                  </>
                )}

                {step === 'levelup' && hasLevelUp && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 150 }}
                      className="text-center mb-8"
                    >
                      <div className="text-8xl mb-6">🎊</div>
                      <h2 
                        className="text-5xl md:text-6xl font-bold mb-4"
                        style={{ color: 'var(--highlight)' }}
                      >
                        Level Up!
                      </h2>
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <div 
                          className="text-4xl font-bold"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {levelInfo.previous}
                        </div>
                        <svg 
                          className="w-8 h-8" 
                          style={{ color: 'var(--primary)' }}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <div 
                          className="text-6xl font-bold"
                          style={{ color: 'var(--highlight)' }}
                        >
                          {levelInfo.current}
                        </div>
                      </div>
                      <p 
                        className="text-xl"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        You've reached Level {levelInfo.current}!
                      </p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="rounded-xl p-6 mb-8 text-center"
                      style={{
                        background: 'var(--highlight-light)',
                        border: '2px solid var(--highlight)',
                      }}
                    >
                      <div 
                        className="text-sm font-semibold mb-2"
                        style={{ color: 'var(--highlight-dark)' }}
                      >
                        TOTAL XP
                      </div>
                      <div 
                        className="text-4xl font-bold"
                        style={{ color: 'var(--highlight)' }}
                      >
                        {levelInfo.totalXp.toLocaleString()}
                      </div>
                    </motion.div>

                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      onClick={onClose}
                      className="w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all"
                      style={{
                        background: 'var(--highlight)',
                        color: 'var(--text-inverse)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--highlight-dark)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--highlight)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      Awesome!
                    </motion.button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}