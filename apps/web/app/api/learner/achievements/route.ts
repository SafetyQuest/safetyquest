// apps/web/app/api/learner/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user info with level and XP
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        xp: true,
        level: true,
        _count: {
          select: { badges: true }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch ALL badge definitions + earned status for user
    const allBadges = await prisma.badge.findMany({
      select: {
        id: true,
        badgeKey: true,
        name: true,
        description: true,
        category: true,
        family: true,
        tier: true,
        icon: true,
        requirement: true,
        xpBonus: true
      }
    })

    const earnedBadgeIds = new Set(
      await prisma.userBadge.findMany({
        where: { userId: session.user.id },
        select: { badgeId: true }
      }).then(records => records.map(r => r.badgeId))
    )

    // Enrich with earned status
    const badges = allBadges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id),
      awardedAt: earnedBadgeIds.has(badge.id) 
        ? new Date() // or fetch actual date if needed
        : null
    }))

    const totalBadges = allBadges.length

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        xp: user.xp,
        level: user.level,
        earnedBadgesCount: user._count.badges,
        totalBadges
      },
      badges // ← flat list, just like admin
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}