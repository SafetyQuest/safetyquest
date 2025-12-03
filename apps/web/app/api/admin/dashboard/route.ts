// apps/web/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { authOptions } from '../../auth/[...nextauth]/route';

const prisma = new PrismaClient();

// GET dashboard analytics
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parallel queries for better performance
    const [
      // Overview counts
      totalUsers,
      usersByRole,
      totalPrograms,
      activePrograms,
      totalCourses,
      totalLessons,
      totalQuizzes,
      totalUserTypes,
      totalTags,
      totalBadges,
      
      // User engagement
      topLearners,
      recentActivity,
      usersWithStreaks,
      
      // Content performance
      mostAttemptedCourses,
      mostAttemptedLessons,
      quizAttempts,
      lessonCompletionStats,
      courseCompletionStats,
      
      // Recent activities
      recentLessonAttempts,
      recentBadges,
      recentUsers,
      overdueRefreshers,
      
      // Program analytics
      programEnrollments,
    ] = await Promise.all([
      // Overview counts
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      prisma.program.count(),
      prisma.program.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.quiz.count(),
      prisma.userType.count(),
      prisma.tag.count(),
      prisma.badge.count(),
      
      // Top learners by XP
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          xp: true,
          level: true,
          streak: true,
          role: true
        },
        where: {
          role: 'LEARNER'
        },
        orderBy: { xp: 'desc' },
        take: 10
      }),
      
      // Users with recent activity
      prisma.user.findMany({
        where: {
          lastActivity: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        select: {
          id: true,
          name: true,
          lastActivity: true
        }
      }),
      
      // Users with active streaks
      prisma.user.findMany({
        where: {
          streak: { gt: 0 },
          role: 'LEARNER'
        },
        select: {
          id: true,
          name: true,
          streak: true
        },
        orderBy: { streak: 'desc' },
        take: 10
      }),
      
      // Most attempted courses
      prisma.courseAttempt.groupBy({
        by: ['courseId'],
        _count: true,
        orderBy: {
          _count: {
            courseId: 'desc'
          }
        },
        take: 10
      }),
      
      // Most attempted lessons
      prisma.lessonAttempt.groupBy({
        by: ['lessonId'],
        _count: true,
        orderBy: {
          _count: {
            lessonId: 'desc'
          }
        },
        take: 10
      }),
      
      // Quiz statistics
      prisma.quizAttempt.groupBy({
        by: ['quizId'],
        _count: true,
        _avg: {
          score: true
        },
        where: {
          passed: true
        }
      }),
      
      // Lesson completion stats
      prisma.lessonAttempt.aggregate({
        _avg: {
          quizScore: true,
          timeSpent: true
        },
        _count: true,
        where: {
          passed: true
        }
      }),
      
      // Course completion stats
      prisma.courseAttempt.aggregate({
        _avg: {
          quizScore: true
        },
        _count: true,
        where: {
          passed: true
        }
      }),
      
      // Recent lesson attempts
      prisma.lessonAttempt.findMany({
        take: 10,
        orderBy: { completedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          lesson: {
            select: {
              id: true,
              title: true
            }
          }
        }
      }),
      
      // Recent badges awarded
      prisma.userBadge.findMany({
        take: 10,
        orderBy: { awardedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          badge: {
            select: {
              id: true,
              name: true,
              iconUrl: true
            }
          }
        }
      }),
      
      // Recent user registrations
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          userType: {
            select: {
              name: true
            }
          }
        }
      }),
      
      // Overdue refreshers
      prisma.refresherSchedule.findMany({
        where: {
          nextDue: {
            lt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          program: {
            select: {
              id: true,
              title: true
            }
          }
        },
        take: 20,
        orderBy: { nextDue: 'asc' }
      }),
      
      // Program enrollments
      prisma.programAssignment.groupBy({
        by: ['programId'],
        _count: true
      })
    ]);

    // Fetch course details for most attempted
    const courseDetails = await prisma.course.findMany({
      where: {
        id: {
          in: mostAttemptedCourses.map(c => c.courseId)
        }
      },
      select: {
        id: true,
        title: true,
        difficulty: true
      }
    });

    // Fetch lesson details for most attempted
    const lessonDetails = await prisma.lesson.findMany({
      where: {
        id: {
          in: mostAttemptedLessons.map(l => l.lessonId)
        }
      },
      select: {
        id: true,
        title: true,
        difficulty: true
      }
    });

    // Fetch program details for enrollments
    const programDetails = await prisma.program.findMany({
      where: {
        id: {
          in: programEnrollments.map(p => p.programId)
        }
      },
      select: {
        id: true,
        title: true,
        isActive: true
      }
    });

    // Map course attempts with details
    const coursesWithAttempts = mostAttemptedCourses.map(attempt => ({
      ...courseDetails.find(c => c.id === attempt.courseId),
      attemptCount: attempt._count
    }));

    // Map lesson attempts with details
    const lessonsWithAttempts = mostAttemptedLessons.map(attempt => ({
      ...lessonDetails.find(l => l.id === attempt.lessonId),
      attemptCount: attempt._count
    }));

    // Map program enrollments with details
    const programsWithEnrollments = programEnrollments.map(enrollment => ({
      ...programDetails.find(p => p.id === enrollment.programId),
      enrollmentCount: enrollment._count
    }));

    // Calculate pass rates
    const totalQuizAttemptsCount = await prisma.quizAttempt.count();
    const passedQuizAttemptsCount = await prisma.quizAttempt.count({
      where: { passed: true }
    });
    const overallQuizPassRate = totalQuizAttemptsCount > 0 
      ? (passedQuizAttemptsCount / totalQuizAttemptsCount) * 100 
      : 0;

    // Calculate active users (last 30 days)
    const activeUsersLast30Days = await prisma.user.count({
      where: {
        lastActivity: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    });

    return NextResponse.json({
      overview: {
        totalUsers,
        usersByRole,
        activeUsersLast30Days,
        totalPrograms,
        activePrograms,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalUserTypes,
        totalTags,
        totalBadges
      },
      userEngagement: {
        topLearners,
        recentActivityCount: recentActivity.length,
        usersWithStreaks,
        averageXP: topLearners.reduce((sum, u) => sum + u.xp, 0) / (topLearners.length || 1),
        averageLevel: topLearners.reduce((sum, u) => sum + u.level, 0) / (topLearners.length || 1)
      },
      contentPerformance: {
        mostAttemptedCourses: coursesWithAttempts,
        mostAttemptedLessons: lessonsWithAttempts,
        overallQuizPassRate,
        averageLessonScore: lessonCompletionStats._avg.quizScore || 0,
        averageCourseScore: courseCompletionStats._avg.quizScore || 0,
        averageLessonTime: lessonCompletionStats._avg.timeSpent || 0,
        totalLessonCompletions: lessonCompletionStats._count,
        totalCourseCompletions: courseCompletionStats._count
      },
      recentActivity: {
        lessonAttempts: recentLessonAttempts,
        badgesAwarded: recentBadges,
        newUsers: recentUsers,
        overdueRefreshers: overdueRefreshers.map(r => ({
          ...r,
          daysOverdue: Math.floor(
            (Date.now() - r.nextDue.getTime()) / (1000 * 60 * 60 * 24)
          )
        }))
      },
      programAnalytics: {
        enrollments: programsWithEnrollments.sort(
          (a, b) => b.enrollmentCount - a.enrollmentCount
        )
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}