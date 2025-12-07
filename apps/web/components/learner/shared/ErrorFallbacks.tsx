// apps/web/components/learner/shared/ErrorFallbacks.tsx

import Link from 'next/link'

// Network Error Fallback
export function NetworkErrorFallback({ retry }: { retry?: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
        <span className="text-3xl">📡</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Network Error
      </h3>
      <p className="text-gray-600 mb-6">
        Unable to connect to the server. Please check your internet connection.
      </p>
      {retry && (
        <button
          onClick={retry}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  )
}

// Access Denied Fallback
export function AccessDeniedFallback() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Access Denied
      </h3>
      <p className="text-gray-600 mb-6">
        You don't have permission to access this content.
      </p>
      <Link
        href="/learn/dashboard"
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}

// Not Found Fallback (inline)
export function NotFoundFallback({ 
  title = 'Not Found',
  message = 'The content you\'re looking for doesn\'t exist.',
  actionText = 'Go Back',
  actionHref = '/learn/dashboard'
}: {
  title?: string
  message?: string
  actionText?: string
  actionHref?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
        <span className="text-3xl">🔍</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      <Link
        href={actionHref}
        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
      >
        {actionText}
      </Link>
    </div>
  )
}

// Empty State Fallback
export function EmptyStateFallback({
  icon = '📭',
  title = 'No items yet',
  message = 'Nothing to show here right now.',
  actionText,
  actionHref
}: {
  icon?: string
  title?: string
  message?: string
  actionText?: string
  actionHref?: string
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
        <span className="text-4xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          {actionText}
        </Link>
      )}
    </div>
  )
}

// Locked Content Fallback
export function LockedContentFallback({ 
  reason = 'Complete previous content to unlock this.'
}: { 
  reason?: string 
}) {
  return (
    <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
        <span className="text-3xl">🔒</span>
      </div>
      <h3 className="text-xl font-bold text-gray-700 mb-2">
        Content Locked
      </h3>
      <p className="text-gray-600">{reason}</p>
    </div>
  )
}

// Session Expired Fallback
export function SessionExpiredFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-4">
            <span className="text-4xl">⏱️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Session Expired
          </h1>
          <p className="text-gray-600">
            Your session has expired. Please sign in again to continue.
          </p>
        </div>
        <Link
          href="/learn/login"
          className="inline-block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  )
}

// Maintenance Mode Fallback
export function MaintenanceFallback({
  message = 'We\'re currently performing scheduled maintenance. Please check back soon.'
}: {
  message?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-100 rounded-full mb-4">
            <span className="text-4xl">🔧</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Under Maintenance
          </h1>
          <p className="text-gray-600">{message}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Expected to be back online shortly. Thank you for your patience!
          </p>
        </div>
      </div>
    </div>
  )
}

// Generic Error with Custom Icon
export function GenericErrorFallback({
  icon = '❌',
  title = 'Error',
  message = 'Something went wrong.',
  retry
}: {
  icon?: string
  title?: string
  message?: string
  retry?: () => void
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{message}</p>
      <div className="space-y-3">
        {retry && (
          <button
            onClick={retry}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Try Again
          </button>
        )}
        <Link
          href="/learn/dashboard"
          className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}