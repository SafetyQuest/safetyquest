// apps/web/app/learn/(learner)/not-found.tsx

import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/learn/dashboard"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/learn/programs"
            className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Browse Programs
          </Link>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 mb-3">Looking for something specific?</p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link href="/learn/dashboard" className="text-sm text-blue-600 hover:text-blue-700">
              Dashboard
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/learn/programs" className="text-sm text-blue-600 hover:text-blue-700">
              Programs
            </Link>
            <span className="text-gray-300">•</span>
            <Link href="/learn/profile" className="text-sm text-blue-600 hover:text-blue-700">
              Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}