// apps/web/components/learner/lessons/GameStep.tsx
'use client'

import { useState } from 'react'
import { LessonStepData } from '@/lib/learner/queries'
import dynamic from 'next/dynamic'
import type { GameResult } from '@/components/GameRenderer'
import type { TimerState } from '@/components/games/utils/timerUtils'

const GameRenderer = dynamic(
  () => import('@/components/GameRenderer'),
  { ssr: false }
)

interface GameStepProps {
  step: LessonStepData
  onComplete: (earnedXp?: number, gameResult?: any) => void
  onPrevious?: () => void
  previousGameState?: any | null
}

export default function GameStep({
  step,
  onComplete,
  onPrevious,
  previousGameState
}: GameStepProps) {
  const [gameCompleted, setGameCompleted] = useState(false)
  const [xpEarned, setXpEarned] = useState<number | undefined>(undefined)
  const [hasEarnedXp, setHasEarnedXp] = useState(false)
  const [currentGameResult, setCurrentGameResult] = useState<any>(null)
  
  // ⏱️ Timer state for background effects
  const [timerState, setTimerState] = useState<TimerState | null>(null)

  // ⏱️ Get background animation class based on timer phase
  const getBackgroundClass = () => {
    if (!timerState) return ''
    switch (timerState.timerPhase) {
      case 'calm': return 'game-bg-calm'
      case 'warning': return 'game-bg-warning'
      case 'critical': return 'game-bg-critical'
      case 'final': return 'game-bg-final'
      default: return ''
    }
  }

  if (!step.gameType || !step.gameConfig) {
    return (
      <div className="p-8">
        <div 
          className="text-center py-12"
          style={{ color: 'var(--text-muted)' }}
        >
          No game configuration available
        </div>
        <div 
          className="flex items-center justify-between pt-6"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {onPrevious && (
            <button
              onClick={onPrevious}
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
              ← Previous
            </button>
          )}
          <button
            onClick={() => onComplete(undefined)}
            className="px-6 py-3 rounded-md font-medium transition-colors"
            style={{
              background: 'var(--primary)',
              color: 'var(--text-inverse)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-dark)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary)'
            }}
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
    let fullResult: any = result
  
    if (typeof result === 'boolean') {
      isCorrect = result
    } else {
      isCorrect = determineCorrectness(result)
      earnedXp = result.earnedXp
    }
  
    setCurrentGameResult(fullResult)
  
    if (isCorrect && !hasEarnedXp && earnedXp !== undefined) {
      setXpEarned(earnedXp)
      setHasEarnedXp(true)
    }
  }

  const handleContinue = () => {
    const gameState = currentGameResult ? {
      stepId: step.id,
      gameType: step.gameType,
      userActions: currentGameResult.userActions || {},
      result: currentGameResult,
      xpAwarded: hasEarnedXp,
      attemptCount: (previousGameState?.attemptCount ?? 0) + 1,
      lastAttemptAt: new Date().toISOString()
    } : null
  
    onComplete(hasEarnedXp ? xpEarned : undefined, gameState)
  }

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

  return (
    <div className={`p-8 ${getBackgroundClass()}`}>
      {/* Game Title */}
      {/* <div className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-2xl">🎮</span>
          <h3 
            className="text-xl font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            Interactive Activity
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>
          Complete this activity to continue with the lesson.
          {!hasEarnedXp && ' Complete it correctly to earn XP!'}
        </p>
      </div> */}

      {/* Game Renderer */}
      <div 
        className="mb-8 rounded-lg p-6"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <GameRenderer
          type={step.gameType as any}
          config={typeof step.gameConfig === 'string'
            ? JSON.parse(step.gameConfig)
            : step.gameConfig}
          onComplete={handleGameComplete}
          onTimerUpdate={setTimerState}
          mode="lesson"
          previousState={previousGameState}
        />
      </div>

      {/* Navigation Buttons */}
      <div 
        className="flex items-center justify-between pt-6"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {onPrevious ? (
          <button
            onClick={onPrevious}
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
            ← Previous
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={handleContinue}
          disabled={!gameCompleted}
          className="px-6 py-3 rounded-md font-medium transition-colors"
          style={{
            background: gameCompleted ? 'var(--primary)' : 'var(--surface)',
            color: gameCompleted ? 'var(--text-inverse)' : 'var(--text-muted)',
            cursor: gameCompleted ? 'pointer' : 'not-allowed',
          }}
          onMouseEnter={(e) => {
            if (gameCompleted) {
              e.currentTarget.style.background = 'var(--primary-dark)'
            }
          }}
          onMouseLeave={(e) => {
            if (gameCompleted) {
              e.currentTarget.style.background = 'var(--primary)'
            }
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}