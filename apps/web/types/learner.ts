// apps/web/types/learner.ts

/**
 * Program enrollment summary for learner dashboard
 */
export interface LearnerProgram {
  id: string
  title: string
  description: string | null
  totalCourses: number
  completedCourses: number
  overallProgress: number
  assignedAt: string
  lastActivityAt: string | null
}

/**
 * Detailed program view with courses
 */
export interface ProgramDetail {
  id: string
  title: string
  description: string | null
  courses: CourseInProgram[]
  overallProgress: number
  assignedAt: string
}

/**
 * Course within a program context
 */
export interface CourseInProgram {
  id: string
  title: string
  description: string | null
  difficulty: string
  order: number
  totalLessons: number
  completedLessons: number
  isLocked: boolean
  progress: number
  hasQuiz: boolean
}

/**
 * Course detail with lessons
 */
export interface CourseDetail {
  id: string
  title: string
  description: string | null
  difficulty: string
  lessons: LessonInCourse[]
  progress: number
  hasQuiz: boolean
  quizId: string | null
}

/**
 * Lesson within a course context
 */
export interface LessonInCourse {
  id: string
  title: string
  slug: string
  description: string | null
  difficulty: string
  order: number
  isLocked: boolean
  hasQuiz: boolean
  quizId: string | null
  attempt: LessonAttemptSummary | null
}

/**
 * Lesson attempt summary
 */
export interface LessonAttemptSummary {
  passed: boolean
  quizScore: number
  quizMaxScore: number
  scorePercentage: number
  timeSpent: number | null
  completedAt: string
}

/**
 * Full lesson data for playing
 */
export interface LessonDetail {
  id: string
  title: string
  slug: string
  description: string | null
  difficulty: string
  steps: LessonStepData[]
  hasQuiz: boolean
  quiz: QuizData | null
  attempt: LessonAttemptSummary | null
}

/**
 * Lesson step data
 */
export interface LessonStepData {
  id: string
  order: number
  type: 'content' | 'game'
  contentType?: string | null
  contentData?: string | null
  gameType?: string | null
  gameConfig?: any
}

/**
 * Quiz data
 */
export interface QuizData {
  id: string
  title: string
  description: string | null
  type: string
  passingScore: number
  questions: QuizQuestionData[]
}

/**
 * Quiz question data
 */
export interface QuizQuestionData {
  id: string
  order: number
  difficulty: number
  gameType: string
  gameConfig: any
  points: number
}

/**
 * Quiz submission payload
 */
export interface QuizSubmission {
  answers: QuizAnswerSubmission[]
  timeSpent: number
}

/**
 * Individual quiz answer submission
 */
export interface QuizAnswerSubmission {
  questionId: string
  correct: boolean
  timeSpent: number
  userAnswer?: any
}

/**
 * Result after submitting a quiz
 */
export interface QuizSubmissionResult {
  success: boolean
  result: {
    score: number
    maxScore: number
    scorePercentage: number
    passed: boolean
    timeSpent: number
    nextLesson: NextContent | null
    nextCourse: NextContent | null
    badgesEarned: Achievement[]
  }
}

/**
 * Next content item reference
 */
export interface NextContent {
  id: string
  title: string
  type: string
}

/**
 * Achievement/Badge
 */
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  earnedAt?: string
}

/**
 * Dashboard progress summary
 */
export interface ProgressSummary {
  totalPrograms: number
  activePrograms: number
  completedPrograms: number
  totalLessons: number
  completedLessons: number
  totalXp: number
  currentLevel: number
  currentStreak: number
  badges: number
}

/**
 * Activity feed item
 */
export interface ActivityItem {
  type: 'LESSON_COMPLETED' | 'COURSE_COMPLETED' | 'BADGE_EARNED' | 'PROGRAM_STARTED'
  title: string
  timestamp: string
  details: {
    programTitle?: string
    courseTitle?: string
    lessonTitle?: string
    score?: number
    badgeIcon?: string
  }
}

/**
 * Recommended lesson
 */
export interface RecommendedLesson {
  lessonId: string
  lessonTitle: string
  courseTitle: string
  programTitle: string
  difficulty: string
}

/**
 * Dashboard data
 */
export interface DashboardData {
  summary: ProgressSummary
  recentActivity: ActivityItem[]
  recommendations: RecommendedLesson[]
}

/**
 * Badge stats
 */
export interface BadgeStats {
  totalEarned: number
  totalAvailable: number
  recentlyEarned: number
}

/**
 * User badge with details
 */
export interface UserBadgeDetail {
  id: string
  name: string
  description: string | null
  iconUrl: string | null
  awardedAt: string
}

/**
 * API Error response
 */
export interface APIError {
  error: string
  message?: string
  statusCode?: number
}