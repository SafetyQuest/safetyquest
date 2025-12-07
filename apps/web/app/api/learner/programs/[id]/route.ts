// apps/web/app/api/learner/programs/[id]/route.ts
// UPDATED to use reusable query function

import { NextRequest, NextResponse } from 'next/server'
import { requireLearner } from '@/utils/learner-auth'
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
    const user = await requireLearner()
    
    // Use reusable query function
    const program = await getProgramDetail(user.id, params.id)
    
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