// apps/web/app/api/learner/programs/[id]/courses/[courseId]/route.ts
// UPDATED to use getServerSession, verifyProgramAccess, and checkCourseUnlocked
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'
import { verifyProgramAccess, checkCourseUnlocked } from '@safetyquest/shared/enrollment'
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
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id, courseId } = await params
    
    try {
      await verifyProgramAccess(session.user.id, id)
      const isUnlocked = await checkCourseUnlocked(session.user.id, id, courseId)
      
      // Use reusable query function
      const course = await getCourseDetail(session.user.id, id, courseId)
      
      return NextResponse.json({ course })
    } catch (error: any) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
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