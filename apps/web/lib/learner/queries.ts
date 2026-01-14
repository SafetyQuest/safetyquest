// apps/web/lib/learner/queries.ts

import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

/**
 * Reusable database query functions for learner interface
 * Can be used in both Server Components and API routes
 */

// ============================================
// PROGRAM QUERIES
// ============================================

export interface ProgramWithProgress {
  id: string
  title: string
  description: string | null
  totalLessons: number
  completedLessons: number
  progress: number
  assignedAt: string
  lastActivityAt: string | null
}

/**
 * Get all active programs for a user with progress
 */
export async function getUserPrograms(userId: string): Promise<ProgramWithProgress[]> {
  try {
    const assignments = await prisma.programAssignment.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        program: {
          select: {
            id: true,
            title: true,
            description: true,
            isActive: true,
            courses: {
              include: {
                course: {
                  include: {
                    lessons: {
                      select: { lessonId: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        assignedAt: 'desc'
      }
    })

    const filteredAssignments = assignments.filter(a => a.program.isActive)

    const uniquePrograms = filteredAssignments.reduce((acc, assignment) => {
      if (!acc.some(a => a.program.id === assignment.program.id)) {
        acc.push(assignment)
      }
      return acc
    }, [] as typeof filteredAssignments)

    // Calculate progress for each program
    const programsWithProgress = await Promise.all(
      uniquePrograms.map(async (assignment) => {
        const { program } = assignment
        
        // Get all lesson IDs in this program
        const lessonIds = program.courses.flatMap(pc =>
          pc.course.lessons.map(cl => cl.lessonId)
        )
        
        const totalLessons = lessonIds.length
        
        // Count completed lessons
        const completedLessons = lessonIds.length > 0
          ? await prisma.lessonAttempt.count({
              where: {
                userId,
                lessonId: { in: lessonIds },
                passed: true
              }
            })
          : 0
        
        // Calculate progress percentage
        const progress = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0
        
        // Get last activity
        const lastAttempt = await prisma.lessonAttempt.findFirst({
          where: {
            userId,
            lesson: {
              courses: {
                some: {
                  course: {
                    programs: {
                      some: {
                        programId: program.id
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: {
            completedAt: 'desc'
          },
          select: {
            completedAt: true
          }
        })
        
        return {
          id: program.id,
          title: program.title,
          description: program.description,
          totalLessons,
          completedLessons,
          progress,
          assignedAt: assignment.assignedAt.toISOString(),
          lastActivityAt: lastAttempt?.completedAt.toISOString() || null
        }
      })
    )

    return programsWithProgress
  } catch (error) {
    console.error('Error in getUserPrograms:', error)
    throw new Error('Failed to fetch user programs')
  }
}

/**
 * Get single program with courses and progress
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

export interface ProgramDetail {
  id: string
  title: string
  description: string | null
  courses: CourseInProgram[]
  overallProgress: number
  assignedAt: string
}

export async function getProgramDetail(
  userId: string,
  programId: string
): Promise<ProgramDetail> {
  try {
    // Verify user has access to this program
    const assignment = await prisma.programAssignment.findFirst({
      where: {
        userId,
        programId,
        isActive: true
      }
    })

    if (!assignment) {
      throw new Error('Not enrolled in this program')
    }

    // Get program details
    const program = await prisma.program.findUnique({
      where: { id: programId },
      select: {
        id: true,
        title: true,
        description: true,
        isActive: true
      }
    })

    if (!program || !program.isActive) {
      throw new Error('Program not found')
    }

    // Get all courses in program
    const programCourses = await prisma.programCourse.findMany({
      where: { programId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            difficulty: true,
            quizId: true,
            _count: {
              select: {
                lessons: true
              }
            }
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Build courses with progress
    const courses: CourseInProgram[] = await Promise.all(
      programCourses.map(async (pc, index) => {
        const { course, order } = pc
        
        // Get all lessons in course
        const courseLessons = await prisma.courseLesson.findMany({
          where: { courseId: course.id },
          select: { lessonId: true }
        })
        
        const lessonIds = courseLessons.map(cl => cl.lessonId)
        const totalLessons = lessonIds.length
        
        // Count completed lessons
        const completedLessons = totalLessons > 0
          ? await prisma.lessonAttempt.count({
              where: {
                userId,
                lessonId: { in: lessonIds },
                passed: true
              }
            })
          : 0
        
        // Calculate progress
        const progress = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0
        
        // Check if course is locked (first course always unlocked)
        // All previous courses must be 100% complete to unlock this course
        let isLocked = false
        if (index > 0) {
          // Check ALL previous courses, not just the immediate previous one
          for (let i = 0; i < index; i++) {
            const prevCourse = programCourses[i]
            const prevLessons = await prisma.courseLesson.findMany({
              where: { courseId: prevCourse.courseId },
              select: { lessonId: true }
            })
            const prevLessonIds = prevLessons.map(cl => cl.lessonId)
            
            if (prevLessonIds.length > 0) {
              const prevCompleted = await prisma.lessonAttempt.count({
                where: {
                  userId,
                  lessonId: { in: prevLessonIds },
                  passed: true
                }
              })
              
              // If ANY previous course is not 100% complete, lock this course
              if (prevCompleted < prevLessonIds.length) {
                isLocked = true
                break
              }
            }
          }
        }
        
        return {
          id: course.id,
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          order,
          totalLessons,
          completedLessons,
          isLocked,
          progress,
          hasQuiz: course.quizId !== null
        }
      })
    )

    // Calculate overall progress
    const totalLessons = courses.reduce((sum, c) => sum + c.totalLessons, 0)
    const completedLessons = courses.reduce((sum, c) => sum + c.completedLessons, 0)
    const overallProgress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    return {
      id: program.id,
      title: program.title,
      description: program.description,
      courses,
      overallProgress,
      assignedAt: assignment.assignedAt.toISOString()
    }
  } catch (error) {
    console.error('Error in getProgramDetail:', error)
    throw error
  }
}

// ============================================
// COURSE QUERIES
// ============================================

export interface LessonAttemptSummary {
  passed: boolean
  contentCompleted: boolean
  quizAttempted: boolean 
  quizScore: number
  quizMaxScore: number
  scorePercentage: number
  timeSpent: number | null
  completedAt: string
}

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

export async function getCourseDetail(
  userId: string,
  programId: string,
  courseId: string
): Promise<CourseDetail> {
  try {
    // Verify program access
    const assignment = await prisma.programAssignment.findFirst({
      where: {
        userId,
        programId,
        isActive: true
      }
    })

    if (!assignment) {
      throw new Error('Not enrolled in this program')
    }

    // Verify course belongs to program
    const programCourse = await prisma.programCourse.findFirst({
      where: {
        programId,
        courseId
      }
    })

    if (!programCourse) {
      throw new Error('Course not found in program')
    }

    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        difficulty: true,
        quizId: true
      }
    })

    if (!course) {
      throw new Error('Course not found')
    }

    // Get all lessons in course
    const courseLessons = await prisma.courseLesson.findMany({
      where: { courseId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            difficulty: true,
            quizId: true
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    })

    // Get attempts for all lessons
    const lessonIds = courseLessons.map(cl => cl.lesson.id)
    const attempts = await prisma.lessonAttempt.findMany({
      where: {
        userId,
        lessonId: { in: lessonIds }
      },
      select: {
        lessonId: true,
        passed: true,
        contentCompleted: true,
        quizAttempted: true,
        quizScore: true,
        quizMaxScore: true,
        timeSpent: true,
        completedAt: true
      }
    })

    const attemptMap = new Map(
      attempts.map(a => [a.lessonId, a])
    )

    // Build lessons array
    const lessons: LessonInCourse[] = courseLessons.map((cl, index) => {
      const { lesson, order } = cl
      const attempt = attemptMap.get(lesson.id)
      
      // Check if locked
      let isLocked = false
      if (index > 0) {
        const prevLesson = courseLessons[index - 1]
        const prevAttempt = attemptMap.get(prevLesson.lesson.id)
        isLocked = !prevAttempt?.passed
      }
      
      return {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        description: lesson.description,
        difficulty: lesson.difficulty,
        order,
        isLocked,
        hasQuiz: lesson.quizId !== null,
        quizId: lesson.quizId,
        attempt: attempt ? {
          passed: attempt.passed,
          contentCompleted: attempt.contentCompleted,
          quizAttempted: attempt.quizAttempted, 
          quizScore: attempt.quizScore,
          quizMaxScore: attempt.quizMaxScore,
          scorePercentage: attempt.quizMaxScore > 0
            ? Math.round((attempt.quizScore / attempt.quizMaxScore) * 100)
            : 0,
          timeSpent: attempt.timeSpent,
          completedAt: attempt.completedAt.toISOString()
        } : null
      }
    })

    // Calculate progress
    const totalLessons = lessons.length
    const completedLessons = lessons.filter(l => l.attempt?.passed).length
    const progress = totalLessons > 0
      ? Math.round((completedLessons / totalLessons) * 100)
      : 0

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      difficulty: course.difficulty,
      lessons,
      progress,
      hasQuiz: course.quizId !== null,
      quizId: course.quizId
    }
  } catch (error) {
    console.error('Error in getCourseDetail:', error)
    throw error
  }
}

// ============================================
// DASHBOARD QUERIES
// ============================================

export interface DashboardSummary {
  totalPrograms: number
  totalLessons: number
  completedLessons: number
  totalXp: number
  currentLevel: number
  currentStreak: number
  longestStreak: number
  badges: number
}

export interface RecentActivityItem {
  type: 'LESSON_COMPLETED'
  title: string
  timestamp: string
  details: {
    programTitle: string
    courseTitle: string
    score: number
  }
}

export interface DailyActivityData {
  date: string
  hasActivity: boolean
}

export async function getDashboardData(userId: string): Promise<{
  summary: DashboardSummary
  recentActivity: RecentActivityItem[]
  dailyActivity: DailyActivityData[]
}> {
  try {
    // Get active program assignments
    const assignments = await prisma.programAssignment.findMany({
      where: {
        userId,
        isActive: true
      },
      include: {
        program: {
          select: {
            id: true,
            isActive: true,
            courses: {
              include: {
                course: {
                  include: {
                    lessons: {
                      select: { lessonId: true }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    const filteredAssignments = assignments.filter(a => a.program.isActive)

    // ✅ Fixed: Changed variable name from activePrograms to uniquePrograms
    const uniquePrograms = filteredAssignments.reduce((acc, assignment) => {
      if (!acc.some(a => a.program.id === assignment.program.id)) {
        acc.push(assignment)
      }
      return acc
    }, [] as typeof filteredAssignments)
    
    const totalPrograms = uniquePrograms.length  // ✅ Use uniquePrograms
    
    // Get all lesson IDs from unique programs
    const allLessonIds = uniquePrograms.flatMap(a =>  // ✅ Use uniquePrograms
      a.program.courses.flatMap(pc =>
        pc.course.lessons.map(cl => cl.lessonId)
      )
    )

    const totalLessons = allLessonIds.length

    // Get completed lessons
    const completedLessons = await prisma.lessonAttempt.count({
      where: {
        userId,
        lessonId: { in: allLessonIds },
        passed: true
      }
    })

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        level: true,
        streak: true,
        lastActivity:true,
      }
    })

    const currentStreak = user?.streak || 0
  
  // Simple longest streak calculation
  // Option 1: Use current streak (simple)
  const longestStreak = currentStreak
  
  // Option 2: If you add a longestStreak field to User model, use that
  // const longestStreak = user?.longestStreak || currentStreak

  // Get daily activity for last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentActivities = await prisma.lessonAttempt.findMany({
    where: {
      userId,
      completedAt: {
        gte: sevenDaysAgo,
      },
    },
    select: {
      completedAt: true,
    },
  })

  // Build daily activity array
  const dailyActivity: DailyActivityData[] = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)
    
    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const hasActivity = recentActivities.some(
      activity => activity.completedAt >= date && activity.completedAt < nextDay
    )

    dailyActivity.push({
      date: date.toISOString(),
      hasActivity,
    })
  }

    // Get badges count
    const badgesCount = await prisma.userBadge.count({
      where: { userId }
    })

    // Get recent activity
    const recentAttempts = await prisma.lessonAttempt.findMany({
      where: { userId, passed: true },
      include: {
        lesson: {
          select: {
            title: true,
            courses: {
              take: 1,
              include: {
                course: {
                  select: {
                    title: true,
                    programs: {
                      take: 1,
                      include: {
                        program: {
                          select: { title: true }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 5
    })

    return {
      summary: {
        totalPrograms,
        totalLessons,
        completedLessons,
        totalXp: user?.xp || 0,
        currentLevel: user?.level || 1,
        currentStreak: user?.streak || 0,
        longestStreak: longestStreak,
        badges: badgesCount
      },
      recentActivity: recentAttempts.map(attempt => ({
        type: 'LESSON_COMPLETED' as const,
        title: attempt.lesson.title,
        timestamp: attempt.completedAt.toISOString(),
        details: {
          programTitle: attempt.lesson.courses[0]?.course.programs[0]?.program.title || 'Unknown',
          courseTitle: attempt.lesson.courses[0]?.course.title || 'Unknown',
          score: Math.round((attempt.quizScore / attempt.quizMaxScore) * 100)
        }
      })),
      dailyActivity,
    }
  } catch (error) {
    console.error('Error in getDashboardData:', error)
    throw new Error('Failed to fetch dashboard data')
  }
}

// ============================================
// LESSON QUERIES
// ============================================

export interface LessonStepData {
  id: string
  order: number
  type: 'content' | 'game'
  contentType: string | null
  contentData: string | null
  gameType: string | null
  gameConfig: string | null
}

export interface QuizQuestionData {
  id: string
  order: number
  difficulty: number
  gameType: string
  gameConfig: string
  points: number
}

export interface LessonProgressState {
  currentStepIndex: number
  completedSteps: number[]
  accumulatedXp: number
  stepResults: Record<string, any> | null
  lastActivityAt: string
}

export interface LessonDetail {
  id: string
  title: string
  slug: string
  description: string | null
  difficulty: string
  steps: LessonStepData[]
  savedProgress: LessonProgressState | null
  hasQuiz: boolean
  quiz: {
    id: string
    title: string
    description: string | null
    passingScore: number
    questions: QuizQuestionData[]
  } | null
  previousAttempt: {
    passed: boolean
    quizScore: number
    quizMaxScore: number
    scorePercentage: number
    completedAt: string
  } | null
}

export async function getLessonDetail(
  userId: string,
  programId: string,
  courseId: string,
  lessonId: string
): Promise<LessonDetail> {
  try {
    // Verify access through program and course
    const assignment = await prisma.programAssignment.findFirst({
      where: {
        userId,
        programId,
        isActive: true
      }
    })

    if (!assignment) {
      throw new Error('Not enrolled in this program')
    }

    const programCourse = await prisma.programCourse.findFirst({
      where: { programId, courseId }
    })

    if (!programCourse) {
      throw new Error('Course not found in program')
    }

    const courseLesson = await prisma.courseLesson.findFirst({
      where: { courseId, lessonId }
    })

    if (!courseLesson) {
      throw new Error('Lesson not found in course')
    }

    // Get lesson details with steps
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        steps: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            order: true,
            type: true,
            contentType: true,
            contentData: true,
            gameType: true,
            gameConfig: true
          }
        },
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                order: true,
                difficulty: true,
                gameType: true,
                gameConfig: true,
                points: true
              }
            }
          }
        }
      }
    })

    if (!lesson) {
      throw new Error('Lesson not found')
    }

    // Check if lesson is locked
    const allCourseLessons = await prisma.courseLesson.findMany({
      where: { courseId },
      orderBy: { order: 'asc' },
      select: { lessonId: true }
    })

    const currentIndex = allCourseLessons.findIndex(cl => cl.lessonId === lessonId)
    
    if (currentIndex > 0) {
      // Check if previous lesson is passed
      const prevLessonId = allCourseLessons[currentIndex - 1].lessonId
      const prevAttempt = await prisma.lessonAttempt.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId: prevLessonId
          }
        }
      })

      if (!prevAttempt || !prevAttempt.passed) {
        throw new Error('Previous lesson must be completed first')
      }
    }

    // Get previous attempt if exists
    const previousAttempt = await prisma.lessonAttempt.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    })

    const savedProgress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    })

    return {
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      description: lesson.description,
      difficulty: lesson.difficulty,
      steps: lesson.steps.map(step => ({
        id: step.id,
        order: step.order,
        type: step.type as 'content' | 'game',
        contentType: step.contentType,
        contentData: step.contentData,
        gameType: step.gameType,
        gameConfig: step.gameConfig
      })),
      hasQuiz: lesson.quiz !== null,
      quiz: lesson.quiz ? {
        id: lesson.quiz.id,
        title: lesson.quiz.title,
        description: lesson.quiz.description,
        passingScore: lesson.quiz.passingScore,
        questions: lesson.quiz.questions
      } : null,
      previousAttempt: previousAttempt ? {
        passed: previousAttempt.passed,
        quizScore: previousAttempt.quizScore,
        quizMaxScore: previousAttempt.quizMaxScore,
        scorePercentage: previousAttempt.quizMaxScore > 0
          ? Math.round((previousAttempt.quizScore / previousAttempt.quizMaxScore) * 100)
          : 0,
        completedAt: previousAttempt.completedAt.toISOString()
      } : null,
      savedProgress: savedProgress ? {
        currentStepIndex: savedProgress.currentStepIndex,
        completedSteps: JSON.parse(savedProgress.completedSteps) as number[],
        accumulatedXp: savedProgress.accumulatedXp,
        stepResults: savedProgress.stepResults ? JSON.parse(savedProgress.stepResults) : null,  // ✅ ADD THIS
        lastActivityAt: savedProgress.lastActivityAt.toISOString()
      } : null
    }
  } catch (error) {
    console.error('Error in getLessonDetail:', error)
    throw error
  }
}

// UPDATED: Add to apps/web/lib/learner/queries.ts

export interface CurrentLessonData {
  id: string           // For uniqueness
  lessonId: string     // Actual lesson ID
  programId: string    // NEW: for URL construction
  courseId: string     // NEW: for URL construction
  title: string
  courseTitle: string
  programTitle: string
  progress: number
  stepNumber: number
  totalSteps: number
}

/**
 * Get the user's current in-progress lesson with full navigation context
 */
export async function getCurrentLesson(userId: string): Promise<CurrentLessonData | null> {
  try {
    // Find the most recent lesson progress that's not completed
    const progress = await prisma.lessonProgress.findFirst({
      where: {
        userId,
        currentStepIndex: { gt: 0 }, // Started (not just at step 0)
      },
      orderBy: {
        lastActivityAt: 'desc', // Most recently accessed
      },
      include: {
        lesson: {
          include: {
            steps: {
              select: { id: true },
            },
            courses: {
              take: 1,
              include: {
                course: {
                  select: {
                    id: true,      // NEW: courseId for URL
                    title: true,
                    programs: {
                      take: 1,
                      include: {
                        program: {
                          select: {
                            id: true,    // NEW: programId for URL
                            title: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!progress) return null

    // Check if this lesson has already been completed
    const attempt = await prisma.lessonAttempt.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId: progress.lessonId,
        },
      },
    })

    // If lesson is completed, don't show it
    if (attempt?.passed) return null

    const totalSteps = progress.lesson.steps.length
    const currentStep = progress.currentStepIndex + 1 // Convert 0-indexed to 1-indexed

    // Get course and program IDs for URL
    const courseRelation = progress.lesson.courses[0]
    const programRelation = courseRelation?.course.programs[0]

    if (!courseRelation || !programRelation) {
      console.error('Lesson not properly linked to course/program')
      return null
    }

    return {
      id: progress.id,                                  // LessonProgress ID
      lessonId: progress.lessonId,                      // Actual lesson ID
      programId: programRelation.program.id,            // NEW: for URL
      courseId: courseRelation.course.id,               // NEW: for URL
      title: progress.lesson.title,
      courseTitle: courseRelation.course.title,
      programTitle: programRelation.program.title,
      progress: totalSteps > 0 ? Math.round((progress.currentStepIndex / totalSteps) * 100) : 0,
      stepNumber: currentStep,
      totalSteps,
    }
  } catch (error) {
    console.error('Error in getCurrentLesson:', error)
    return null
  }
}