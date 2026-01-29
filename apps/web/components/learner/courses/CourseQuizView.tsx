// apps/web/components/learner/courses/CourseQuizView.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuizSection, { QuestionReview } from '../lessons/QuizSection'
import { motion } from 'framer-motion'

interface Quiz {
  id: string
  title: string
  description: string | null
  passingScore: number
  questions: {
    id: string
    order: number
    difficulty: number
    gameType: string
    gameConfig: string
    points: number
  }[]
}

interface PreviousAttempt {
  quizScore: number
  quizMaxScore: number
  passed: boolean
  completedAt: Date
}

interface CourseQuizViewProps {
  programId: string
  courseId: string
  quiz: Quiz
  previousAttempt: PreviousAttempt | null
}

export default function CourseQuizView({
  programId,
  courseId,
  quiz,
  previousAttempt
}: CourseQuizViewProps) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const handleQuizComplete = async (
    score: number,
    maxScore: number,
    passed: boolean,
    quizXp: number,
    questionReview: QuestionReview[]  // ✅ NEW parameter
  ) => {
    setSubmitting(true)

    try {
      const response = await fetch(
        `/api/learner/programs/${programId}/courses/${courseId}/quiz/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizScore: score,
            quizMaxScore: maxScore,
            passed,
            questionReview  // ✅ Send question review to API
          })
        }
      )

      if (!response.ok) throw new Error('Failed to submit quiz')

      const data = await response.json()

      // Build URL params for result page
      const params = new URLSearchParams({
        score: score.toString(),
        maxScore: maxScore.toString(),
        passed: passed.toString(),
        xp: data.xp.totalXp.toString(),
        baseXp: data.xp.base.toString(),
        difficultyMult: data.xp.difficultyMultiplier.toString(),
        levelMult: data.xp.levelMultiplier.toString(),
        performanceBonus: data.xp.performanceBonus.toString(),
        performanceLabel: data.xp.performanceLabel,
        badgeXp: data.xp.badgeXp.toString(),
        leveledUp: data.level.leveledUp.toString(),
        previousLevel: data.level.previous.toString(),
        currentLevel: data.level.current.toString(),
        totalXp: data.level.totalXp.toString(),
      })

      // Add badges as JSON string if any
      if (data.newBadges && data.newBadges.length > 0) {
        params.append('newBadges', encodeURIComponent(JSON.stringify(data.newBadges)))
      }

      // Redirect to result page
      router.push(
        `/learn/programs/${programId}/courses/${courseId}/quiz/result?${params.toString()}`
      )
    } catch (error) {
      console.error('Error submitting course quiz:', error)
      alert('Failed to submit quiz. Please try again.')
      setSubmitting(false)
    }
  }

  const handleBack = () => {
    router.push(`/learn/programs/${programId}/courses/${courseId}`)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-4 rounded-xl"
        style={{
          background: 'var(--primary-surface)',
          border: '1px solid var(--primary-light)',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              🎯 Final Assessment
            </h1>
            <p
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Complete this quiz to finish the course
            </p>
          </div>
          {previousAttempt && (
            <div
              className="text-right px-4 py-2 rounded-lg"
              style={{
                background: previousAttempt.passed 
                  ? 'var(--success-light)' 
                  : 'var(--warning-light)',
                border: `1px solid ${previousAttempt.passed ? 'var(--success)' : 'var(--warning)'}`
              }}
            >
              <p
                className="text-xs font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {previousAttempt.passed ? '✅ Previously Passed' : '⚠️ Retake'}
              </p>
              <p
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                {previousAttempt.quizScore}/{previousAttempt.quizMaxScore} (
                {Math.round((previousAttempt.quizScore / previousAttempt.quizMaxScore) * 100)}%)
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Quiz Section */}
      <QuizSection
        quiz={quiz}
        onComplete={handleQuizComplete}
        onBack={handleBack}
        backButtonText="Back to Course"
        completionContext="course" 
      />
    </div>
  )
}