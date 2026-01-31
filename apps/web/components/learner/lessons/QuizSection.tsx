// apps/web/components/learner/lessons/QuizSection.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import type { GameResult } from '@/components/GameRenderer'

const GameRenderer = dynamic(
  () => import('@/components/GameRenderer'),
  { ssr: false }
)

interface QuizQuestion {
  id: string
  order: number
  difficulty: number
  gameType: string
  gameConfig: string
  points: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  passingScore: number
  questions: QuizQuestion[]
}

// ✅ NEW: Question review data structure
export interface QuestionReview {
  questionNumber: number
  questionId: string
  points: number
  maxPoints: number
  xp: number
  status: 'correct' | 'partial' | 'wrong'
}

interface QuizSectionProps {
  quiz: Quiz
  onComplete: (
    score: number, 
    maxScore: number, 
    passed: boolean, 
    quizXp: number,
    questionReview: QuestionReview[]  // ✅ NEW parameter
  ) => void
  onBack: () => void
  backButtonText?: string
  hideBackButton?: boolean
  completionContext?: 'lesson' | 'course'
}

export default function QuizSection({
  quiz,
  onComplete,
  onBack,
  backButtonText = 'Back to Lesson',
  hideBackButton = false,
  completionContext = 'lesson'
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [scores, setScores] = useState<number[]>([])
  const [xpEarned, setXpEarned] = useState<number[]>([])
  const [showCompletionMessage, setShowCompletionMessage] = useState(false)  // ✅ NEW state
  const [isSubmitting, setIsSubmitting] = useState(false)  // ✅ NEW state

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const totalQuestions = quiz.questions.length

  const determineCorrectness = (result: GameResult): boolean => {
    if ('success' in result && typeof result.success === 'boolean') {
      return result.success
    }

    if ('correctCount' in result && 'totalCount' in result) {
      return result.correctCount === result.totalCount
    }

    if ('correct' in result && 'total' in result) {
      return result.correct === result.total
    }

    return false
  }

  const calculatePartialPoints = (result: GameResult, maxPoints: number): number => {
    if (result.earnedPoints !== undefined) {
      return result.earnedPoints
    }

    if ('correctCount' in result && 'totalCount' in result && result.totalCount! > 0) {
      return Math.round((result.correctCount! / result.totalCount!) * maxPoints)
    }

    if ('correct' in result && 'total' in result && result.total! > 0) {
      return Math.round((result.correct! / result.total!) * maxPoints)
    }

    return determineCorrectness(result) ? maxPoints : 0
  }

  const calculateQuestionXp = (result: GameResult, isCorrect: boolean, maxPoints: number): number => {
    let xp = 10

    if (isCorrect) {
      const difficultyBonus = currentQuestion.difficulty * 5
      
      if ('correctCount' in result && 'totalCount' in result && result.totalCount! > 0) {
        const percentage = result.correctCount! / result.totalCount!
        xp += Math.round(difficultyBonus * percentage)
      } else {
        xp += difficultyBonus
      }
    }

    return xp
  }

  // ✅ NEW: Auto-submit quiz function
  const autoSubmitQuiz = (finalAnswers: boolean[], finalScores: number[], finalXp: number[]) => {
    setIsSubmitting(true)

    console.log('🔍 DEBUG: Quiz submission state:', {
      answers: finalAnswers,
      scores: finalScores,
      xpEarned: finalXp,
      totalQuestions: quiz.questions.length
    })

    const totalScore = finalScores.reduce((sum, points) => sum + points, 0)
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentage >= quiz.passingScore
    const totalXp = finalXp.reduce((sum, xp) => sum + xp, 0)

    console.log('🔍 DEBUG: Calculated values:', {
      totalScore,
      maxScore,
      percentage,
      passed,
      totalXp
    })

    // ✅ Build question review data
    const questionReview: QuestionReview[] = quiz.questions.map((q, i) => {
      const earnedPoints = finalScores[i] || 0
      const maxPoints = q.points
      const wasAnswered = i < finalAnswers.length && (finalAnswers[i] !== undefined)
      
      let status: 'correct' | 'partial' | 'wrong'
      
      if (!wasAnswered) {
        // Question not answered yet (shouldn't happen but safety check)
        status = 'wrong'
      } else if (earnedPoints === maxPoints) {
        // Got full points = correct
        status = 'correct'
      } else if (earnedPoints > 0) {
        // Got some points but not all = partial
        status = 'partial'
      } else {
        // Got zero points = wrong
        status = 'wrong'
      }
      
      return {
        questionNumber: i + 1,
        questionId: q.id,
        points: earnedPoints,
        maxPoints: maxPoints,
        xp: finalXp[i] || 0,
        status: status
      }
    })

    // Call parent with review data
    onComplete(totalScore, maxScore, passed, totalXp, questionReview)
  }

  const handleQuestionComplete = (result: boolean | GameResult) => {
    console.log('🎮 DEBUG: Question completed:', {
      questionIndex: currentQuestionIndex,
      result,
      resultType: typeof result
    })

    const newAnswers = [...answers]
    const newScores = [...scores]
    const newXp = [...xpEarned]

    let isCorrect = false
    let earnedPoints = 0
    let earnedXpForQuestion = 0

    if (typeof result === 'boolean') {
      isCorrect = result
      earnedPoints = isCorrect ? currentQuestion.points : 0
      earnedXpForQuestion = isCorrect ? 20 : 10
    } else {
      isCorrect = determineCorrectness(result)
      earnedPoints = calculatePartialPoints(result, currentQuestion.points)
      earnedXpForQuestion = calculateQuestionXp(result, isCorrect, currentQuestion.points)
    }

    console.log('✅ DEBUG: Calculated for this question:', {
      isCorrect,
      earnedPoints,
      earnedXpForQuestion,
      maxPoints: currentQuestion.points
    })

    newAnswers[currentQuestionIndex] = isCorrect
    newScores[currentQuestionIndex] = earnedPoints
    newXp[currentQuestionIndex] = earnedXpForQuestion

    console.log('📊 DEBUG: Updated arrays:', {
      newAnswers,
      newScores,
      newXp
    })

    setAnswers(newAnswers)
    setScores(newScores)
    setXpEarned(newXp)

    if (isLastQuestion) {
      // ✅ NEW: Show "All Done!" message
      setShowCompletionMessage(true)
      
      // ✅ FIXED: Pass the updated arrays directly to avoid stale state
      setTimeout(() => {
        autoSubmitQuiz(newAnswers, newScores, newXp)
      }, 1500)
    } else {
      // Advance to next question
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  // ✅ NEW: "All Done!" completion message UI
  if (showCompletionMessage) {
    return (
      <div 
        className="rounded-lg shadow-sm p-8 min-h-[400px] flex items-center justify-center"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="text-6xl mb-4"
          >
            ✨
          </motion.div>
          <h2 
            className="text-3xl font-bold mb-3"
            style={{ color: 'var(--text-primary)' }}
          >
            All Done!
          </h2>
          <p 
            className="text-lg mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            {isSubmitting ? 'Submitting your quiz...' : 'Great job completing all questions!'}
          </p>
          {/* Loading spinner */}
          {isSubmitting && (
            <div
              className="inline-block w-12 h-12 rounded-full mb-4"
              style={{
                border: '4px solid var(--surface)',
                borderTopColor: 'var(--primary)',
                animation: 'spin 1s linear infinite'
              }}
            />
          )}
        </motion.div>
      </div>
    )
  }

  // Regular quiz UI
  return (
    <div 
      className="rounded-lg shadow-sm"
      style={{
        background: 'var(--background)',
        border: '1px solid var(--border)',
      }}
    >
      <div 
        className="p-6"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {quiz.title}
            </h2>
            {quiz.description && (
              <p 
                className="mt-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                {quiz.description}
              </p>
            )}
          </div>
          {!hideBackButton && (
            <button
              onClick={onBack}
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
            >
              ← {backButtonText}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between text-sm mb-2">
          <span 
            className="font-medium"
            style={{ color: 'var(--text-primary)' }}
          >
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <div className="flex items-center space-x-3">
            <span style={{ color: 'var(--text-muted)' }}>
              Passing score: {quiz.passingScore}%
            </span>
            {xpEarned.length > 0 && (
              <span 
                className="font-semibold"
                style={{ color: 'var(--highlight)' }}
              >
                +{xpEarned.reduce((sum, xp) => sum + xp, 0)} XP
              </span>
            )}
          </div>
        </div>
        <div 
          className="w-full rounded-full h-2"
          style={{ background: 'var(--surface)' }}
        >
          <div
            className="h-2 rounded-full transition-all"
            style={{ 
              width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
              background: 'var(--primary)',
            }}
          />
        </div>
      </div>

      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 
              className="text-xl font-semibold"
              style={{ color: 'var(--text-primary)' }}
            >
              Question {currentQuestionIndex + 1}
            </h3>
            <div className="flex items-center space-x-2">
              <span 
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {currentQuestion.points} points
              </span>
              <span 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                (Difficulty: {currentQuestion.difficulty}/5)
              </span>
            </div>
          </div>
        </div>

        <div 
          className="rounded-lg p-6 mb-6"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <GameRenderer
            type={currentQuestion.gameType as any}
            config={typeof currentQuestion.gameConfig === 'string'
              ? JSON.parse(currentQuestion.gameConfig)
              : currentQuestion.gameConfig}
            onComplete={handleQuestionComplete}
            mode="quiz"
          />
        </div>

        <div className="flex items-center justify-center space-x-2">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full"
              style={{
                background: index === currentQuestionIndex
                  ? 'var(--primary)'
                  : index < currentQuestionIndex
                  ? answers[index]
                    ? 'var(--success)'
                    : scores[index] > 0
                    ? 'var(--warning)'
                    : 'var(--danger)'
                  : 'var(--border-medium)',
                transform: index === currentQuestionIndex ? 'scale(1.25)' : 'scale(1)',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}