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
  const [scores, setScores] = useState<number[]>([])  // ✅ Track actual points per question
  const [xpEarned, setXpEarned] = useState<number[]>([])  // ✅ Track XP per question
  const [showReview, setShowReview] = useState(false)

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1
  const totalQuestions = quiz.questions.length

  // Helper to determine correctness from GameResult
  const determineCorrectness = (result: GameResult): boolean => {
    // 1. Explicit success flag
    if ('success' in result && typeof result.success === 'boolean') {
      return result.success
    }

    // 2. Check correctCount vs totalCount
    if ('correctCount' in result && 'totalCount' in result) {
      return result.correctCount === result.totalCount
    }

    // 3. Check correct vs total (for hotspot - partial credit supported)
    if ('correct' in result && 'total' in result) {
      return result.correct === result.total
    }

    return false
  }

  // ✅ Calculate partial credit points
  const calculatePartialPoints = (result: GameResult, maxPoints: number): number => {
    // If earnedPoints is explicitly provided, use it
    if (result.earnedPoints !== undefined) {
      return result.earnedPoints
    }

    // Otherwise calculate partial credit
    if ('correctCount' in result && 'totalCount' in result && result.totalCount! > 0) {
      return Math.round((result.correctCount! / result.totalCount!) * maxPoints)
    }

    if ('correct' in result && 'total' in result && result.total! > 0) {
      return Math.round((result.correct! / result.total!) * maxPoints)
    }

    // All or nothing
    return determineCorrectness(result) ? maxPoints : 0
  }

  // ✅ Calculate XP for quiz question (XP awarded even in quiz mode)
  const calculateQuestionXp = (result: GameResult, isCorrect: boolean, maxPoints: number): number => {
    // Base XP for attempting
    let xp = 10

    if (isCorrect) {
      // Bonus XP for correct answer based on difficulty
      const difficultyBonus = currentQuestion.difficulty * 5
      
      // Bonus for partial credit (if applicable)
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
      // Legacy boolean support
      isCorrect = result
      earnedPoints = isCorrect ? currentQuestion.points : 0
      earnedXpForQuestion = isCorrect ? 20 : 10  // Simple XP for boolean
    } else {
      // ✅ Modern GameResult handling
      isCorrect = determineCorrectness(result)
      earnedPoints = calculatePartialPoints(result, currentQuestion.points)
      earnedXpForQuestion = calculateQuestionXp(result, isCorrect, currentQuestion.points)
    }

    newAnswers[currentQuestionIndex] = isCorrect
    newScores[currentQuestionIndex] = earnedPoints  // ✅ Store actual points earned
    newXp[currentQuestionIndex] = earnedXpForQuestion  // ✅ Store XP earned

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
    // ✅ Use actual earned points, not formula
    const totalScore = scores.reduce((sum, points) => sum + points, 0)
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const passed = percentage >= quiz.passingScore

    // ✅ Calculate total XP from quiz
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

  // Review Screen
  if (showReview) {
    const totalScore = scores.reduce((sum, points) => sum + points, 0)
    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0)
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
    const passed = percentage >= quiz.passingScore
    const totalXp = xpEarned.reduce((sum, xp) => sum + xp, 0)

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center mb-8">
          <span className="text-6xl mb-4 block">
            {passed ? '🎉' : '📚'}
          </span>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {passed ? 'Quiz Complete!' : 'Keep Trying!'}
          </h2>
          <p className="text-gray-600">
            {passed
              ? 'Congratulations! You passed the quiz.'
              : `You need ${quiz.passingScore}% to pass. Review and try again.`}
          </p>
        </div>

        {/* Score Display */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-sm text-gray-600 mb-1">Your Score</div>
              <div className={`text-3xl font-bold ${
                passed ? 'text-green-600' : 'text-orange-600'
              }`}>
                {percentage}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Points Earned</div>
              <div className="text-3xl font-bold text-blue-600">
                {totalScore}/{maxScore}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">XP Earned</div>
              <div className="text-3xl font-bold text-purple-600">
                +{totalXp} XP
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Passing Score</div>
              <div className="text-3xl font-bold text-gray-700">
                {quiz.passingScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Question Review */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Question Review
          </h3>
          <div className="space-y-2">
            {quiz.questions.map((question, index) => (
              <div
                key={question.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  answers[index]
                    ? 'bg-green-50 border-green-200'
                    : scores[index] > 0
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <span className="font-medium">
                  Question {index + 1}
                </span>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-600">
                    {scores[index]}/{question.points} pts
                  </span>
                  <span className="text-sm text-purple-600 font-semibold">
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

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          {!passed && (
            <button
              onClick={handleRetry}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              Try Again
            </button>
          )}
          <button
            onClick={handleSubmitQuiz}
            className={`px-6 py-3 rounded-md font-medium ${
              passed
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } ml-auto`}
          >
            {passed ? 'Complete Lesson' : 'Continue Anyway'} →
          </button>
        </div>
      </div>
    )
  }

  // Quiz Questions
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Quiz Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{quiz.title}</h2>
            {quiz.description && (
              <p className="text-gray-600 mt-1">{quiz.description}</p>
            )}
          </div>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Lesson
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium text-gray-700">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-gray-500">
              Passing score: {quiz.passingScore}%
            </span>
            {xpEarned.length > 0 && (
              <span className="text-purple-600 font-semibold">
                +{xpEarned.reduce((sum, xp) => sum + xp, 0)} XP
              </span>
            )}
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">
              Question {currentQuestionIndex + 1}
            </h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                {currentQuestion.points} points
              </span>
              <span className="text-xs text-gray-400">
                (Difficulty: {currentQuestion.difficulty}/5)
              </span>
            </div>
          </div>
        </div>

        {/* Game Renderer for Question */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
          <GameRenderer
            type={currentQuestion.gameType as any}
            config={typeof currentQuestion.gameConfig === 'string'
              ? JSON.parse(currentQuestion.gameConfig)
              : currentQuestion.gameConfig}
            onComplete={handleQuestionComplete}
            mode="quiz"
          />
        </div>

        {/* Question Navigation Dots */}
        <div className="flex items-center justify-center space-x-2">
          {quiz.questions.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 scale-125'
                  : index < currentQuestionIndex
                  ? answers[index]
                    ? 'bg-green-500'
                    : scores[index] > 0
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}