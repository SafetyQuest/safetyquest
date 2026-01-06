// apps/web/components/learner/lessons/QuizSection.tsx
'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
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

interface QuizSectionProps {
  quiz: Quiz
  onComplete: (score: number, maxScore: number, passed: boolean, quizXp: number) => void
  onBack: () => void
}

export default function QuizSection({
  quiz,
  onComplete,
  onBack
}: QuizSectionProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<boolean[]>([])
  const [scores, setScores] = useState<number[]>([])
  const [xpEarned, setXpEarned] = useState<number[]>([])
  const [showReview, setShowReview] = useState(false)

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

  const handleQuestionComplete = (result: boolean | GameResult) => {
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

    newAnswers[currentQuestionIndex] = isCorrect
    newScores[currentQuestionIndex] = earnedPoints
    newXp[currentQuestionIndex] = earnedXpForQuestion

    setAnswers(newAnswers)
    setScores(newScores)
    setXpEarned(newXp)

    if (isLastQuestion) {
      setShowReview(true)
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handleSubmitQuiz = () => {
    const totalScore = scores.reduce((sum, points) => sum + points, 0)
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentage >= quiz.passingScore

    const totalXp = xpEarned.reduce((sum, xp) => sum + xp, 0)

    onComplete(totalScore, maxScore, passed, totalXp)
  }

  const handleRetry = () => {
    setCurrentQuestionIndex(0)
    setAnswers([])
    setScores([])
    setXpEarned([])
    setShowReview(false)
  }

  if (showReview) {
    const totalScore = scores.reduce((sum, points) => sum + points, 0)
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const passed = percentage >= quiz.passingScore
    const totalXp = xpEarned.reduce((sum, xp) => sum + xp, 0)

    return (
      <div 
        className="rounded-lg shadow-sm p-8"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">
            {passed ? '🎉' : '📚'}
          </span>
          <h2 
            className="text-3xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            {passed ? 'Quiz Complete!' : 'Keep Trying!'}
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            {passed
              ? 'Congratulations! You passed the quiz.'
              : `You need ${quiz.passingScore}% to pass. Review and try again.`}
          </p>
        </div>

        <div 
          className="rounded-lg p-6 mb-8"
          style={{ background: 'var(--surface)' }}
        >
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div 
                className="text-sm mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Your Score
              </div>
              <div 
                className="text-3xl font-bold"
                style={{ color: passed ? 'var(--success)' : 'var(--warning)' }}
              >
                {percentage}%
              </div>
            </div>
            <div>
              <div 
                className="text-sm mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Points Earned
              </div>
              <div 
                className="text-3xl font-bold"
                style={{ color: 'var(--primary)' }}
              >
                {totalScore}/{maxScore}
              </div>
            </div>
            <div>
              <div 
                className="text-sm mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                XP Earned
              </div>
              <div 
                className="text-3xl font-bold"
                style={{ color: 'var(--highlight)' }}
              >
                +{totalXp} XP
              </div>
            </div>
            <div>
              <div 
                className="text-sm mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Passing Score
              </div>
              <div 
                className="text-3xl font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {quiz.passingScore}%
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h3 
            className="text-lg font-semibold mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Question Review
          </h3>
          <div className="space-y-2">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className="flex items-center justify-between p-4 rounded-lg"
                style={{
                  background: answers[index]
                    ? 'var(--success-light)'
                    : scores[index] > 0
                    ? 'var(--warning-light)'
                    : 'var(--danger-light)',
                  border: `1px solid ${
                    answers[index]
                      ? 'var(--success)'
                      : scores[index] > 0
                      ? 'var(--warning)'
                      : 'var(--danger)'
                  }`,
                }}
              >
                <span className="font-medium">
                  Question {index + 1}
                </span>
                <div className="flex items-center space-x-3">
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {scores[index]}/{question.points} pts
                  </span>
                  <span 
                    className="text-sm font-semibold"
                    style={{ color: 'var(--highlight)' }}
                  >
                    +{xpEarned[index]} XP
                  </span>
                  <span className="text-2xl">
                    {answers[index] ? '✓' : scores[index] > 0 ? '◐' : '✗'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {!passed && (
            <button
              onClick={handleRetry}
              className="px-6 py-3 rounded-md font-medium transition-colors"
              style={{
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
                background: 'var(--background)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--background)'
              }}
            >
              Try Again
            </button>
          )}
          <button
            onClick={handleSubmitQuiz}
            className="px-6 py-3 rounded-md font-medium ml-auto transition-colors"
            style={{
              background: passed ? 'var(--success)' : 'var(--primary)',
              color: 'var(--text-inverse)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = passed ? 'var(--success-dark)' : 'var(--primary-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = passed ? 'var(--success)' : 'var(--primary)'
            }}
          >
            {passed ? 'Complete Lesson' : 'Continue Anyway'} →
          </button>
        </div>
      </div>
    )
  }

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
            ← Back to Lesson
          </button>
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