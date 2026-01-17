'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import QuizSection from '../lessons/QuizSection'
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
    quizXp: number
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
            passed
          })
        }
      )

      if (!response.ok) throw new Error('Failed to submit quiz')

      const data = await response.json()

      // Redirect to course page with success message
      router.push(
        `/learn/programs/${programId}/courses/${courseId}?quizComplete=true&passed=${passed}&score=${score}&maxScore=${maxScore}&xp=${data.xpEarned}`
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

      {/* Quiz Section - Reuses existing component! */}
      {submitting ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div
              className="inline-block w-16 h-16 rounded-full mb-4"
              style={{
                border: '4px solid var(--surface)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 1s linear infinite'
              }}
            />
            <p style={{ color: 'var(--text-secondary)' }}>Submitting quiz...</p>
          </div>
        </div>
      ) : (
        <QuizSection
          quiz={quiz}
          onComplete={handleQuizComplete}
          onBack={handleBack}
          backButtonText="Back to Course"
          completionContext="course" 
        />
      )}
    </div>
  )
}