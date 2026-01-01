// apps/web/components/learner/lessons/GameStep.tsx
'use client'

import { useState } from 'react'
import { LessonStepData } from '@/lib/learner/queries'
import dynamic from 'next/dynamic'
import type { GameResult } from '@/components/GameRenderer'

const GameRenderer = dynamic(
  () => import('@/components/GameRenderer'),
  { ssr: false }
)

interface GameStepProps {
  step: LessonStepData
  onComplete: (earnedXp?: number, gameResult?: any) => void  // ✅ UPDATED
  onPrevious?: () => void
  previousGameState?: any | null  // ✅ NEW
}

export default function GameStep({
  step,
  onComplete,
  onPrevious,
  previousGameState
}: GameStepProps) {
  const [gameCompleted, setGameCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | undefined>(undefined)
  const [hasEarnedXp, setHasEarnedXp] = useState(false)  // Track if XP was already awarded
  const [currentGameResult, setCurrentGameResult] = useState<any>(null)

  if (!step.gameType || !step.gameConfig) {
    return (
      <div className="p-8">
        <div className="text-center py-12 text-gray-500">
          No game configuration available
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          {onPrevious && (
            <button
              onClick={onPrevious}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
            >
              ← Previous
            </button>
          )}
          <button
            onClick={() => onComplete(undefined)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Continue →
          </button>
        </div>
      </div>
    )
  }

  const handleGameComplete = (result: boolean | GameResult) => {
    setGameCompleted(true)
  
    let isCorrect = false
    let earnedXp: number | undefined = undefined
    let fullResult: any = result  // ✅ NEW: Store full result
  
    if (typeof result === 'boolean') {
      isCorrect = result
    } else {
      isCorrect = determineCorrectness(result)
      earnedXp = result.earnedXp
    }
  
    // ✅ NEW: Store game result for persistence
    setCurrentGameResult(fullResult)
  
    // Award XP only if correct AND haven't earned it before
    if (isCorrect && !hasEarnedXp && earnedXp !== undefined) {
      setXpEarned(earnedXp)
      setHasEarnedXp(true)
    }
  }

  const handleContinue = () => {
    // ✅ Create game state object for persistence
    const gameState = currentGameResult ? {
      stepId: step.id,
      gameType: step.gameType,
      userActions: currentGameResult.userActions || {},  // ✅ Take userActions from result
      result: currentGameResult,  // ✅ Store full result
      xpAwarded: hasEarnedXp,
      attemptCount: (previousGameState?.attemptCount ?? 0) + 1,
      lastAttemptAt: new Date().toISOString()
    } : null
  
    onComplete(hasEarnedXp ? xpEarned : undefined, gameState)
  }

  // Helper to determine correctness from GameResult
  const determineCorrectness = (result: GameResult): boolean => {
    // 1. Explicit success flag
    if ('success' in result && typeof result.success === 'boolean') {
      return result.success
    }

    // 2. Check correctCount vs totalCount (100% required)
    if ('correctCount' in result && 'totalCount' in result) {
      return result.correctCount === result.totalCount
    }

    // 3. Check correct vs total (for hotspot)
    if ('correct' in result && 'total' in result) {
      return result.correct === result.total
    }

    // 4. Default to false
    return false
  }

  return (
    <div className="p-8">
      {/* Game Title */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">🎮</span>
          <h3 className="text-xl font-semibold text-gray-900">
            Interactive Activity
          </h3>
        </div>
        <p className="text-gray-600">
          Complete this activity to continue with the lesson.
          {!hasEarnedXp && ' Complete it correctly to earn XP!'}
        </p>
      </div>

      {/* Game Renderer */}
      <div className="mb-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
      <GameRenderer
        type={step.gameType as any}
        config={typeof step.gameConfig === 'string'
          ? JSON.parse(step.gameConfig)
          : step.gameConfig}
        onComplete={handleGameComplete}
        mode="lesson"
        previousState={previousGameState}  // ✅ NEW
      />
      </div>

      {/* Completion Message */}
      {/* {gameCompleted && (
        <div className={`mb-6 rounded-lg p-4 border ${
          hasEarnedXp
            ? 'bg-green-50 border-green-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{hasEarnedXp ? '✓' : '📝'}</span>
            <div>
              <h4 className={`font-medium ${
                hasEarnedXp ? 'text-green-900' : 'text-yellow-900'
              }`}>
                {hasEarnedXp ? 'Perfect!' : 'Activity Complete!'}
              </h4>
              <p className={`text-sm ${
                hasEarnedXp ? 'text-green-700' : 'text-yellow-700'
              }`}>
                {hasEarnedXp
                  ? `Great job! You earned ${xpEarned} XP! You can now continue to the next step.`
                  : previousGameState?.xpAwarded  // ✅ NEW: Check if XP was previously awarded
                  ? 'Activity complete! (XP already earned on previous attempt)'
                  : 'You can continue, but try again to earn XP!'}
              </p>
            </div>
          </div>
        </div>
      )} */}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {onPrevious ? (
          <button
            onClick={onPrevious}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            ← Previous
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleContinue}
          disabled={!gameCompleted}
          className={`px-6 py-3 rounded-md font-medium transition-colors ${
            gameCompleted
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}