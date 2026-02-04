// apps/web/components/games/GameRenderer.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import HotspotGame from './games/HotspotGame';
import DragDropGame from './games/DragDropGame';
import MatchingGame from './games/MatchingGame';
import SequenceGame from './games/SortableSequenceItem';
import TrueFalseGame from './games/TrueFalseGame';
import MultipleChoiceGame from './games/MultipleChoiceGame';
import ScenarioGame from './games/ScenarioGame';
import MemoryFlipGame from './games/MemoryFlipGame';
import PhotoSwipePlayer from './games/PhotoSwipeGame';
import TimeAttackSortingPlayer from './games/TimeAttackSortingGame';
import FloatingTimerBadge from './games/shared/FloatingTimerBadge';
import { TimerState } from './games/utils/timerUtils';

export type GameType = 'hotspot' | 'drag-drop' | 'matching' | 'sequence' | 'true-false' | 'multiple-choice' | 'scenario' | 'memory-flip' | 'photo-swipe' | 'time-attack-sorting';

// Consistent result type used by all games
export type GameResult = {
  success: boolean;
  attempts?: number;
  timeSpent?: number;
  earnedXp?: number;
  earnedPoints?: number;
  correctCount?: number;
  totalCount?: number;
  correct?: number;
  total?: number;
  mistakes?: number;
  userActions?: any;
};

export type GameRendererProps = {
  type: GameType;
  config: any;
  mode: 'preview' | 'lesson' | 'quiz';
  onComplete?: (result: boolean | GameResult) => void;
  previousState?: any | null;
  onTimerUpdate?: (state: TimerState | null) => void; // ⏱️ Callback to pass timer state to parent
};

export default function GameRenderer({ 
  type, 
  config, 
  mode, 
  onComplete, 
  previousState,
  onTimerUpdate // ⏱️ New prop for timer updates
}: GameRendererProps) {
  // ⏱️ Local timer state for the floating badge
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  
  // ⏱️ Callback for time-attack games to update timer state
  // This updates both local state (for badge) and parent state (for background)
  const handleTimerUpdate = useCallback((state: TimerState | null) => {
    setTimerState(state);
    onTimerUpdate?.(state); // Pass to parent (GameStep)
  }, [onTimerUpdate]);

  const renderGame = () => {
    switch (type) {
      case 'hotspot':
        return <HotspotGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      case 'drag-drop':
        return <DragDropGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      case 'matching':
        return <MatchingGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      case 'sequence':
        return <SequenceGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      case 'multiple-choice':
        return <MultipleChoiceGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      case 'true-false':
        return <TrueFalseGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      case 'scenario':
        return <ScenarioGame config={config} mode={mode} onComplete={onComplete} previousState={previousState} />;
      
      // ⏱️ Time-attack games: Pass timer update callback
      case 'photo-swipe':
        return (
          <PhotoSwipePlayer 
            config={config} 
            mode={mode} 
            onComplete={onComplete} 
            previousState={previousState}
            onTimerUpdate={config.timeAttackMode ? handleTimerUpdate : undefined}
          />
        );
      
      case 'memory-flip':
        return (
          <MemoryFlipGame 
            config={config} 
            mode={mode} 
            onComplete={onComplete} 
            previousState={previousState}
            onTimerUpdate={handleTimerUpdate}
          />
        );
      
      case 'time-attack-sorting':
        return (
          <TimeAttackSortingPlayer 
            config={config} 
            mode={mode} 
            onComplete={onComplete} 
            previousState={previousState}
            onTimerUpdate={handleTimerUpdate}
          />
        );
      
      default:
        return <div className="text-red-500">Unsupported game type: {type}</div>;
    }
  };

  return (
    <div className="w-full h-full relative">
      {/* ⏱️ Centralized Floating Timer Badge - Shows for all time-attack games */}
      {timerState && mode !== 'preview' && (
        <FloatingTimerBadge
          timeRemaining={timerState.timeRemaining}
          timeLimit={timerState.timeLimit}
          timerPhase={timerState.timerPhase}
        />
      )}
      
      {/* Game Content */}
      <AnimatePresence>{renderGame()}</AnimatePresence>
    </div>
  );
}