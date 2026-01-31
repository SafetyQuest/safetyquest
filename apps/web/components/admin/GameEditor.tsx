// apps/web/components/admin/GameEditor.tsx
'use client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HotspotEditor from './games/HotspotEditor';
import DragDropEditor from './games/DragDropEditor';
import MatchingEditor from './games/MatchingEditor';
import SequenceEditor from './games/SequenceEditor';
import TrueFalseEditor from './games/TrueFalseEditor';
import MultipleChoiceEditor from './games/MultipleChoiceEditor';
import ScenarioEditor from './games/ScenarioEditor';
import TimeAttackSortingEditor from './games/TimeAttackSortingEditor';
import MemoryFlipEditor from './games/MemoryFlipEditor';
import PhotoSwipeEditor from './games/PhotoSwipeEditor';

type GameEditorProps = {
  gameType: string;
  initialConfig: any;
  onSave: (config: any) => void;
  onClose: () => void;
  isQuizQuestion?: boolean; // Determines if we show points or XP
};

export default function GameEditor({
  gameType,
  initialConfig,
  onSave,
  onClose,
  isQuizQuestion = false
}: GameEditorProps) {
  const [config, setConfig] = useState<any>(initialConfig || {});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Detect changes compared to initial config
  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(initialConfig || {});
    setHasUnsavedChanges(changed);
  }, [config, initialConfig]);
  
  // Common handlers
  const handleChange = (newConfig: any) => {
    setConfig(newConfig);
  };
  
  // Validation for hotspot game
  const validateHotspotConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.imageUrl) {
      errors.push('Image is required');
    }
    
    if (!config.hotspots || config.hotspots.length === 0) {
      errors.push('At least one hotspot is required');
    }
    
    if (config.hotspots) {
      config.hotspots.forEach((hotspot: any, index: number) => {
        if (!hotspot.label || hotspot.label.trim() === '') {
          errors.push(`Hotspot ${index + 1} must have a label`);
        }
        
        const reward = isQuizQuestion ? hotspot.points : hotspot.xp;
        if (!reward || reward <= 0) {
          errors.push(`Hotspot ${index + 1} must have a reward value greater than 0`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };
  
  // Validation for Drag and Drop game
  const validateDragDropConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check instruction
    if (!config.instruction || config.instruction.trim() === '') {
      errors.push('Instruction is required');
    }
    
    // Check items
    if (!config.items || config.items.length === 0) {
      errors.push('At least one draggable item is required');
    }
    
    // Check targets
    if (!config.targets || config.targets.length === 0) {
      errors.push('At least one target zone is required');
    }
    
    // Validate each item
    if (config.items) {
      config.items.forEach((item: any, index: number) => {
        // Check content (not 'text')
        if (!item.content || item.content.trim() === '') {
          errors.push(`Item ${index + 1} must have content`);
        }
        
        // Check reward
        const reward = isQuizQuestion ? item.points : item.xp;
        if (!reward || reward <= 0) {
          errors.push(`Item ${index + 1} must have a reward value greater than 0`);
        }
        
        // Check if assigned to a target
        if (!item.correctTargetId || item.correctTargetId === '') {
          errors.push(`Item ${index + 1} must be assigned to a target`);
        }
      });
    }
    
    // Validate each target
    if (config.targets) {
      config.targets.forEach((target: any, index: number) => {
        // Check label (not 'text')
        if (!target.label || target.label.trim() === '') {
          errors.push(`Target ${index + 1} must have a label`);
        }
      });
    }
    
    // Check for orphaned targets (targets with no items assigned)
    if (config.items && config.targets) {
      const assignedTargetIds = new Set(
        config.items
          .map((item: any) => item.correctTargetId)
          .filter(Boolean)
      );
      
      const orphanedTargets = config.targets.filter(
        (target: any) => !assignedTargetIds.has(target.id)
      );
      
      if (orphanedTargets.length > 0) {
        // This is a warning, not an error - it's okay to have empty targets
        console.warn(
          `${orphanedTargets.length} target(s) have no items assigned: ${orphanedTargets.map((t: any) => t.label).join(', ')}`
        );
      }
    }
    
    // Validate that all correctTargetId references exist
    if (config.items && config.targets) {
      const targetIds = new Set(config.targets.map((t: any) => t.id));
      
      config.items.forEach((item: any, index: number) => {
        if (item.correctTargetId && !targetIds.has(item.correctTargetId)) {
          errors.push(`Item ${index + 1} references a non-existent target`);
        }
      });
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Validation for Matching game (v2)
  const validateMatchingConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check instruction
    if (!config.instruction || config.instruction.trim() === '') {
      errors.push('Instruction is required');
    }
    
    // Check left items
    if (!config.leftItems || config.leftItems.length === 0) {
      errors.push('At least one left item is required');
    }
    
    // Check right items
    if (!config.rightItems || config.rightItems.length === 0) {
      errors.push('At least one right item is required');
    }
    
    // Validate each left item
    if (config.leftItems) {
      config.leftItems.forEach((item: any, index: number) => {
        // Check text
        if (!item.text || item.text.trim() === '') {
          errors.push(`Left item ${index + 1} must have text`);
        }
        
        // Check reward
        const reward = isQuizQuestion ? item.points : item.xp;
        if (!reward || reward <= 0) {
          errors.push(`Left item ${index + 1} must have a reward value greater than 0`);
        }
      });
    }
    
    // Validate each right item
    if (config.rightItems) {
      config.rightItems.forEach((item: any, index: number) => {
        // Check text
        if (!item.text || item.text.trim() === '') {
          errors.push(`Right item ${index + 1} must have text`);
        }
      });
    }
    
    // Check pairs
    if (!config.pairs || config.pairs.length === 0) {
      errors.push('At least one pair is required. Click "Manage Pairs" to create connections.');
    }
    
    // Validate that all pair references exist
    if (config.pairs && config.leftItems && config.rightItems) {
      const leftIds = new Set(config.leftItems.map((item: any) => item.id));
      const rightIds = new Set(config.rightItems.map((item: any) => item.id));
      
      config.pairs.forEach((pair: any, index: number) => {
        if (!leftIds.has(pair.leftId)) {
          errors.push(`Pair ${index + 1} references a non-existent left item`);
        }
        if (!rightIds.has(pair.rightId)) {
          errors.push(`Pair ${index + 1} references a non-existent right item`);
        }
      });
    }
    
    // Check for items without pairs (warnings, not errors)
    if (config.leftItems && config.pairs) {
      const pairedLeftIds = new Set(config.pairs.map((p: any) => p.leftId));
      const unpairedLeftItems = config.leftItems.filter(
        (item: any) => !pairedLeftIds.has(item.id)
      );
      
      if (unpairedLeftItems.length > 0) {
        console.warn(
          `${unpairedLeftItems.length} left item(s) have no pairs: ${unpairedLeftItems.map((i: any) => i.text).join(', ')}`
        );
      }
    }
    
    if (config.rightItems && config.pairs) {
      const pairedRightIds = new Set(config.pairs.map((p: any) => p.rightId));
      const unpairedRightItems = config.rightItems.filter(
        (item: any) => !pairedRightIds.has(item.id)
      );
      
      if (unpairedRightItems.length > 0) {
        console.warn(
          `${unpairedRightItems.length} right item(s) have no pairs: ${unpairedRightItems.map((i: any) => i.text).join(', ')}`
        );
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Validation for Sequence Game

  const validateSequenceConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // ✅ Instruction
    if (!config.instruction || config.instruction.trim() === '') {
      errors.push('Instruction is required');
    }
    
    // ✅ Items exist
    if (!config.items || config.items.length === 0) {
      errors.push('At least one sequence item is required');
    }
    
    // ✅ Each item must have content & reward
    if (config.items) {
      config.items.forEach((item: any, index: number) => {
        if (!item.content || item.content.trim() === '') {
          errors.push(`Item ${index + 1} must have content`);
        }
        
        const reward = isQuizQuestion ? item.points : item.xp;
        if (!reward || reward <= 0) {
          errors.push(`Item ${index + 1} must have a reward value greater than 0`);
        }
      });
    }
    
    // ✅ correctOrder defined
    if (!config.correctOrder || config.correctOrder.length === 0) {
      errors.push('Correct order must be defined. Drag items to the "Correct Order" panel to set the sequence.');
    }
    
    // ✅ correctOrder integrity
    if (config.items && config.correctOrder) {
      const itemIds = new Set(config.items.map((item: any) => item.id));
      
      // Unknown IDs
      config.correctOrder.forEach((id: string, idx: number) => {
        if (!itemIds.has(id)) {
          errors.push(`Position ${idx + 1} in correct order references a non-existent item`);
        }
      });
      
      // Duplicates
      const seen = new Set<string>();
      config.correctOrder.forEach((id: string) => {
        if (seen.has(id)) {
          const item = config.items.find((i: any) => i.id === id);
          const name = item?.content || id;
          errors.push(`Item "${name}" appears multiple times in correct order`);
        }
        seen.add(id);
      });
      
      // ✅ ALL items must be used (strict coverage, like DragDrop)
      const correctSet = new Set(config.correctOrder);
      const missing = config.items.filter((item: any) => !correctSet.has(item.id));
      if (missing.length > 0) {
        const names = missing.map((i: any) => `"${i.content}"`).join(', ');
        errors.push(`All items must be included in correct order. Missing: ${names}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Validation for True/False Game

  const validateTrueFalseConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check instruction
    if (!config.instruction || config.instruction.trim() === '') {
      errors.push('Instruction is required');
    }
    
    // Check statement (critical field)
    if (!config.statement || config.statement.trim() === '') {
      errors.push('Statement is required - this is the core of your True/False game');
    }
    
    // Check correct answer is defined (boolean can be false, so check explicitly)
    if (config.correctAnswer === undefined || config.correctAnswer === null) {
      errors.push('Correct answer must be selected (True or False)');
    }
    
    // Check reward
    const reward = isQuizQuestion ? config.points : config.xp;
    if (!reward || reward <= 0) {
      errors.push(`${isQuizQuestion ? 'Points' : 'XP'} reward must be greater than 0`);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  };

  
  //Validation for Multiple Choice game
  const validateMultipleChoiceConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.instruction || config.instruction.trim() === '') {
      errors.push('Instruction/question is required');
    }

    if (!config.options || config.options.length < 2) {
      errors.push('At least 2 answer options are required');
    }

    if (config.options && config.options.length > 6) {
      errors.push('Maximum 6 options recommended');
    }

    if (config.options) {
      config.options.forEach((option: any, index: number) => {
        if (!option.text || option.text.trim() === '') {
          errors.push(`Option ${String.fromCharCode(65 + index)} must have text`);
        }
        if (!option.id) {
          errors.push(`Option ${String.fromCharCode(65 + index)} is missing ID`);
        }
      });
    }

    const correctCount = config.options?.filter((opt: any) => opt.correct).length || 0;
    if (correctCount === 0) {
      errors.push('At least one option must be marked as correct');
    }

    if (!config.allowMultipleCorrect && correctCount > 1) {
      errors.push('Only one option can be correct when multiple correct is disabled');
    }

    // ✅ Same pattern as other validations
    const reward = isQuizQuestion ? config.points : config.xp;
    if (!reward || reward <= 0) {
      errors.push(`${isQuizQuestion ? 'Points' : 'XP'} must be greater than 0`);
    }

    return { valid: errors.length === 0, errors };
  };

  // Validation for Scenario Game
  const validateScenarioConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.scenario || config.scenario.trim() === '') {
      errors.push('Scenario description is required');
    }
    
    if (!config.question || config.question.trim() === '') {
      errors.push('Question is required');
    }
    
    if (!config.options || config.options.length < 2) {
      errors.push('At least 2 answer options are required');
    }
    
    if (config.options) {
      config.options.forEach((option: any, index: number) => {
        if (!option.text || option.text.trim() === '') {
          errors.push(`Option ${index + 1} must have text`); // ✅ Fixed syntax
        }
      });
      
      const correctCount = config.options.filter((opt: any) => opt.correct).length;
      if (correctCount === 0) {
        errors.push('At least one option must be marked as correct');
      }
      if (!config.allowMultipleCorrect && correctCount > 1) {
        errors.push('Only one option can be marked as correct');
      }
    }
    
    const reward = isQuizQuestion ? config.points : config.xp;
    if (!reward || reward <= 0) {
      errors.push(`${isQuizQuestion ? 'Points' : 'XP'} reward must be greater than 0`); // ✅ Fixed syntax
    }
    
    return { valid: errors.length === 0, errors };
  };


  // Validation for Time-Attack Sorting Game
  const validateTimeAttackSortingConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.instruction?.trim()) {
      errors.push('Instruction is required');
    }
    
    if (!config.timeLimitSeconds || config.timeLimitSeconds < 10 || config.timeLimitSeconds > 180) {
      errors.push('Time limit must be between 10-180 seconds');
    }
    
    if (!config.items?.length) {
      errors.push('At least one item is required');
    }
    
    if (!config.targets?.length) {
      errors.push('At least one target is required');
    }
    
    config.items?.forEach((item: any, index: number) => {
      if (!item.content?.trim()) {
        errors.push(`Item ${index + 1} must have content`);
      }
      if (!item.correctTargetId) {
        errors.push(`Item ${index + 1} must be assigned to a target`);
      }
      const reward = isQuizQuestion ? item.points : item.xp;
      if (!reward || reward <= 0) {
        errors.push(`Item ${index + 1} must have reward > 0`);
      }
    });
    
    config.targets?.forEach((target: any, index: number) => {
      if (!target.label?.trim()) {
        errors.push(`Target ${index + 1} must have a label`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  // Validation for MemoryFlip Game
  const validateMemoryFlipConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!config.instruction?.trim()) errors.push('Instruction is required');
    if (!config.cards || config.cards.length === 0) errors.push('At least 2 cards (1 pair) required');
    if (config.cards.length % 2 !== 0) errors.push('Card count must be even');
    if (!config.pairs || config.pairs.length === 0) errors.push('At least one pair required');
    
    // Card validation
    const cardIds = new Set<string>();
    config.cards.forEach((card: any, idx: number) => {
      if (!card.id) errors.push(`Card ${idx + 1} missing ID`);
      else if (cardIds.has(card.id)) errors.push(`Duplicate card ID: ${card.id}`);
      else cardIds.add(card.id);
      
      if (!card.text?.trim() && !card.imageUrl) {
        errors.push(`Card ${idx + 1} must have text or image`);
      }
    });
    
    // Pair validation
    config.pairs.forEach((pair: any, idx: number) => {
      if (!pair.leftId) errors.push(`Pair ${idx + 1} missing left card`);
      if (!pair.rightId) errors.push(`Pair ${idx + 1} missing right card`);
      if (pair.leftId === pair.rightId) errors.push(`Pair ${idx + 1} cannot pair card with itself`);
      if (!cardIds.has(pair.leftId)) errors.push(`Pair ${idx + 1} references invalid left card`);
      if (!cardIds.has(pair.rightId)) errors.push(`Pair ${idx + 1} references invalid right card`);
      if (!pair.xp || pair.xp <= 0) errors.push(`Pair ${idx + 1} must have XP > 0`);
    });
    
    // Usage: each card exactly once
    const usage = new Map<string, number>();
    config.pairs.forEach((p: any) => {
      usage.set(p.leftId, (usage.get(p.leftId) || 0) + 1);
      usage.set(p.rightId, (usage.get(p.rightId) || 0) + 1);
    });
    config.cards.forEach((card: any) => {
      const count = usage.get(card.id) || 0;
      if (count !== 1) errors.push(`Card "${card.text || 'Image'}" used ${count} times (should be 1)`);
    });
    
    if (!config.timeLimitSeconds || config.timeLimitSeconds < 10 || config.timeLimitSeconds > 180) {
      errors.push('Time limit must be 10–180 seconds');
    }

    if (config.perfectGameMultiplier == null || config.perfectGameMultiplier < 1 || config.perfectGameMultiplier > 5) {
      errors.push('Perfect game multiplier must be between 1 and 5');
    }
    
    return { valid: errors.length === 0, errors };
  };

  // Validation for Photo Swipe Game
  const validatePhotoSwipeConfig = (config: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Instruction
    if (!config.instruction || config.instruction.trim() === '') {
      errors.push('Instruction is required');
    }

    // Cards exist
    if (!config.cards || config.cards.length === 0) {
      errors.push('At least one card is required');
    }

    // Validate each card
    if (config.cards) {
      config.cards.forEach((card: any, index: number) => {
        // Image URL
        if (!card.imageUrl) {
          errors.push(`Card ${index + 1} must have an image`);
        }
        // Correct classification
        if (card.isCorrect !== 'safe' && card.isCorrect !== 'unsafe') {
          errors.push(`Card ${index + 1} must have a correct classification ('safe' or 'unsafe')`);
        }
        // Explanation
        if (!card.explanation || card.explanation.trim() === '') {
          errors.push(`Card ${index + 1} must have an explanation for incorrect answers`);
        }
        // Reward
        const reward = isQuizQuestion ? card.points : card.xp;
        if (reward == null || reward < 0) { // Allow 0 reward
          errors.push(`Card ${index + 1} ${isQuizQuestion ? 'Points' : 'XP'} reward must be 0 or greater`);
        }
      });
    }

    // Timer mode settings
    if (config.timeAttackMode) {
      if (config.timeLimitSeconds == null || config.timeLimitSeconds < 5) {
        errors.push('Time limit must be at least 5 seconds when Time Attack mode is enabled');
      }
    }

    return { valid: errors.length === 0, errors };
  };

  const handleSave = () => {
    // Validate based on game type
    let validation = { valid: true, errors: [] as string[] };
    
    if (gameType === 'hotspot') {
      validation = validateHotspotConfig(config);
    } else if (gameType === 'drag-drop') {
      validation = validateDragDropConfig(config);
    } else if (gameType === 'matching') {
      validation = validateMatchingConfig(config);
    } else if (gameType === 'sequence') {
      validation = validateSequenceConfig(config);
    } else if (gameType === 'true-false') {
      validation = validateTrueFalseConfig(config);
    } else if (gameType === 'multiple-choice') {
      validation = validateMultipleChoiceConfig(config);
    } else if (gameType === 'scenario') {
      validation = validateScenarioConfig(config);
    } else if (gameType === 'memory-flip') {  // ✅ ADD THIS
      validation = validateMemoryFlipConfig(config);
    } else if (gameType === 'photo-swipe') {
      validation = validatePhotoSwipeConfig(config);
    }
    // Add validation for other game types here as they're implemented
    
    if (!validation.valid) {
      // Show each error as a toast
      validation.errors.forEach((error, index) => {
        setTimeout(() => {
          toast.error(error, {
            duration: 4000,
            position: 'top-center',
          });
        }, index * 100); // Stagger toasts slightly
      });
      return;
    }
    
    toast.success('Game configuration saved!');
    onSave(config);
    onClose();
  };

  // This is the smart close function
  const requestClose = () => {
    if (!hasUnsavedChanges) {
      onClose();
      return;
    }
    setShowConfirmDialog(true); // Show our nice dialog
  };

  // Cancel leaving → stay in editor
  const cancelLeave = () => {
    setShowConfirmDialog(false);
  };

  // Confirm leaving → discard changes
  const confirmLeave = () => {
    setShowConfirmDialog(false);
    onClose();
  };
  
  // Render appropriate editor based on gameType
  const renderEditor = () => {
    switch (gameType) {
      case 'hotspot':
        return (
          <HotspotEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'drag-drop':
        return (
          <DragDropEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'matching':
        return (
          <MatchingEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'sequence':
        return (
          <SequenceEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'true-false':
        return (
          <TrueFalseEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'multiple-choice':
        return (
          <MultipleChoiceEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'scenario':
        return (
          <ScenarioEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'time-attack-sorting':
        return (
          <TimeAttackSortingEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      case 'memory-flip':
        return (
          <MemoryFlipEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
        case 'photo-swipe':
        return (
          <PhotoSwipeEditor
            config={config}
            onChange={handleChange}
            isQuizQuestion={isQuizQuestion}
          />
        );
      default:
        return <div>Unsupported game type: {gameType}</div>;
    }
  };
  
  return (
    <>
      {/* Backdrop + Modal */}
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4"
        // Click outside → close
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            requestClose();
          }
        }}
        // Esc key → close
        onKeyDown={(e) => e.key === 'Escape' && requestClose()}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        ref={(node) => node?.focus()}
      >
        {/* Modal Card - UPDATED WITH BRAND COLORS */}
        <div
          className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-[var(--background)] p-8 shadow-2xl border border-[var(--border)]"
          onClick={(e) => e.stopPropagation()} // Prevent inside clicks from closing
        >
          {/* Close × Button - UPDATED WITH BRAND COLORS */}
          <button
            onClick={requestClose}
            className="absolute top-5 right-5 z-10 rounded-full p-2 text-[var(--text-muted)] transition-colors duration-[--transition-base] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
            aria-label="Close editor"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h2 className="mb-6 pr-12 text-2xl font-bold text-[var(--text-primary)]">
            Configure {gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game
            {hasUnsavedChanges && (
              <span className="ml-2 text-xs font-medium italic text-[var(--danger)] animate-ping-slow">
                ● Unsaved
              </span>
            )}
          </h2>
          
          {renderEditor()}
          
          <div className="mt-10 flex justify-end gap-4">
            <button
              onClick={requestClose}
              className="rounded-lg border border-[var(--border)] px-6 py-2.5 text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-[var(--primary)] px-7 py-2.5 font-medium text-[var(--text-inverse)] shadow-sm transition-colors duration-[--transition-base] hover:bg-[var(--primary-dark)]"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Beautiful Confirm Dialog - UPDATED WITH BRAND COLORS */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-[var(--background)] p-8 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--danger-light)]">
                <svg className="h-7 w-7 text-[var(--danger-dark)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">Unsaved Changes</h3>
            </div>

            <p className="mb-8 text-[var(--text-secondary)]">
              You have unsaved changes. Are you sure you want to leave without saving?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={cancelLeave}
                className="rounded-lg border border-[var(--border)] px-5 py-2.5 text-[var(--text-primary)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] transition-colors duration-[--transition-base]"
              >
                Stay
              </button>
              <button
                onClick={confirmLeave}
                className="rounded-lg bg-[var(--danger)] px-6 py-2.5 font-medium text-[var(--text-inverse)] transition-colors duration-[--transition-base] hover:bg-[var(--danger-dark)]"
              >
                Leave without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}