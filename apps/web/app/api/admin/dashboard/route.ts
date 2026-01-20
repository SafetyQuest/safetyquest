// apps/web/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@safetyquest/database';
import { checkPermission } from '@safetyquest/shared/rbac/api-helpers';
import { authOptions } from '@/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const authCheck = checkPermission(session, 'RESOURCE', 'ACTION');
  
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.reason || 'Unauthorized' }, { status: 401 });
  }

  try {
    const [
      totalUsers,
      totalPrograms,
      activePrograms,
      totalCourses,
      totalLessons,
      totalQuizzes,
      totalUserTypes,
      totalTags,
      totalBadges,
      totalBadgesAwarded,
      // Active users in last 30 days
      activeUsersLast30Days,
      // Top 10 learners with badge counts
      topLearnersRaw,
      // Overdue refreshers
      overdueRefreshersRaw,
      // Recent badge awards (last 7 days)
      recentBadgeAwards,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.program.count(),
      prisma.program.count({ where: { isActive: true } }),
      prisma.course.count(),
      prisma.lesson.count(),
      prisma.quiz.count(),
      prisma.userType.count(),
      prisma.tag.count(),
      prisma.badge.count(),
      prisma.userBadge.count(),
      prisma.user.count({
        where: {
          lastActivity: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          xp: true,
          level: true,
          streak: true,
          _count: {
            select: { badges: true }
          },
          badges: {
            select: {
              badge: {
                select: {
                  tier: true,
                  xpBonus: true
                }
              }
            }
          }
        },
        where: { role: 'LEARNER' },
        orderBy: { xp: 'desc' },
        take: 10,
      }),
      prisma.refresherSchedule.findMany({
        where: { nextDue: { lt: new Date() } },
        include: {
          user: { select: { id: true, name: true } },
          program: { select: { id: true, title: true } },
        },
        take: 20,
        orderBy: { nextDue: 'asc' },
      }),
      prisma.userBadge.findMany({
        where: {
          awardedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          user: { select: { id: true, name: true } },
          badge: { select: { name: true, tier: true, icon: true, xpBonus: true } },
        },
        orderBy: { awardedAt: 'desc' },
        take: 10,
      }),
    ]);

    // Process top learners to include badge breakdown
    const topLearners = topLearnersRaw.map((user) => {
      // Count badges by tier
      const tierCounts = { bronze: 0, silver: 0, gold: 0, platinum: 0 };
      let badgeXp = 0;
      
      for (const ub of user.badges) {
        const tier = ub.badge.tier as keyof typeof tierCounts;
        if (tier in tierCounts) {
          tierCounts[tier]++;
        }
        badgeXp += ub.badge.xpBonus;
      }

      return {
        id: user.id,
        name: user.name,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        totalBadges: user._count.badges,
        badgesByTier: tierCounts,
        badgeXp,
      };
    });

    const overdueRefreshers = overdueRefreshersRaw.map((r) => ({
      ...r,
      daysOverdue: Math.floor((Date.now() - r.nextDue.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    return NextResponse.json({
      overview: {
        totalUsers,
        activeUsersLast30Days,
        totalPrograms,
        activePrograms,
        totalCourses,
        totalLessons,
        totalQuizzes,
        totalUserTypes,
        totalTags,
        totalBadges,
        totalBadgesAwarded,
      },
      userEngagement: {
        topLearners,
      },
      recentActivity: {
        overdueRefreshers,
        recentBadgeAwards: recentBadgeAwards.map((award) => ({
          id: award.id,
          awardedAt: award.awardedAt,
          user: award.user,
          badge: award.badge,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}