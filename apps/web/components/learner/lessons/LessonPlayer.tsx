// apps/web/components/learner/lessons/LessonPlayer.tsx
'use client'

import { useState } from 'react'
import { LessonDetail } from '@/lib/learner/queries'
import ContentStep from './ContentStep'
import GameStep from './GameStep'
import QuizSection from './QuizSection'
import { useRouter } from 'next/navigation'

interface LessonPlayerProps {
  lesson: LessonDetail
  userId: string
  programId: string
  courseId: string
}

export default function LessonPlayer({
  lesson,
  userId,
  programId,
  courseId
}: LessonPlayerProps) {
  const router = useRouter()
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showQuiz, setShowQuiz] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [startTime] = useState(Date.now())
  const [accumulatedXp, setAccumulatedXp] = useState(0)  // ✅ Track lesson XP

  const totalSteps = lesson.steps.length
  const currentStep = lesson.steps[currentStepIndex]
  const isLastStep = currentStepIndex === totalSteps - 1

  const handleStepComplete = (earnedXp?: number) => {
    setCompletedSteps(prev => new Set(prev).add(currentStepIndex))
    
    // ✅ Accumulate XP from game steps
    if (earnedXp !== undefined) {
      setAccumulatedXp(prev => prev + earnedXp)
    }
    
    if (isLastStep) {
      // If lesson has quiz, show it
      if (lesson.hasQuiz) {
        setShowQuiz(true)
      } else {
        // No quiz, submit lesson as complete
        // Pass accumulated XP instead of calculating
        handleLessonComplete(0, 0, true, accumulatedXp)
      }
    } else {
      // Move to next step
      setCurrentStepIndex(prev => prev + 1)
    }
  }

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }

  const handleQuizComplete = async (
    score: number,
    maxScore: number,
    passed: boolean,
    quizXp: number  // ✅ XP from quiz
  ) => {
    // ✅ Combine lesson XP + quiz XP
    const totalXp = accumulatedXp + quizXp
    await handleLessonComplete(score, maxScore, passed, totalXp)
  }

  const handleLessonComplete = async (
    quizScore: number,
    quizMaxScore: number,
    passed: boolean,
    totalXp: number  // ✅ Total XP earned in lesson
  ) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    try {
      const response = await fetch(
        `/api/learner/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            quizScore,
            quizMaxScore,
            passed,
            timeSpent,
            earnedXp: totalXp  // ✅ Pass total XP to API
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to submit lesson')
      }

      const data = await response.json()

      // Redirect to results page
      router.push(
        `/learn/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/result?score=${quizScore}&maxScore=${quizMaxScore}&passed=${passed}&xp=${totalXp}&newBadges=${data.newBadges?.length || 0}`
      )
    } catch (error) {
      console.error('Error submitting lesson:', error)
      alert('Failed to submit lesson. Please try again.')
    }
  }

  // If showing quiz
  if (showQuiz && lesson.quiz) {
    return (
      <QuizSection
        quiz={lesson.quiz}
        onComplete={handleQuizComplete}
        onBack={() => setShowQuiz(false)}
      />
    )
  }

  // Show lesson steps
  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStepIndex + 1} of {totalSteps}
          </span>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}% Complete
            </span>
            {/* ✅ Show accumulated XP */}
            {accumulatedXp > 0 && (
              <span className="text-sm font-semibold text-green-600">
                +{accumulatedXp} XP
              </span>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Step Dots */}
        <div className="flex items-center justify-center space-x-2 mt-4">
          {lesson.steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStepIndex(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentStepIndex
                  ? 'bg-blue-600 scale-125'
                  : completedSteps.has(index)
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
              title={`Step ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {currentStep.type === 'content' ? (
          <ContentStep
            step={currentStep}
            onComplete={() => handleStepComplete(undefined)}
            onPrevious={currentStepIndex > 0 ? handlePreviousStep : undefined}
          />
        ) : (
          <GameStep
            step={currentStep}
            onComplete={handleStepComplete}  // ✅ Now receives XP
            onPrevious={currentStepIndex > 0 ? handlePreviousStep : undefined}
          />
        )}
      </div>

      {/* Lesson Info Footer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h3 className="font-medium text-blue-900 mb-1">
              {isLastStep && lesson.hasQuiz
                ? 'Almost done!'
                : isLastStep
                ? 'Final step!'
                : 'Keep going!'}
            </h3>
            <p className="text-sm text-blue-700">
              {isLastStep && lesson.hasQuiz
                ? 'Complete this step to unlock the quiz.'
                : isLastStep
                ? 'This is the last step of the lesson.'
                : `${totalSteps - currentStepIndex - 1} steps remaining.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}