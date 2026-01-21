// apps/web/app/api/learner/achievements/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { PrismaClient } from '@safetyquest/database'
import { BadgeChecker } from '@safetyquest/shared/gamification'

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

    const checker = new BadgeChecker(prisma)
    
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

    // Get badges grouped by family with earned status
    const badgesByFamily = await checker.getBadgesByFamily(session.user.id)
    
    // Get total badge count
    const totalBadges = await prisma.badge.count()

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        xp: user.xp,
        level: user.level,
        earnedBadgesCount: user._count.badges,
        totalBadges
      },
      badgesByFamily
    })
  } catch (error) {
    console.error('Error fetching achievements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}