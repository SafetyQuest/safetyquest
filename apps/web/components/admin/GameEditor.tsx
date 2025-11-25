// apps/web/components/admin/GameEditor.tsx
'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import HotspotEditor from './games/HotspotEditor';
import DragDropEditor from './games/DragDropEditor';
import MatchingEditor from './games/MatchingEditor';
import SequenceEditor from './games/SequenceEditor';
import TrueFalseEditor from './games/TrueFalseEditor';
import MultipleChoiceEditor from './games/MultipleChoiceEditor';
import FillBlankEditor from './games/FillBlankEditor';
import ScenarioEditor from './games/ScenarioEditor';

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

  // Then in the handleSave function, add this case:
  

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
      case 'fill-blank':
        return (
          <FillBlankEditor
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
      default:
        return <div>Unsupported game type: {gameType}</div>;
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          Configure {gameType.charAt(0).toUpperCase() + gameType.slice(1)} Game
        </h2>
        
        {renderEditor()}
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}