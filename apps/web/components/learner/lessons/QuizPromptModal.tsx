// UPDATED: apps/web/components/learner/lessons/QuizPromptModal.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface QuizPromptModalProps {
  isOpen: boolean
  onTakeNow: () => void
  onTakeLater: () => void
  lessonTitle: string
  isLoading?: boolean  // ✅ NEW: Loading state prop
}

export default function QuizPromptModal({
  isOpen,
  onTakeNow,
  onTakeLater,
  lessonTitle,
  isLoading = false  // ✅ NEW: Default to false
}: QuizPromptModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onTakeLater}  // ✅ Disable click while loading
            className="fixed inset-0 z-50"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              cursor: isLoading ? 'wait' : 'pointer',  // ✅ Show wait cursor
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="max-w-lg w-full rounded-2xl shadow-2xl p-8"
              style={{
                background: 'var(--background)',
                border: '2px solid var(--primary)',
              }}
            >
              {/* ✅ NEW: Loading State */}
              {isLoading ? (
                <>
                  {/* Loading Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="text-center mb-6"
                  >
                    <div
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto"
                      style={{
                        background: 'var(--primary-surface)',
                        border: '3px solid var(--primary)',
                      }}
                    >
                      {/* Spinning loader */}
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-10 h-10 rounded-full"
                        style={{
                          border: '3px solid var(--primary-light)',
                          borderTopColor: 'var(--primary)',
                        }}
                      />
                    </div>
                  </motion.div>

                  {/* Loading Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-4"
                  >
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Saving Your Progress...
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      Please wait a moment
                    </p>
                  </motion.div>
                </>
              ) : (
                <>
                  {/* Success Icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="text-center mb-6"
                  >
                    <div
                      className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto"
                      style={{
                        background: 'var(--success-light)',
                        border: '3px solid var(--success)',
                      }}
                    >
                      <svg
                        className="w-10 h-10"
                        style={{ color: 'var(--success)' }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center mb-6"
                  >
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      🎉 Lesson Content Complete!
                    </h2>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      You've finished all the content in <strong>{lessonTitle}</strong>
                    </p>
                  </motion.div>

                  {/* Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-4 mb-6"
                    style={{
                      background: 'var(--primary-surface)',
                      border: '1px solid var(--primary-light)',
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          background: 'var(--primary-light)',
                          color: 'var(--primary)',
                        }}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p
                          className="text-sm font-medium mb-1"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          Ready for the quiz?
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          Test your knowledge now, or you can come back and take it later from the course page.
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Buttons */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                  >
                    {/* Primary: Take Quiz Now */}
                    <button
                      onClick={onTakeNow}
                      className="w-full px-6 py-4 rounded-lg font-semibold text-lg transition-all"
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
                      Take Quiz Now 🎯
                    </button>

                    {/* Secondary: Take Later */}
                    <button
                      onClick={onTakeLater}
                      className="w-full px-6 py-3 rounded-lg font-medium transition-all"
                      style={{
                        background: 'var(--background)',
                        color: 'var(--text-primary)',
                        border: '2px solid var(--border)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--surface)'
                        e.currentTarget.style.borderColor = 'var(--primary)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--background)'
                        e.currentTarget.style.borderColor = 'var(--border)'
                      }}
                    >
                      I'll Take It Later
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}