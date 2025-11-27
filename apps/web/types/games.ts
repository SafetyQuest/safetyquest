// apps/web/types/games.ts
/**
 * Game Configuration Types for SafetyQuest
 * 
 * These types define the structure for all game configurations.
 * DO NOT modify these types after Phase 1A without migrating existing data.
 */

// ============================================================================
// BASE TYPES
// ============================================================================

/**
 * Base reward type - games can award either XP (lessons) or Points (quizzes)
 */
export type GameReward = {
  xp?: number;      // For lesson games
  points?: number;  // For quiz questions
};

// ============================================================================
// HOTSPOT GAME
// ============================================================================

export type Hotspot = {
  x: number;        // percentage (0-100)
  y: number;        // percentage (0-100)
  radius: number;   // percentage (1-10)
  label: string;    // descriptive label
} & GameReward;

export type HotspotGameConfig = {
  instruction: string;
  imageUrl: string;
  hotspots: Hotspot[];
  totalXp?: number;     // calculated sum for lessons
  totalPoints?: number; // calculated sum for quizzes
};

// ============================================================================
// DRAG & DROP GAME (placeholder - to be implemented)
// ============================================================================

export type DragDropItem = {
  id: string;
  content: string;
  correctTargetId: string;
} & GameReward;

export type DragDropTarget = {
  id: string;
  label: string;
};

export type DragDropGameConfig = {
  instruction: string;
  items: DragDropItem[];
  targets: DragDropTarget[];
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// MATCHING GAME (UPGRADED v2 — backward-compatible design)
// ============================================================================

export type MatchingItem = {
  id: string;
  text: string;
  imageUrl?: string;      // ✅ Visual support for safety items
} & GameReward;           // ✅ Per-item rewards (like DragDropItem)

export type MatchingPair = {
  leftId: string;         // reference to leftItems[id]
  rightId: string;        // reference to rightItems[id]
};

export type MatchingGameConfig = {
  instruction: string;
  leftItems: MatchingItem[];    // e.g., hazards, signs, scenarios
  rightItems: MatchingItem[];   // e.g., controls, meanings, actions
  pairs: MatchingPair[];        // bidirectional mapping
  totalXp?: number;             // auto-calculated from leftItems (or right, but convention: left)
  totalPoints?: number;
};

// ============================================================================
// SEQUENCE GAME (placeholder - to be implemented)
// ============================================================================

export type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
} & GameReward;

export type SequenceGameConfig = {
  instruction: string;
  items: SequenceItem[];
  correctOrder: string[];
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// TRUE/FALSE GAME (placeholder - to be implemented)
// ============================================================================

export type TrueFalseStatement = {
  id: string;
  statement: string;
  correctAnswer: boolean;
} & GameReward;

export type TrueFalseGameConfig = {
  instruction: string;
  statements: TrueFalseStatement[];
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// MULTIPLE CHOICE GAME (placeholder - to be implemented)
// ============================================================================

export type MultipleChoiceOption = {
  id: string;
  text: string;
  isCorrect: boolean;
};

export type MultipleChoiceQuestion = {
  id: string;
  question: string;
  options: MultipleChoiceOption[];
} & GameReward;

export type MultipleChoiceGameConfig = {
  instruction: string;
  questions: MultipleChoiceQuestion[];
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// FILL IN THE BLANK GAME (placeholder - to be implemented)
// ============================================================================

export type FillBlankQuestion = {
  id: string;
  sentence: string;          // e.g., "Always wear ___ when working with chemicals"
  correctAnswer: string;     // e.g., "gloves"
  acceptableAnswers?: string[]; // e.g., ["gloves", "protective gloves"]
} & GameReward;

export type FillBlankGameConfig = {
  instruction: string;
  questions: FillBlankQuestion[];
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// SCENARIO GAME (placeholder - to be implemented)
// ============================================================================

export type ScenarioChoice = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  xp?: number;
  points?: number;
};

export type ScenarioStep = {
  id: string;
  description: string;
  imageUrl?: string;
  choices: ScenarioChoice[];
} & GameReward;

export type ScenarioOption = {
  id: string;
  text: string;
  correct: boolean;
  feedback: string;
  imageUrl?: string;
  xp?: number;      // Per-option reward for lessons
  points?: number;  // Per-option reward for quizzes
};

export type ScenarioGameConfig = {
  scenario: string;                    // Situation description
  question: string;                    // Decision prompt
  imageUrl?: string;                   // Optional scenario image
  options: ScenarioOption[];           // Answer choices
  allowMultipleCorrect?: boolean;      // Enable partial credit
  xp?: number;                         // Base reward (lessons)
  points?: number;                     // Base reward (quizzes)
  totalXp?: number;                    // Auto-calculated sum
  totalPoints?: number;                // Auto-calculated sum
};

// ============================================================================
// TIME-ATTACK SORTING GAME
// ============================================================================

export type TimeAttackSortingItem = DragDropItem;
export type TimeAttackSortingTarget = DragDropTarget;

export type TimeAttackSortingConfig = {
  instruction: string;
  items: TimeAttackSortingItem[];
  targets: TimeAttackSortingTarget[];
  timeLimitSeconds: number;
  totalXp?: number;
  totalPoints?: number;
};


// ============================================================================
// UNION TYPE FOR ALL GAMES
// ============================================================================

export type GameConfig = 
  | HotspotGameConfig
  | DragDropGameConfig
  | MatchingGameConfig
  | SequenceGameConfig
  | TrueFalseGameConfig
  | MultipleChoiceGameConfig
  | FillBlankGameConfig
  | ScenarioGameConfig
  | TimeAttackSortingConfig;

// ============================================================================
// GAME TYPE ENUM
// ============================================================================

export enum GameType {
  HOTSPOT = 'hotspot',
  DRAG_DROP = 'drag-drop',
  MATCHING = 'matching',
  SEQUENCE = 'sequence',
  TRUE_FALSE = 'true-false',
  MULTIPLE_CHOICE = 'multiple-choice',
  FILL_BLANK = 'fill-blank',
  SCENARIO = 'scenario',
  TIME_ATTACK_SORTING = 'time-attack-sorting'
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};