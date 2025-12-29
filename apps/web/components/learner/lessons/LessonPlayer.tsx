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
    <>
      {/* Main Content - Scrollable */}
      <div className="pb-24">
        {/* Resume Notification */}
        {showResumeNotification && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
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

        {/* Step Content - Content First! */}
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
      </div>

      {/* Fixed Bottom Progress Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-2xl z-50">
        {/* Progress Bar - Thicker on mobile */}
        <div className="w-full bg-gray-200 h-1.5 md:h-1">
          <div
            className="bg-blue-600 h-1.5 md:h-1 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Mobile Layout (< md) */}
          <div className="md:hidden py-2.5">
            <div className="flex items-center justify-between">
              {/* Left: Title */}
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-gray-900 truncate">
                  {lesson.title}
                </h3>
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-800 rounded flex-shrink-0">
                  {lesson.difficulty}
                </span>
              </div>

              {/* Right: Stats */}
              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                <span className="text-xs font-bold text-gray-700">
                  {currentStepIndex + 1}/{totalSteps}
                </span>
                {accumulatedXp > 0 && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs font-bold text-green-600">
                      +{accumulatedXp}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout (>= md) */}
          <div className="hidden md:flex items-center justify-between py-3">
            {/* Left: Lesson Info */}
            <div className="flex items-center space-x-4">
              <h3 className="text-sm font-semibold text-gray-900">
                {lesson.title}
              </h3>
              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 rounded">
                {lesson.difficulty}
              </span>
            </div>

            {/* Center: Step Dots */}
            <div className="flex items-center space-x-1.5">
              {lesson.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigateToStep(index)}
                  disabled={index > currentStepIndex && !completedSteps.has(index)}
                  className={`w-2 h-2 rounded-full transition-all disabled:cursor-not-allowed ${
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

            {/* Right: Stats & Progress */}
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">
                {currentStepIndex + 1}/{totalSteps}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
              </span>

              {accumulatedXp > 0 && (
                <>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm font-bold text-green-600">
                    +{accumulatedXp} XP
                  </span>
                </>
              )}

              {saveProgressMutation.isPending && (
                <>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-xs text-blue-500 italic">Saving...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}