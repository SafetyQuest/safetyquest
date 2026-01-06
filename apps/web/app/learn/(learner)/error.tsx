// apps/web/app/learn/(learner)/error.tsx
'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Learner interface error:', error)
  }, [error])

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--surface)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{
            background: 'var(--danger-light)',
            border: '3px solid var(--danger)',
          }}
        >
          <svg 
            className="w-10 h-10" 
            style={{ color: 'var(--danger)' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h1 
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Something went wrong!
          </h1>
          <p 
            className="mb-6"
            style={{ color: 'var(--text-secondary)' }}
          >
            We encountered an error while loading this page.
          </p>
        </motion.div>

        {/* Error Details (Development only) */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg p-4 mb-6 text-left"
            style={{
              background: 'var(--danger-light)',
              border: '1px solid var(--danger)',
            }}
          >
            <p 
              className="text-xs font-semibold mb-2"
              style={{ color: 'var(--danger-dark)' }}
            >
              Error Details:
            </p>
            <p 
              className="text-sm font-mono break-words"
              style={{ color: 'var(--danger-dark)' }}
            >
              {error.message}
            </p>
            {error.digest && (
              <p 
                className="text-xs mt-2"
                style={{ color: 'var(--danger)' }}
              >
                Digest: {error.digest}
              </p>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <button
            onClick={reset}
            className="w-full px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--primary)',
              color: 'var(--text-inverse)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-dark)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--primary)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Try Again
          </button>
          
          <a
            href="/learn/dashboard"
            className="block w-full px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--background)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--background)'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            Go to Dashboard
          </a>
        </motion.div>

        {/* Support Message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          If this problem persists, please contact support.
        </motion.p>
      </motion.div>
    </div>
  )
}