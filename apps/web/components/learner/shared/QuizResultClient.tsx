// apps/web/components/learner/shared/QuizResultClient.tsx
// ✅ IMPROVED: Clean & Minimal Design (Option 1)

'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import QuizCelebrationModal from './QuizCelebrationModal'

interface QuestionReview {
  questionNumber: number
  questionId: string
  points: number
  maxPoints: number
  xp: number
  status: 'correct' | 'partial' | 'wrong'
}

interface QuizResultClientProps {
  backUrl: string
  retryUrl?: string
  dashboardUrl?: string
  score: number
  maxScore: number
  passed: boolean
  questionReview: QuestionReview[]
  totalXpEarned: number
  baseXp: number
  difficultyMult: number
  levelMult: number
  performanceBonus: number
  performanceLabel: string
  badgeXp: number
  badgesData: any[]
  leveledUp: boolean
  previousLevel: number
  currentLevel: number
  totalXp: number
  quizType: 'course' | 'lesson'
  showRetryButton?: boolean
}

export default function QuizResultClient({
  backUrl,
  retryUrl,
  dashboardUrl = '/learn/dashboard',
  score,
  maxScore,
  passed,
  questionReview,
  totalXpEarned,
  baseXp,
  difficultyMult,
  levelMult,
  performanceBonus,
  performanceLabel,
  badgeXp,
  badgesData,
  leveledUp,
  previousLevel,
  currentLevel,
  totalXp,
  quizType,
  showRetryButton = true
}: QuizResultClientProps) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showQuestions, setShowQuestions] = useState(false)
  const [showXpBreakdown, setShowXpBreakdown] = useState(false)
  const [displayScore, setDisplayScore] = useState(0)

  const scorePercentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const hasBadges = badgesData.length > 0
  const shouldShowModal = hasBadges || leveledUp

  useEffect(() => {
    setTimeout(() => setShowContent(true), 100)

    // Trigger confetti if passed
    if (passed) {
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#023F88', '#00BDF2', '#8DC63F', '#F067A6', '#FFDD00'],
        })
      }, 500)
    }

    // Animate score counting
    const duration = 1500
    const steps = 60
    const increment = scorePercentage / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= scorePercentage) {
        setDisplayScore(scorePercentage)
        clearInterval(timer)
      } else {
        setDisplayScore(Math.floor(current))
      }
    }, duration / steps)

    // Auto-open modal if badges or level-up
    if (shouldShowModal) {
      setTimeout(() => setShowModal(true), 2000)
    }

    return () => clearInterval(timer)
  }, [passed, shouldShowModal, scorePercentage])

  // Generate text based on quiz type
  const title = passed 
    ? quizType === 'course' ? 'Course Complete!' : 'Lesson Complete!'
    : 'Not Quite There'
  
  const subtitle = passed
    ? quizType === 'course' 
      ? 'You\'ve passed the final assessment'
      : 'You\'ve completed this lesson'
    : 'Keep practicing to improve your score'

  const backButtonText = passed ? 'Continue' : 'Back to Course'
  const retryButtonText = 'Try Again'

  // Calculate question stats
  const correctCount = questionReview.filter(q => q.status === 'correct').length
  const partialCount = questionReview.filter(q => q.status === 'partial').length
  const wrongCount = questionReview.filter(q => q.status === 'wrong').length

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'transparent' }}
    >
      {showContent && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          {/* Main Card */}
          <div
            className="rounded-2xl shadow-lg p-8 md:p-12"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
            }}
          >
            {/* Status Icon & Title */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="mb-4"
              >
                <div className="text-6xl">
                  {passed ? '🎉' : '📚'}
                </div>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl md:text-4xl font-bold mb-2"
                style={{ color: 'var(--text-primary)' }}
              >
                {title}
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg"
                style={{ color: 'var(--text-secondary)' }}
              >
                {subtitle}
              </motion.p>
            </div>

            {/* Circular Progress Score */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-center mb-8"
            >
              <div className="relative" style={{ width: '200px', height: '200px' }}>
                {/* Background Circle */}
                <svg className="absolute inset-0" width="200" height="200">
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="12"
                  />
                  {/* Progress Circle */}
                  <motion.circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke={passed ? 'var(--success)' : 'var(--warning)'}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 90}
                    initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                    animate={{ 
                      strokeDashoffset: 2 * Math.PI * 90 * (1 - displayScore / 100)
                    }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '100px 100px',
                    }}
                  />
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div 
                    className="text-5xl font-bold"
                    style={{ color: passed ? 'var(--success)' : 'var(--warning)' }}
                  >
                    {displayScore}%
                  </div>
                  <div 
                    className="text-sm mt-1"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {score}/{maxScore} points
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Row */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 gap-4 mb-8"
            >
              {/* XP Card */}
              <div
                className="rounded-xl p-4 text-center cursor-pointer transition-all"
                style={{
                  background: 'var(--primary-surface)',
                  border: '1px solid var(--primary-light)',
                }}
                onClick={() => setShowXpBreakdown(!showXpBreakdown)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div className="text-3xl mb-1">⚡</div>
                <div 
                  className="text-2xl font-bold mb-1"
                  style={{ color: 'var(--primary)' }}
                >
                  +{totalXpEarned}
                </div>
                <div 
                  className="text-xs"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  XP Earned
                </div>
              </div>

              {/* Badges Card */}
              {hasBadges && (
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'var(--highlight-light)',
                    border: '1px solid var(--highlight)',
                  }}
                >
                  <div className="text-3xl mb-1">🏆</div>
                  <div 
                    className="text-2xl font-bold mb-1"
                    style={{ color: 'var(--highlight)' }}
                  >
                    {badgesData.length}
                  </div>
                  <div 
                    className="text-xs"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {badgesData.length === 1 ? 'Badge' : 'Badges'}
                  </div>
                </div>
              )}
            </motion.div>

            {/* XP Breakdown (Expandable) */}
            {showXpBreakdown && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 rounded-xl p-4"
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                }}
              >
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Base XP:</span>
                    <span style={{ color: 'var(--text-primary)' }}>{baseXp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Difficulty:</span>
                    <span style={{ color: 'var(--text-primary)' }}>×{difficultyMult}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Level:</span>
                    <span style={{ color: 'var(--text-primary)' }}>×{levelMult}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>Performance ({performanceLabel}):</span>
                    <span style={{ color: 'var(--success)' }}>+{performanceBonus}</span>
                  </div>
                  {badgeXp > 0 && (
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--text-secondary)' }}>Badges:</span>
                      <span style={{ color: 'var(--highlight)' }}>+{badgeXp}</span>
                    </div>
                  )}
                  <div 
                    className="pt-2 mt-2 flex justify-between font-bold border-t"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span style={{ color: 'var(--text-primary)' }}>Total:</span>
                    <span style={{ color: 'var(--primary)' }}>+{totalXpEarned}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Questions Summary (Collapsible) */}
            {questionReview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mb-8"
              >
                <button
                  onClick={() => setShowQuestions(!showQuestions)}
                  className="w-full flex items-center justify-between p-4 rounded-xl transition-colors"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--background)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📋</span>
                    <div className="text-left">
                      <div 
                        className="font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Questions
                      </div>
                      <div 
                        className="text-sm flex items-center space-x-2"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <span className="flex items-center space-x-1">
                          <span style={{ color: 'var(--success)' }}>✓</span>
                          <span>{correctCount}</span>
                        </span>
                        {partialCount > 0 && (
                          <span className="flex items-center space-x-1">
                            <span style={{ color: 'var(--warning)' }}>◐</span>
                            <span>{partialCount}</span>
                          </span>
                        )}
                        {wrongCount > 0 && (
                          <span className="flex items-center space-x-1">
                            <span style={{ color: 'var(--danger)' }}>✗</span>
                            <span>{wrongCount}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <svg 
                    className="w-5 h-5 transition-transform"
                    style={{ 
                      color: 'var(--text-secondary)',
                      transform: showQuestions ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Expanded Question List */}
                {showQuestions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 space-y-2 max-h-64 overflow-y-auto"
                  >
                    {questionReview.map((q) => (
                      <div
                        key={q.questionId}
                        className="flex items-center justify-between p-3 rounded-lg"
                        style={{
                          background: q.status === 'correct'
                            ? 'var(--success-light)'
                            : q.status === 'partial'
                            ? 'var(--warning-light)'
                            : 'var(--danger-light)',
                          border: `1px solid ${
                            q.status === 'correct' ? 'var(--success)' 
                            : q.status === 'partial' ? 'var(--warning)' 
                            : 'var(--danger)'
                          }`,
                        }}
                      >
                        <span 
                          className="font-medium text-sm"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Q{q.questionNumber}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span 
                            className="text-xs"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {q.points}/{q.maxPoints}
                          </span>
                          <span 
                            className="text-xs font-semibold"
                            style={{ color: 'var(--highlight)' }}
                          >
                            +{q.xp}
                          </span>
                          <span className="text-lg">
                            {q.status === 'correct' ? '✓' : q.status === 'partial' ? '◐' : '✗'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="space-y-3"
            >
              <button
                onClick={() => router.push(backUrl)}
                className="w-full px-6 py-4 rounded-xl font-semibold text-lg transition-all"
                style={{
                  background: passed ? 'var(--success)' : 'var(--primary)',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {backButtonText}
              </button>

              {!passed && showRetryButton && retryUrl && (
                <button
                  onClick={() => router.push(retryUrl)}
                  className="w-full px-6 py-3 rounded-xl font-medium transition-all"
                  style={{
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                    e.currentTarget.style.background = 'var(--primary-surface)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {retryButtonText}
                </button>
              )}

              <button
                onClick={() => router.push(dashboardUrl)}
                className="w-full px-6 py-2 rounded-xl font-medium transition-colors text-sm"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }}
              >
                Go to Dashboard
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Celebration Modal (UNCHANGED) */}
      {shouldShowModal && (
        <QuizCelebrationModal
          isOpen={showModal}
          newBadges={badgesData}
          levelInfo={{
            previous: previousLevel,
            current: currentLevel,
            leveledUp: leveledUp,
            totalXp: totalXp
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}