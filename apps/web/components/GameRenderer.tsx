'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

export type GameType = 'hotspot' | 'drag-drop' | 'matching' | 'sequence' | 'true-false' | 'multiple-choice' | 'scenario' | 'memory-flip' | 'photo-swipe' | 'time-attack-sorting';

export type GameRendererProps = {
  type: GameType;
  config: any;
  mode: 'preview' | 'lesson' | 'quiz';
};

export default function GameRenderer({ type, config, mode }: GameRendererProps) {
  const renderGame = () => {
    switch (type) {
      case 'hotspot':
        return <HotspotGame config={config} mode={mode} />;
      case 'drag-drop':
        return <DragDropGame config={config} mode={mode} />;
      case 'matching':
        return <MatchingGame config={config} mode={mode} />;
      case 'sequence':
        return <SequenceGame config={config} mode={mode} />;
      case 'true-false':
        return <TrueFalseGame config={config} mode={mode} />;
      case 'multiple-choice':
        return <MultipleChoiceGame config={config} mode={mode} />;
      case 'scenario':
        return <ScenarioGame config={config} mode={mode} />;
      case 'memory-flip':
        return <MemoryFlipGame config={config} mode={mode} />;
      case 'photo-swipe':
        return <PhotoSwipePlayer config={config} mode={mode} />;
      case 'time-attack-sorting':
        return <TimeAttackSortingPlayer config={config} mode={mode} />
      default:
        return <div className="text-red-500">Unsupported game type: {type}</div>;
    }
  };

  return (
    <div className="w-full h-full relative">
      <AnimatePresence>{renderGame()}</AnimatePresence>
    </div>
  );
}
