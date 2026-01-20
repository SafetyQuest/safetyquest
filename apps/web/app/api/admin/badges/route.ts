// apps/web/app/api/admin/badges/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@safetyquest/database'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const isAdmin = session.user.role === 'ADMIN' || 
      session.user.roleModel?.permissions?.some(
        (p: any) => p.resource === 'badges' && p.action === 'view'
      )
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all badges with award counts
    const badges = await prisma.badge.findMany({
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' }
      ],
      include: {
        _count: {
          select: { userBadges: true }
        }
      }
    })

    // Get total users for percentage calculation
    const totalUsers = await prisma.user.count()

    // Get recent badge awards (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const recentAwards = await prisma.userBadge.findMany({
      where: {
        awardedAt: { gte: thirtyDaysAgo }
      },
      include: {
        badge: {
          select: { name: true, tier: true, icon: true, badgeKey: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { awardedAt: 'desc' },
      take: 20
    })

    // Calculate statistics
    const stats = {
      totalBadges: badges.length,
      totalXpAvailable: badges.reduce((sum, b) => sum + b.xpBonus, 0),
      totalAwards: badges.reduce((sum, b) => sum + b._count.userBadges, 0),
      byCategory: {} as Record<string, { count: number, awarded: number }>,
      byTier: {} as Record<string, { count: number, awarded: number, xp: number }>,
      mostEarned: [] as any[],
      leastEarned: [] as any[],
      totalUsers
    }

    // Group by category
    for (const badge of badges) {
      if (!stats.byCategory[badge.category]) {
        stats.byCategory[badge.category] = { count: 0, awarded: 0 }
      }
      stats.byCategory[badge.category].count++
      stats.byCategory[badge.category].awarded += badge._count.userBadges
    }

    // Group by tier
    for (const badge of badges) {
      if (!stats.byTier[badge.tier]) {
        stats.byTier[badge.tier] = { count: 0, awarded: 0, xp: 0 }
      }
      stats.byTier[badge.tier].count++
      stats.byTier[badge.tier].awarded += badge._count.userBadges
      stats.byTier[badge.tier].xp += badge.xpBonus
    }

    // Most earned badges
    const sortedByEarned = [...badges].sort((a, b) => b._count.userBadges - a._count.userBadges)
    stats.mostEarned = sortedByEarned.slice(0, 5).map(b => ({
      id: b.id,
      name: b.name,
      tier: b.tier,
      icon: b.icon,
      earnedCount: b._count.userBadges,
      percentage: totalUsers > 0 ? Math.round((b._count.userBadges / totalUsers) * 100) : 0
    }))

    // Least earned (excluding 0)
    const earnedBadges = badges.filter(b => b._count.userBadges > 0)
    const sortedByLeast = [...earnedBadges].sort((a, b) => a._count.userBadges - b._count.userBadges)
    stats.leastEarned = sortedByLeast.slice(0, 5).map(b => ({
      id: b.id,
      name: b.name,
      tier: b.tier,
      icon: b.icon,
      earnedCount: b._count.userBadges,
      percentage: totalUsers > 0 ? Math.round((b._count.userBadges / totalUsers) * 100) : 0
    }))

    // Format badges for response
    const formattedBadges = badges.map(badge => ({
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
      earnedCount: badge._count.userBadges,
      earnedPercentage: totalUsers > 0 ? Math.round((badge._count.userBadges / totalUsers) * 100) : 0
    }))

    return NextResponse.json({
      badges: formattedBadges,
      stats,
      recentAwards: recentAwards.map(a => ({
        id: a.id,
        awardedAt: a.awardedAt,
        badge: a.badge,
        user: a.user
      }))
    })
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}