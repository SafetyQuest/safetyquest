// apps/web/app/api/learner/programs/route.ts
// UPDATED to use reusable query function

import { NextRequest, NextResponse } from 'next/server'
import { requireLearner } from '@/utils/learner-auth'
import { getUserPrograms } from '@/lib/learner/queries'

/**
 * GET /api/learner/programs
 * List all programs the authenticated learner is assigned to
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireLearner()
    
    // Use reusable query function - same logic as Server Components
    const programs = await getUserPrograms(user.id)
    
    return NextResponse.json({ programs })
    
  } catch (error: any) {
    console.error('Error fetching learner programs:', error)
    
    const statusCode = error.message?.includes('Unauthorized') ? 401 : 500
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: statusCode }
    )
  }
}