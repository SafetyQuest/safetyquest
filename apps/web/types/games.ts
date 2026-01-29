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
  explanation?: string;  // Optional rich text explanation shown after submission
} & GameReward;

export type HotspotGameConfig = {
  instruction: string;
  imageUrl: string;
  hotspots: Hotspot[];
  generalFeedback?: string;  // Optional rich text general feedback shown after submission
  totalXp?: number;     // calculated sum for lessons
  totalPoints?: number; // calculated sum for quizzes
};

// ============================================================================
// DRAG & DROP GAME
// ============================================================================

export type DragDropItem = {
  id: string;
  content: string;
  correctTargetId: string;
  explanation?: string;  // Optional rich text explanation shown after submission
} & GameReward;

export type DragDropTarget = {
  id: string;
  label: string;
};

export type DragDropGameConfig = {
  instruction: string;
  items: DragDropItem[];
  targets: DragDropTarget[];
  generalFeedback?: string;  // Optional rich text general feedback shown after submission
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// MATCHING GAME (UPGRADED v3 – with explanations and general feedback)
// ============================================================================

export type MatchingItem = {
  id: string;
  text: string;
  imageUrl?: string;              // ✅ Visual support for safety items
  explanation?: string;           // ✅ NEW: Per-item explanation (300 char limit)
} & GameReward;                   // ✅ Per-item rewards (like DragDropItem)

export type MatchingPair = {
  leftId: string;         // reference to leftItems[id]
  rightId: string;        // reference to rightItems[id]
};

export type MatchingGameConfig = {
  instruction: string;
  leftItems: MatchingItem[];           // e.g., hazards, signs, scenarios
  rightItems: MatchingItem[];          // e.g., controls, meanings, actions
  pairs: MatchingPair[];               // bidirectional mapping
  generalFeedback?: string;            // ✅ NEW: General feedback (500 char limit)
  totalXp?: number;                    // auto-calculated from leftItems
  totalPoints?: number;
};

// ============================================================================
// SEQUENCE GAME (✅ UPGRADED with explanations and general feedback)
// ============================================================================

export type SequenceItem = {
  id: string;
  content: string;
  imageUrl?: string;
  explanation?: string;  // ✅ NEW: Per-item explanation (300 char limit)
} & GameReward;

export type SequenceGameConfig = {
  instruction: string;
  items: SequenceItem[];
  correctOrder: string[];
  generalFeedback?: string;  // ✅ NEW: General feedback (500 char limit)
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// TRUE/FALSE GAME (✅ UPGRADED with separate explanations and general feedback)
// ============================================================================

export type TrueFalseStatement = {
  id: string;
  statement: string;
  correctAnswer: boolean;
} & GameReward;

export type TrueFalseGameConfig = {
  instruction: string;
  statement: string;                // Single statement to evaluate
  correctAnswer: boolean;            // True or False
  trueExplanation?: string;         // ✅ NEW: Explanation shown when user selects True (300 char limit)
  falseExplanation?: string;        // ✅ NEW: Explanation shown when user selects False (300 char limit)
  generalFeedback?: string;         // ✅ NEW: General feedback shown after submission (500 char limit)
  imageUrl?: string;                // Optional visual aid
  points?: number;                  // For quiz questions
  xp?: number;                      // For lesson games
};

// ============================================================================
// MULTIPLE CHOICE GAME (placeholder - to be implemented)
// ============================================================================

export type MultipleChoiceOption = {
  id: string;
  text: string;
  correct: boolean;        // ✅ Changed from 'isCorrect' to match editor
  imageUrl?: string;       // ✅ Optional image support
  explanation?: string;    // ✅ NEW: Per-option explanation (300 char limit)
} & GameReward;            // ✅ Per-option rewards

export type MultipleChoiceQuestion = {
  id: string;
  question: string;
  options: MultipleChoiceOption[];
} & GameReward;

export type MultipleChoiceGameConfig = {
  instruction: string;
  instructionImageUrl?: string;  // ✅ Optional question image
  options: MultipleChoiceOption[]; // ✅ Changed from 'questions' to match editor
  allowMultipleCorrect: boolean; // ✅ Support for multiple correct answers
  generalFeedback?: string;      // ✅ NEW: General feedback (500 char limit)
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
  feedback?: string;
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
  generalFeedback?: string; 
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
  generalFeedback?: string;  // ✅ NEW: General feedback (500 char limit)
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// MEMORY FLIP GAME
// ============================================================================

export type MemoryFlipCard = {
  id: string;
  text?: string;
  imageUrl?: string;
};

export type MemoryFlipPair = {
  leftId: string;
  rightId: string;
  xp: number;
  points?: number;
};

export type MemoryFlipGameConfig = {
  instruction: string;
  cards: MemoryFlipCard[];
  pairs: MemoryFlipPair[];
  timeLimitSeconds: number;
  perfectGameMultiplier: number;
  totalXp?: number;
  totalPoints?: number;
};

// ============================================================================
// PHOTO SWIPE GAME (Safe vs Unsafe)
// ============================================================================

export type PhotoSwipeCard = {
  id: string;
  imageUrl: string;
  isCorrect: 'safe' | 'unsafe';  // Explicit classification (better than boolean)
  explanation: string;           // Required - helps learners understand (rich text HTML)
} & GameReward;                  // individual xp/points per card

export type PhotoSwipeGameConfig = {
  instruction: string;
  cards: PhotoSwipeCard[];       // Consistent with other games
  timeAttackMode: boolean;       // Enable time challenge
  timeLimitSeconds?: number;     // Duration (only used if timeAttackMode = true) - Total time for all cards
  totalXp?: number;              // Auto-calculated
  totalPoints?: number;          // Auto-calculated
  generalFeedback?: string;      // ✅ NEW: General feedback shown after submission (rich text HTML, 500 char limit)
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
  | ScenarioGameConfig
  | TimeAttackSortingConfig
  | MemoryFlipGameConfig
  | PhotoSwipeGameConfig;

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
  SCENARIO = 'scenario',
  TIME_ATTACK_SORTING = 'time-attack-sorting',
  MEMORY_FLIP = 'memory-flip',
  PHOTO_SWIPE = 'photo-swipe'
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};