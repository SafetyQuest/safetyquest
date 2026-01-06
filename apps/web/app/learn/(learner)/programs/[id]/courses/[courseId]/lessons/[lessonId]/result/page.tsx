// FIXED: apps/web/app/learn/(learner)/programs/[id]/courses/[courseId]/lessons/[lessonId]/result/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'

interface ResultPageProps {
  params: Promise<{
    id: string
    courseId: string
    lessonId: string
  }>
  searchParams: Promise<{
    score?: string
    maxScore?: string
    passed?: string
    xp?: string
    newBadges?: string
  }>
}

export default async function ResultPage({ params, searchParams }: ResultPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  return <ResultPageClient params={resolvedParams} searchParams={resolvedSearchParams} />
}

function ResultPageClient({ 
  params, 
  searchParams 
}: { 
  params: { id: string; courseId: string; lessonId: string }
  searchParams: { score?: string; maxScore?: string; passed?: string; xp?: string; newBadges?: string }
}) {
  const router = useRouter()
  const [showContent, setShowContent] = useState(false)

  const score = parseInt(searchParams.score || '0')
  const maxScore = parseInt(searchParams.maxScore || '0')
  const passed = searchParams.passed === 'true'
  const xpEarned = parseInt(searchParams.xp || '0')  // ✅ FIXED: Changed from xpEarned to xp
  const badgesEarned = parseInt(searchParams.newBadges || '0')
  const hasQuiz = maxScore > 0  // ✅ NEW: Detect if lesson has quiz

  useEffect(() => {
    // Show content after brief delay
    setTimeout(() => setShowContent(true), 300)

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
  }, [passed])

  const handleContinue = () => {
    router.push(`/learn/programs/${params.id}/courses/${params.courseId}`)
  }

  const handleRetry = () => {
    router.push(`/learn/programs/${params.id}/courses/${params.courseId}/lessons/${params.lessonId}`)
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: passed
          ? 'linear-gradient(135deg, var(--success-light) 0%, var(--primary-surface) 100%)'
          : 'linear-gradient(135deg, var(--warning-light) 0%, var(--alert-light) 100%)',
      }}
    >
      {showContent && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl w-full"
        >
          <div
            className="rounded-2xl shadow-2xl p-8 md:p-12"
            style={{
              background: 'var(--background)',
              border: `3px solid ${passed ? 'var(--success)' : 'var(--warning)'}`,
            }}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-center mb-6"
            >
              <div
                className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4"
                style={{
                  background: passed ? 'var(--success-light)' : 'var(--warning-light)',
                  border: `4px solid ${passed ? 'var(--success)' : 'var(--warning)'}`,
                }}
              >
                {passed ? (
                  <svg 
                    className="w-14 h-14" 
                    style={{ color: 'var(--success)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg 
                    className="w-14 h-14" 
                    style={{ color: 'var(--warning)' }}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-8"
            >
              <h1 
                className="text-4xl md:text-5xl font-bold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                {passed ? 'Congratulations!' : 'Keep Going!'}
              </h1>
              <p 
                className="text-xl"
                style={{ color: 'var(--text-secondary)' }}
              >
                {passed
                  ? 'You\'ve successfully completed this lesson'
                  : 'You can retry this lesson to improve your score'}
              </p>
            </motion.div>

            {/* Score or Completion - ✅ FIXED: Conditional display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-8 p-8 rounded-xl"
              style={{
                background: passed
                  ? 'linear-gradient(135deg, var(--success-light), var(--success-surface, #e6f7ed))'
                  : 'linear-gradient(135deg, var(--warning-light), var(--alert-light))',
                border: `2px solid ${passed ? 'var(--success)' : 'var(--warning)'}`,
              }}
            >
              {hasQuiz ? (
                <>
                  <div 
                    className="text-sm font-semibold mb-2"
                    style={{ color: passed ? 'var(--success-dark)' : 'var(--warning-dark)' }}
                  >
                    YOUR SCORE
                  </div>
                  <div 
                    className="text-6xl md:text-7xl font-bold"
                    style={{ color: passed ? 'var(--success)' : 'var(--warning)' }}
                  >
                    {score}%
                  </div>
                </>
              ) : (
                <>
                  <div 
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--success-dark)' }}
                  >
                    LESSON COMPLETE
                  </div>
                  <div 
                    className="text-6xl md:text-7xl"
                    style={{ color: 'var(--success)' }}
                  >
                    ✓
                  </div>
                </>
              )}
            </motion.div>

            {/* Rewards */}
            {(xpEarned > 0 || badgesEarned > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="grid grid-cols-2 gap-4 mb-8"
              >
                {xpEarned > 0 && (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{
                      background: 'var(--primary-surface)',
                      border: '2px solid var(--primary-light)',
                    }}
                  >
                    <div 
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                      style={{
                        background: 'var(--primary-light)',
                        color: 'var(--text-inverse)',
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div 
                      className="text-3xl font-bold mb-1"
                      style={{ color: 'var(--primary)' }}
                    >
                      +{xpEarned}
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: 'var(--primary-dark)' }}
                    >
                      XP Earned
                    </div>
                  </div>
                )}

                {badgesEarned > 0 && (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{
                      background: 'var(--highlight-light)',
                      border: '2px solid var(--highlight)',
                    }}
                  >
                    <div 
                      className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                      style={{
                        background: 'var(--highlight)',
                        color: 'var(--text-inverse)',
                      }}
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <div 
                      className="text-3xl font-bold mb-1"
                      style={{ color: 'var(--highlight)' }}
                    >
                      {badgesEarned}
                    </div>
                    <div 
                      className="text-sm font-medium"
                      style={{ color: 'var(--highlight-dark)' }}
                    >
                      {badgesEarned === 1 ? 'Badge' : 'Badges'}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <button
                onClick={handleContinue}
                className="w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all"
                style={{
                  background: passed ? 'var(--success)' : 'var(--primary)',
                  color: 'var(--text-inverse)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = passed ? 'var(--success-dark)' : 'var(--primary-dark)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = passed ? 'var(--success)' : 'var(--primary)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {passed ? 'Continue Learning' : 'Back to Course'}
              </button>

              {!passed && (
                <button
                  onClick={handleRetry}
                  className="w-full px-6 py-4 rounded-lg font-medium transition-all"
                  style={{
                    background: 'var(--background)',
                    color: 'var(--text-primary)',
                    border: '2px solid var(--border)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface)'
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--background)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                  }}
                >
                  Retry Lesson
                </button>
              )}

              <button
                onClick={() => router.push('/learn/dashboard')}
                className="w-full px-6 py-3 rounded-lg font-medium transition-colors"
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
    </div>
  )
}