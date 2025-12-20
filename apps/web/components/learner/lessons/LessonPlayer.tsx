// apps/web/components/learner/lessons/LessonPlayer.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
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
  
  // Initialize from saved progress
  const [currentStepIndex, setCurrentStepIndex] = useState(
    lesson.savedProgress?.currentStepIndex ?? 0
  )
  const [showQuiz, setShowQuiz] = useState(false)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(lesson.savedProgress?.completedSteps ?? [])
  )
  const [accumulatedXp, setAccumulatedXp] = useState(
    lesson.savedProgress?.accumulatedXp ?? 0
  )
  const [startTime] = useState(Date.now())
  const [hasShownResume, setHasShownResume] = useState(false)

  // Sync state when lesson changes (on page refresh)
  useEffect(() => {
    if (lesson.savedProgress) {
      setCurrentStepIndex(lesson.savedProgress.currentStepIndex)
      setCompletedSteps(new Set(lesson.savedProgress.completedSteps))
      setAccumulatedXp(lesson.savedProgress.accumulatedXp)
    }
  }, [lesson.id])

  const totalSteps = lesson.steps.length
  const currentStep = lesson.steps[currentStepIndex]
  const isLastStep = currentStepIndex === totalSteps - 1

  // Simple mutation
  const saveProgressMutation = useMutation({
    mutationFn: async (data: {
      currentStepIndex: number
      completedSteps: number[]
      accumulatedXp: number
    }) => {
      const res = await fetch(
        `/api/learner/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/progress`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      )
      if (!res.ok) throw new Error('Failed to save')
      return res.json()
    }
  })

  const clearProgressMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `/api/learner/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/progress`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to clear')
      return res.json()
    }
  })

  // Save helper
  const saveProgress = useCallback((data: {
    currentStepIndex: number
    completedSteps: number[]
    accumulatedXp: number
  }) => {
    saveProgressMutation.mutate(data)
  }, [saveProgressMutation])

  // Save on browser close
  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = {
        currentStepIndex,
        completedSteps: Array.from(completedSteps),
        accumulatedXp
      }
      navigator.sendBeacon(
        `/api/learner/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/progress`,
        JSON.stringify(data)
      )
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveProgress({
          currentStepIndex,
          completedSteps: Array.from(completedSteps),
          accumulatedXp
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentStepIndex, completedSteps, accumulatedXp, programId, courseId, lesson.id, saveProgress])

  // ✅ FIXED: Handle step completion - save ONCE with final state
  const handleStepComplete = useCallback((earnedXp?: number) => {
    const newCompletedSteps = new Set(completedSteps).add(currentStepIndex)
    const newAccumulatedXp = accumulatedXp + (earnedXp ?? 0)
    
    // Update local state
    setCompletedSteps(newCompletedSteps)
    if (earnedXp !== undefined) {
      setAccumulatedXp(newAccumulatedXp)
    }
    
    if (isLastStep) {
      // ✅ Save current step as completed before showing quiz
      saveProgress({
        currentStepIndex,
        completedSteps: Array.from(newCompletedSteps),
        accumulatedXp: newAccumulatedXp
      })
      
      if (lesson.hasQuiz) {
        setShowQuiz(true)
      } else {
        handleLessonComplete(0, 0, true, newAccumulatedXp)
      }
    } else {
      // ✅ Calculate next step
      const nextStep = currentStepIndex + 1
      
      // ✅ Update UI immediately
      setCurrentStepIndex(nextStep)
      
      // ✅ Save ONLY ONCE with the next step position
      saveProgress({
        currentStepIndex: nextStep, // Save where we're going
        completedSteps: Array.from(newCompletedSteps),
        accumulatedXp: newAccumulatedXp
      })
    }
  }, [currentStepIndex, completedSteps, accumulatedXp, isLastStep, lesson.hasQuiz, saveProgress])

  // Handle navigation - SAVE before navigating
  const handleNavigateToStep = useCallback((stepIndex: number) => {
    if (stepIndex === currentStepIndex) return
    
    // Update UI immediately
    setCurrentStepIndex(stepIndex)
    
    // Save new position
    saveProgress({
      currentStepIndex: stepIndex,
      completedSteps: Array.from(completedSteps),
      accumulatedXp
    })
  }, [currentStepIndex, completedSteps, accumulatedXp, saveProgress])

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      handleNavigateToStep(currentStepIndex - 1)
    }
  }, [currentStepIndex, handleNavigateToStep])

  const handleQuizComplete = async (
    score: number,
    maxScore: number,
    passed: boolean,
    quizXp: number
  ) => {
    const totalXp = accumulatedXp + quizXp
    await handleLessonComplete(score, maxScore, passed, totalXp)
  }

  const handleLessonComplete = async (
    quizScore: number,
    quizMaxScore: number,
    passed: boolean,
    totalXp: number
  ) => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)

    try {
      const response = await fetch(
        `/api/learner/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizScore,
            quizMaxScore,
            passed,
            timeSpent,
            earnedXp: totalXp
          })
        }
      )

      if (!response.ok) throw new Error('Failed to submit lesson')
      const data = await response.json()

      // Clear progress
      await clearProgressMutation.mutateAsync()

      router.push(
        `/learn/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/result?score=${quizScore}&maxScore=${quizMaxScore}&passed=${passed}&xp=${totalXp}&newBadges=${data.newBadges?.length || 0}`
      )
    } catch (error) {
      console.error('Error submitting lesson:', error)
      alert('Failed to submit lesson. Please try again.')
    }
  }

  const showResumeNotification = 
    !hasShownResume && 
    lesson.savedProgress && 
    lesson.savedProgress.currentStepIndex > 0

  useEffect(() => {
    if (showResumeNotification) {
      setHasShownResume(true)
    }
  }, [showResumeNotification])

  if (showQuiz && lesson.quiz) {
    return (
      <QuizSection
        quiz={lesson.quiz}
        onComplete={handleQuizComplete}
        onBack={() => setShowQuiz(false)}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Resume Notification */}
      {showResumeNotification && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">📍</span>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-1">Welcome back!</h3>
              <p className="text-sm text-blue-700">
                You left off at step {lesson.savedProgress!.currentStepIndex + 1} of {totalSteps}.
              </p>
            </div>
            <button
              onClick={() => setHasShownResume(true)}
              className="text-blue-400 hover:text-blue-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Error notification */}
      {saveProgressMutation.isError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h3 className="font-medium text-yellow-900 mb-1">Progress not saved</h3>
              <p className="text-sm text-yellow-700">
                Check your internet connection. Progress will save when you complete steps.
              </p>
            </div>
          </div>
        </div>
      )}

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
            {accumulatedXp > 0 && (
              <span className="text-sm font-semibold text-green-600">
                +{accumulatedXp} XP
              </span>
            )}
            {saveProgressMutation.isPending && (
              <span className="text-xs text-blue-500 italic">Saving...</span>
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
              onClick={() => handleNavigateToStep(index)}
              disabled={index > currentStepIndex && !completedSteps.has(index)}
              className={`w-3 h-3 rounded-full transition-all disabled:cursor-not-allowed ${
                index === currentStepIndex
                  ? 'bg-blue-600 scale-125'
                  : completedSteps.has(index)
                  ? 'bg-green-500 hover:scale-110'
                  : index < currentStepIndex
                  ? 'bg-gray-400 hover:scale-110'
                  : 'bg-gray-300 opacity-50'
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
            onComplete={handleStepComplete}
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