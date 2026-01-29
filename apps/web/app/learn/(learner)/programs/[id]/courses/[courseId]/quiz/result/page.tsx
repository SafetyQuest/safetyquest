// apps/web/app/learn/(learner)/programs/[id]/courses/[courseId]/quiz/result/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../../api/auth/[...nextauth]/route'
import { PrismaClient } from '@safetyquest/database'
import QuizResultClient from '@/components/learner/shared/QuizResultClient'

const prisma = new PrismaClient()

interface QuestionReview {
  questionNumber: number
  questionId: string
  points: number
  maxPoints: number
  xp: number
  status: 'correct' | 'partial' | 'wrong'
}

interface ResultPageProps {
  params: Promise<{
    id: string
    courseId: string
  }>
  searchParams: Promise<{
    score?: string
    maxScore?: string
    passed?: string
    xp?: string
    baseXp?: string
    difficultyMult?: string
    levelMult?: string
    performanceBonus?: string
    performanceLabel?: string
    badgeXp?: string
    newBadges?: string
    leveledUp?: string
    previousLevel?: string
    currentLevel?: string
    totalXp?: string
  }>
}

export default async function CourseQuizResultPage({ params, searchParams }: ResultPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  
  // Fetch question review server-side from QuizAttempt
  const questionReview = await fetchQuestionReview(resolvedParams.courseId)
  
  // Parse search params
  const score = parseInt(resolvedSearchParams.score || '0')
  const maxScore = parseInt(resolvedSearchParams.maxScore || '0')
  const passed = resolvedSearchParams.passed === 'true'
  const totalXpEarned = parseInt(resolvedSearchParams.xp || '0')
  const baseXp = parseInt(resolvedSearchParams.baseXp || '0')
  const difficultyMult = parseFloat(resolvedSearchParams.difficultyMult || '1')
  const levelMult = parseFloat(resolvedSearchParams.levelMult || '1')
  const performanceBonus = parseInt(resolvedSearchParams.performanceBonus || '0')
  const performanceLabel = resolvedSearchParams.performanceLabel || 'Pass'
  const badgeXp = parseInt(resolvedSearchParams.badgeXp || '0')
  const badgesData = resolvedSearchParams.newBadges 
    ? JSON.parse(decodeURIComponent(resolvedSearchParams.newBadges)) 
    : []
  const leveledUp = resolvedSearchParams.leveledUp === 'true'
  const previousLevel = parseInt(resolvedSearchParams.previousLevel || '0')
  const currentLevel = parseInt(resolvedSearchParams.currentLevel || '0')
  const totalXp = parseInt(resolvedSearchParams.totalXp || '0')
  
  return (
    <QuizResultClient
      backUrl={`/learn/programs/${resolvedParams.id}/courses/${resolvedParams.courseId}`}
      retryUrl={`/learn/programs/${resolvedParams.id}/courses/${resolvedParams.courseId}/quiz`}
      score={score}
      maxScore={maxScore}
      passed={passed}
      questionReview={questionReview}
      totalXpEarned={totalXpEarned}
      baseXp={baseXp}
      difficultyMult={difficultyMult}
      levelMult={levelMult}
      performanceBonus={performanceBonus}
      performanceLabel={performanceLabel}
      badgeXp={badgeXp}
      badgesData={badgesData}
      leveledUp={leveledUp}
      previousLevel={previousLevel}
      currentLevel={currentLevel}
      totalXp={totalXp}
      quizType="course"
      showRetryButton={!passed}
    />
  )
}

// Server-side function to fetch question review from QuizAttempt
async function fetchQuestionReview(courseId: string): Promise<QuestionReview[]> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) return []
    
    // Get course to find quizId
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { quizId: true }
    })
    
    if (!course || !course.quizId) return []
    
    // Fetch most recent quiz attempt
    const quizAttempt = await prisma.quizAttempt.findFirst({
      where: {
        userId: session.user.id,
        quizId: course.quizId
      },
      orderBy: { completedAt: 'desc' },
      select: { answers: true }
    })
    
    if (!quizAttempt || !quizAttempt.answers) return []
    
    // Parse and return question review
    return JSON.parse(quizAttempt.answers) as QuestionReview[]
  } catch (error) {
    console.error('Error fetching question review:', error)
    return []
  }
}