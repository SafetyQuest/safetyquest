// apps/web/app/api/learner/programs/[id]/route.ts
// UPDATED to use getServerSession and verifyProgramAccess
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { verifyProgramAccess } from '@safetyquest/shared/enrollment'
import { getProgramDetail } from '@/lib/learner/queries'

/**
 * GET /api/learner/programs/[id]
 * Get detailed program view with all courses and their progress
 */
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
    
    try {
      await verifyProgramAccess(session.user.id, id)
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message || 'Access denied' },
        { status: 403 }
      )
    }
    
    // Use reusable query function
    const program = await getProgramDetail(session.user.id, id)
    
    return NextResponse.json({ program })
  } catch (error: any) {
    console.error('Error fetching program detail:', error)
    let statusCode = 500
    if (error.message?.includes('Unauthorized')) {
      statusCode = 401
    } else if (error.message?.includes('Not enrolled')) {
      statusCode = 403
    } else if (error.message?.includes('not found')) {
      statusCode = 404
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}