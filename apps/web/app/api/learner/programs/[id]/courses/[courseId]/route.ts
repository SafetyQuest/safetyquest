// apps/web/app/api/learner/programs/[id]/courses/[courseId]/route.ts
// UPDATED to use reusable query function

import { NextRequest, NextResponse } from 'next/server'
import { requireLearner } from '@/utils/learner-auth'
import { getCourseDetail } from '@/lib/learner/queries'

/**
 * GET /api/learner/programs/[id]/courses/[courseId]
 * Get course details with all lessons and their progress/lock status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  try {
    const user = await requireLearner()
    
    // Use reusable query function
    const course = await getCourseDetail(user.id, params.id, params.courseId)
    
    return NextResponse.json({ course })
    
  } catch (error: any) {
    console.error('Error fetching course detail:', error)
    
    let statusCode = 500
    if (error.message?.includes('Unauthorized')) {
      statusCode = 401
    } else if (error.message?.includes('Not enrolled') || error.message?.includes('locked')) {
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