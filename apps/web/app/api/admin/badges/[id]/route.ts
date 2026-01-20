// apps/web/app/api/admin/badges/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get badge with all users who earned it
    const badge = await prisma.badge.findUnique({
      where: { id },
      include: {
        userBadges: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                section: true,
                level: true,
                xp: true
              }
            }
          },
          orderBy: { awardedAt: 'desc' }
        },
        _count: {
          select: { userBadges: true }
        }
      }
    })

    if (!badge) {
      return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
    }

    // Get total users for percentage
    const totalUsers = await prisma.user.count()

    // Get first and last awarded dates
    const firstAwarded = badge.userBadges.length > 0 
      ? badge.userBadges[badge.userBadges.length - 1].awardedAt 
      : null
    const lastAwarded = badge.userBadges.length > 0 
      ? badge.userBadges[0].awardedAt 
      : null

    // Get department breakdown
    const departmentBreakdown: Record<string, number> = {}
    for (const ub of badge.userBadges) {
      const dept = ub.user.department || 'Unknown'
      departmentBreakdown[dept] = (departmentBreakdown[dept] || 0) + 1
    }

    return NextResponse.json({
      badge: {
        id: badge.id,
        badgeKey: badge.badgeKey,
        name: badge.name,
        description: badge.description,
        category: badge.category,
        family: badge.family,
        tier: badge.tier,
        icon: badge.icon,
        requirement: badge.requirement,
        xpBonus: badge.xpBonus,
        displayOrder: badge.displayOrder,
        createdAt: badge.createdAt
      },
      stats: {
        earnedCount: badge._count.userBadges,
        totalUsers,
        earnedPercentage: totalUsers > 0 
          ? Math.round((badge._count.userBadges / totalUsers) * 100) 
          : 0,
        firstAwarded,
        lastAwarded,
        departmentBreakdown
      },
      users: badge.userBadges.map(ub => ({
        id: ub.user.id,
        name: ub.user.name,
        email: ub.user.email,
        department: ub.user.department,
        section: ub.user.section,
        level: ub.user.level,
        xp: ub.user.xp,
        awardedAt: ub.awardedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching badge details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}