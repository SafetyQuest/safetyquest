// apps/web/app/learn/(learner)/programs/[id]/courses/[courseId]/lessons/[lessonId]/result/page.tsx

import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../../../../api/auth/[...nextauth]/route'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function LessonResultPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string; courseId: string; lessonId: string }>
  searchParams: Promise<{ score?: string; maxScore?: string; passed?: string; newBadges?: string }>
}) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/learn/login')
  }

  const { id, courseId, lessonId } = await params
  const search = await searchParams
  
  const score = parseInt(search.score || '0')
  const maxScore = parseInt(search.maxScore || '0')
  const passed = search.passed === 'true'
  const newBadgesCount = parseInt(search.newBadges || '0')

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Result Card */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {/* Header with animated background */}
        <div className={`p-12 text-center ${
          passed
            ? 'bg-gradient-to-br from-green-400 to-green-600'
            : 'bg-gradient-to-br from-yellow-400 to-yellow-600'
        }`}>
          <span className="text-8xl mb-4 block animate-bounce">
            {passed ? '🎉' : '💪'}
          </span>
          <h1 className="text-4xl font-bold text-white mb-3">
            {passed ? 'Lesson Complete!' : 'Keep Practicing!'}
          </h1>
          <p className="text-xl text-white opacity-90">
            {passed
              ? 'Congratulations! You\'ve successfully completed this lesson.'
              : 'You can review the lesson and try again.'}
          </p>
        </div>

        {/* Score Details */}
        <div className="p-8">
          {/* Main Score Display */}
          <div className="text-center mb-8">
            <div className="mb-2 text-gray-600">Your Score</div>
            <div className={`text-7xl font-bold mb-4 ${
              passed ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {percentage}%
            </div>
            <div className="text-gray-600">
              {score} out of {maxScore} points
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-200">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-2xl font-bold text-blue-600">+100 XP</div>
              <div className="text-sm text-gray-600">Experience Points</div>
            </div>
            
            {newBadgesCount > 0 && (
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-purple-600">
                  {newBadgesCount} New Badge{newBadgesCount > 1 ? 's' : ''}!
                </div>
                <div className="text-sm text-gray-600">Achievement Unlocked</div>
              </div>
            )}
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">
              What's Next?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-3">
              {!passed && (
                <Link
                  href={`/learn/programs/${id}/courses/${courseId}/lessons/${lessonId}`}
                  className="flex-1 px-6 py-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium text-center transition-colors"
                >
                  📝 Review Lesson
                </Link>
              )}
              
              <Link
                href={`/learn/programs/${id}/courses/${courseId}`}
                className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-center transition-colors"
              >
                📚 Back to Course
              </Link>
              
              <Link
                href="/learn/dashboard"
                className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium text-center transition-colors"
              >
                🏠 Dashboard
              </Link>
            </div>
          </div>

          {/* Encouragement Message */}
          {passed ? (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <p className="text-green-800 font-medium">
                🌟 Excellent work! Keep up the momentum and continue your learning journey!
              </p>
            </div>
          ) : (
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 font-medium">
                💡 Don't worry! Learning takes time. Review the material and try again when you're ready.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}