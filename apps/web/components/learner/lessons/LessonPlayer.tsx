// FINAL WITH LOADING: apps/web/components/learner/lessons/LessonPlayer.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { LessonDetail } from '@/lib/learner/queries'
import ContentStep from './ContentStep'
import GameStep from './GameStep'
import QuizSection from './QuizSection'
import QuizPromptModal from './QuizPromptModal'
import { useRouter, useSearchParams } from 'next/navigation'

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
  const searchParams = useSearchParams()
  const startQuiz = searchParams.get('startQuiz') === 'true'
  
  const [currentStepIndex, setCurrentStepIndex] = useState(
    lesson.savedProgress?.currentStepIndex ?? 0
  )
  const [showQuiz, setShowQuiz] = useState(startQuiz)
  const [showQuizPrompt, setShowQuizPrompt] = useState(false)
  const [isSavingContent, setIsSavingContent] = useState(false)  // ✅ NEW: Loading state
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    new Set(lesson.savedProgress?.completedSteps ?? [])
  )
  const [accumulatedXp, setAccumulatedXp] = useState(
    lesson.savedProgress?.accumulatedXp ?? 0
  )
  const [stepResults, setStepResults] = useState<Record<string, any>>(
    lesson.savedProgress?.stepResults ?? {}
  )
  const [startTime] = useState(Date.now())
  const [hasShownResume, setHasShownResume] = useState(false)
  const [contentCompletionSaved, setContentCompletionSaved] = useState(false)

  useEffect(() => {
    if (startQuiz && lesson.hasQuiz) {
      setShowQuiz(true)
    }
  }, [startQuiz, lesson.hasQuiz])

  useEffect(() => {
    if (lesson.savedProgress) {
      setCurrentStepIndex(lesson.savedProgress.currentStepIndex)
      setCompletedSteps(new Set(lesson.savedProgress.completedSteps))
      setAccumulatedXp(lesson.savedProgress.accumulatedXp)
      setStepResults(lesson.savedProgress.stepResults ?? {})
    }
  }, [lesson.id])

  const totalSteps = lesson.steps.length
  const currentStep = lesson.steps[currentStepIndex]
  const isLastStep = currentStepIndex === totalSteps - 1

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

  const saveProgress = useCallback((data: {
    currentStepIndex: number
    completedSteps: number[]
    accumulatedXp: number
    stepResults: Record<string, any>
  }) => {
    saveProgressMutation.mutate(data)
  }, [saveProgressMutation])

  // ✅ UPDATED: Added loading state management
  const saveContentCompletion = useCallback(async (xp: number) => {
    if (contentCompletionSaved) return
    
    setIsSavingContent(true)  // ✅ Start loading
    
    try {
      await fetch(
        `/api/learner/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/content-complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accumulatedXp: xp })
        }
      )
      setContentCompletionSaved(true)
    } catch (error) {
      console.error('Error saving content completion:', error)
      alert('Failed to save progress. Please try again.')
    } finally {
      setIsSavingContent(false)  // ✅ End loading
    }
  }, [contentCompletionSaved, programId, courseId, lesson.id])

  useEffect(() => {
    const handleBeforeUnload = () => {
      const data = {
        currentStepIndex,
        completedSteps: Array.from(completedSteps),
        accumulatedXp,
        stepResults
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
          accumulatedXp,
          stepResults
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [currentStepIndex, completedSteps, accumulatedXp, stepResults, programId, courseId, lesson.id, saveProgress])

  const handleStepComplete = useCallback(async (earnedXp?: number, gameResult?: any) => {
    const newCompletedSteps = new Set(completedSteps).add(currentStepIndex)
    const newAccumulatedXp = accumulatedXp + (earnedXp ?? 0)
    
    let newStepResults = stepResults
    if (gameResult && currentStep.type === 'game') {
      newStepResults = {
        ...stepResults,
        [currentStep.id]: gameResult
      }
      setStepResults(newStepResults)
    }
    
    setCompletedSteps(newCompletedSteps)
    if (earnedXp !== undefined) {
      setAccumulatedXp(newAccumulatedXp)
    }
    
    if (isLastStep) {
      saveProgress({
        currentStepIndex,
        completedSteps: Array.from(newCompletedSteps),
        accumulatedXp: newAccumulatedXp,
        stepResults: newStepResults
      })
      
      if (lesson.hasQuiz) {
        // ✅ UPDATED: await the save before showing modal
        await saveContentCompletion(newAccumulatedXp)
        setShowQuizPrompt(true)
      } else {
        handleLessonComplete(0, 0, true, newAccumulatedXp, false)
      }
    } else {
      const nextStep = currentStepIndex + 1
      setCurrentStepIndex(nextStep)
      
      saveProgress({
        currentStepIndex: nextStep,
        completedSteps: Array.from(newCompletedSteps),
        accumulatedXp: newAccumulatedXp,
        stepResults: newStepResults
      })
    }
  }, [currentStepIndex, completedSteps, accumulatedXp, stepResults, isLastStep, lesson.hasQuiz, currentStep, saveProgress, saveContentCompletion])

  const handleTakeQuizNow = () => {
    setShowQuizPrompt(false)
    setShowQuiz(true)
  }

  const handleTakeQuizLater = async () => {
    setShowQuizPrompt(false)
    
    try {
      await clearProgressMutation.mutateAsync()
      router.push(`/learn/programs/${programId}/courses/${courseId}`)
    } catch (error) {
      console.error('Error clearing progress:', error)
      alert('Failed to save progress. Please try again.')
    }
  }

  const handleNavigateToStep = useCallback((stepIndex: number) => {
    if (stepIndex === currentStepIndex) return
    
    setCurrentStepIndex(stepIndex)
    
    saveProgress({
      currentStepIndex: stepIndex,
      completedSteps: Array.from(completedSteps),
      accumulatedXp,
      stepResults
    })
  }, [currentStepIndex, completedSteps, accumulatedXp, stepResults, saveProgress])

  const handlePreviousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      handleNavigateToStep(currentStepIndex - 1)
    }
  }, [currentStepIndex, handleNavigateToStep])

  const handleQuizComplete = async (
    score: number,
    maxScore: number,
    passed: boolean,
    quizXp: number,
    questionReview: any[]  // ✅ NEW: Question review parameter
  ) => {
    const totalXp = accumulatedXp + quizXp
    await handleLessonComplete(score, maxScore, passed, totalXp, true, questionReview)
  }

  const handleLessonComplete = async (
    quizScore: number,
    quizMaxScore: number,
    passed: boolean,
    totalXp: number,
    quizAttempted: boolean,
    questionReview?: any[]  // ✅ NEW: Optional question review
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
            earnedXp: totalXp,
            quizAttempted,
            questionReview  // ✅ NEW: Send question review to API
          })
        }
      )

      if (!response.ok) throw new Error('Failed to submit lesson')
      const data = await response.json()

      await clearProgressMutation.mutateAsync()

      // ✅ NEW: Build URL params similar to course quiz
      const params = new URLSearchParams({
        score: quizScore.toString(),
        maxScore: quizMaxScore.toString(),
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

      router.push(
        `/learn/programs/${programId}/courses/${courseId}/lessons/${lesson.id}/result?${params.toString()}`
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
      {/* ✅ UPDATED: Pass loading state to modal */}
      <QuizPromptModal
        isOpen={showQuizPrompt}
        onTakeNow={handleTakeQuizNow}
        onTakeLater={handleTakeQuizLater}
        lessonTitle={lesson.title}
        isLoading={isSavingContent}  // ✅ NEW PROP
      />

      <div className="pb-24">
        {showResumeNotification && (
          <div 
            className="rounded-lg p-4 mb-4"
            style={{
              background: 'var(--primary-surface)',
              border: '1px solid var(--primary-light)',
            }}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📍</span>
              <div className="flex-1">
                <h3 
                  className="font-medium mb-1"
                  style={{ color: 'var(--primary-dark)' }}
                >
                  Welcome back!
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--primary)' }}
                >
                  You left off at step {lesson.savedProgress!.currentStepIndex + 1} of {totalSteps}.
                </p>
              </div>
              <button
                onClick={() => setHasShownResume(true)}
                style={{ color: 'var(--primary-light)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--primary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--primary-light)'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {saveProgressMutation.isError && (
          <div 
            className="rounded-lg p-4 mb-4"
            style={{
              background: 'var(--warning-light)',
              border: '1px solid var(--warning)',
            }}
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 
                  className="font-medium mb-1"
                  style={{ color: 'var(--warning-dark)' }}
                >
                  Progress not saved
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: 'var(--warning)' }}
                >
                  Check your internet connection. Progress will save when you complete steps.
                </p>
              </div>
            </div>
          </div>
        )}

        <div 
          className="rounded-lg shadow-sm"
          style={{
            background: 'var(--background)',
            border: '1px solid var(--border)',
          }}
        >
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
              previousGameState={stepResults[currentStep.id] ?? null}
            />
          )}
        </div>
      </div>

      <div 
        className="fixed bottom-0 left-0 right-0 shadow-2xl z-50"
        style={{
          background: 'var(--background)',
          borderTop: '2px solid var(--border-medium)',
        }}
      >
        <div 
          className="w-full h-1.5 md:h-1"
          style={{ background: 'var(--surface)' }}
        >
          <div
            className="h-1.5 md:h-1 transition-all duration-300"
            style={{ 
              width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
              background: 'var(--primary)',
            }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="md:hidden py-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <h3 
                  className="text-xs font-semibold truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {lesson.title}
                </h3>
                <span 
                  className="px-1.5 py-0.5 text-[10px] font-medium rounded flex-shrink-0"
                  style={{
                    background: 'var(--success-light)',
                    color: 'var(--success-dark)',
                  }}
                >
                  {lesson.difficulty}
                </span>
              </div>

              <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
                <span 
                  className="text-xs font-bold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentStepIndex + 1}/{totalSteps}
                </span>
                {accumulatedXp > 0 && (
                  <>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span 
                      className="text-xs font-bold"
                      style={{ color: 'var(--success)' }}
                    >
                      +{accumulatedXp}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <h3 
                className="text-sm font-semibold"
                style={{ color: 'var(--text-primary)' }}
              >
                {lesson.title}
              </h3>
              <span 
                className="px-2 py-0.5 text-xs font-medium rounded"
                style={{
                  background: 'var(--success-light)',
                  color: 'var(--success-dark)',
                }}
              >
                {lesson.difficulty}
              </span>
            </div>

            <div className="flex items-center space-x-1.5">
              {lesson.steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleNavigateToStep(index)}
                  disabled={index > currentStepIndex && !completedSteps.has(index)}
                  className="w-2 h-2 rounded-full transition-all disabled:cursor-not-allowed"
                  style={{
                    background: index === currentStepIndex
                      ? 'var(--primary)'
                      : completedSteps.has(index)
                      ? 'var(--success)'
                      : index < currentStepIndex
                      ? 'var(--text-muted)'
                      : 'var(--border-medium)',
                    transform: index === currentStepIndex ? 'scale(1.25)' : 'scale(1)',
                    opacity: index > currentStepIndex && !completedSteps.has(index) ? 0.5 : 1,
                  }}
                  title={`Step ${index + 1}`}
                  onMouseEnter={(e) => {
                    if (!(index > currentStepIndex && !completedSteps.has(index))) {
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = index === currentStepIndex ? 'scale(1.25)' : 'scale(1)'
                  }}
                />
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                {currentStepIndex + 1}/{totalSteps}
              </span>
              <span 
                className="text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                •
              </span>
              <span 
                className="text-sm font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                {Math.round(((currentStepIndex + 1) / totalSteps) * 100)}%
              </span>

              {accumulatedXp > 0 && (
                <>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    •
                  </span>
                  <span 
                    className="text-sm font-bold"
                    style={{ color: 'var(--success)' }}
                  >
                    +{accumulatedXp} XP
                  </span>
                </>
              )}

              {saveProgressMutation.isPending && (
                <>
                  <span 
                    className="text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    •
                  </span>
                  <span 
                    className="text-xs italic"
                    style={{ color: 'var(--primary)' }}
                  >
                    Saving...
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}