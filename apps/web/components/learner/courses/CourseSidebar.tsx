// apps/web/components/learner/courses/CourseSidebar.tsx
'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { CourseDetail, LessonInCourse } from '@/lib/learner/queries'

interface CourseSidebarProps {
  course: CourseDetail
  programId: string
  courseId: string
  nextLesson?: LessonInCourse | null
}

export default function CourseSidebar({ course, programId, courseId, nextLesson }: CourseSidebarProps) {
  const completedLessons = course.lessons.filter(l => l.attempt?.passed).length

  return (
    <div className="space-y-6">
      {/* Quick Stats Card */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl shadow-sm p-6"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border)',
        }}
      >
        <h3 
          className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center space-x-2"
          style={{ color: 'var(--text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span>Course Stats</span>
        </h3>

        <div className="space-y-4">
          {/* Total Lessons */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Total Lessons
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: 'var(--primary)' }}
            >
              {course.lessons.length}
            </span>
          </div>

          {/* Completed */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Completed
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: 'var(--success)' }}
            >
              {completedLessons}
            </span>
          </div>

          {/* Remaining */}
          <div className="flex items-center justify-between">
            <span 
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Remaining
            </span>
            <span 
              className="text-2xl font-bold"
              style={{ color: 'var(--text-primary)' }}
            >
              {course.lessons.length - completedLessons}
            </span>
          </div>

          {/* Progress Bar */}
          <div 
            className="pt-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-xs font-medium"
                style={{ color: 'var(--text-secondary)' }}
              >
                Course Progress
              </span>
              <span 
                className="text-sm font-bold"
                style={{ color: 'var(--text-primary)' }}
              >
                {course.progress}%
              </span>
            </div>
            <div 
              className="h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--surface)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{
                  background:
                    course.progress === 100
                      ? 'var(--success)'
                      : course.progress >= 50
                      ? 'var(--primary)'
                      : 'var(--warning)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${course.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Next Lesson Card */}
      {nextLesson && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl shadow-sm p-6"
          style={{
            background: 'linear-gradient(135deg, var(--primary-surface) 0%, var(--surface) 100%)',
            border: '1px solid var(--primary-light)',
          }}
        >
          <h3 
            className="text-sm font-bold uppercase tracking-wide mb-4 flex items-center space-x-2"
            style={{ color: 'var(--primary)' }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Up Next</span>
          </h3>

          <div>
            <h4 
              className="font-bold mb-2 line-clamp-2"
              style={{ color: 'var(--text-primary)' }}
            >
              {nextLesson.title}
            </h4>
            
            {nextLesson.description && (
              <p 
                className="text-xs mb-3 line-clamp-2"
                style={{ color: 'var(--text-secondary)' }}
              >
                {nextLesson.description}
              </p>
            )}

            <div 
              className="flex items-center space-x-3 text-xs mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              <span className="inline-flex items-center px-2 py-1 rounded-full font-semibold"
                style={{
                  background: nextLesson.difficulty === 'Beginner' 
                    ? 'var(--success-light)' 
                    : nextLesson.difficulty === 'Intermediate'
                    ? 'var(--warning-light)'
                    : 'var(--danger-light)',
                  color: nextLesson.difficulty === 'Beginner'
                    ? 'var(--success-dark)'
                    : nextLesson.difficulty === 'Intermediate'
                    ? 'var(--warning-dark)'
                    : 'var(--danger-dark)',
                }}
              >
                {nextLesson.difficulty}
              </span>
              
              {nextLesson.hasQuiz && (
                <span className="inline-flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <span>Has Quiz</span>
                </span>
              )}
            </div>

            <Link href={`/learn/programs/${programId}/courses/${courseId}/lessons/${nextLesson.id}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--background)',
                }}
              >
                <span>{nextLesson.attempt ? 'Continue Lesson' : 'Start Lesson'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Course Quiz Card */}
      {course.hasQuiz && course.progress === 100 && !course.courseQuizAttempt?.passed && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl shadow-sm p-6"
          style={{
            background: 'linear-gradient(135deg, var(--highlight-light) 0%, var(--surface) 100%)',
            border: '1px solid var(--highlight)',
          }}
        >
          <div className="text-center">
            <div className="text-4xl mb-3">🎯</div>
            <h3 
              className="font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Final Quiz Ready!
            </h3>
            <p 
              className="text-xs mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              You've completed all lessons. Take the final assessment to complete this course.
            </p>
            {/* ✅ FIXED: Add Link wrapper */}
            <Link href={`/learn/programs/${programId}/courses/${courseId}/quiz`}>
              <button 
                className="w-full px-4 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
                style={{
                  background: 'var(--highlight)',
                  color: 'var(--background)',
                }}
              >
                Start Final Quiz →
              </button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Quiz Passed - Show if quiz passed */}
      {course.hasQuiz && course.courseQuizAttempt?.passed && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl shadow-sm p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--success-light) 0%, var(--surface) 100%)',
            border: '1px solid var(--success)',
          }}
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 
            className="font-bold mb-2"
            style={{ color: 'var(--success-dark)' }}
          >
            Course Complete!
          </h3>
          <p 
            className="text-xs mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            You've passed the final assessment!
          </p>
          <Link href={`/learn/programs/${programId}`}>
            <button 
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm"
              style={{
                background: 'var(--success)',
                color: 'var(--background)',
              }}
            >
              Back to Program →
            </button>
          </Link>
        </motion.div>
      )}

      {/* Completion Card */}
      {course.progress === 100 && !course.hasQuiz && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl shadow-sm p-6 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--success-light) 0%, var(--surface) 100%)',
            border: '1px solid var(--success)',
          }}
        >
          <div className="text-4xl mb-3">🎉</div>
          <h3 
            className="font-bold mb-2"
            style={{ color: 'var(--success-dark)' }}
          >
            Course Complete!
          </h3>
          <p 
            className="text-xs mb-4"
            style={{ color: 'var(--text-secondary)' }}
          >
            Great job completing all lessons!
          </p>
          <Link href={`/learn/programs/${programId}`}>
            <button 
              className="w-full px-4 py-2 rounded-lg font-semibold text-sm"
              style={{
                background: 'var(--success)',
                color: 'var(--background)',
              }}
            >
              Back to Program →
            </button>
          </Link>
        </motion.div>
      )}

      {/* Learning Tip */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl p-4 text-center"
        style={{
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
        }}
      >
        <div className="text-2xl mb-2">💡</div>
        <p 
          className="text-xs font-medium"
          style={{ color: 'var(--text-secondary)' }}
        >
          <strong style={{ color: 'var(--text-primary)' }}>Pro Tip:</strong> Review completed lessons to reinforce your learning!
        </p>
      </motion.div>
    </div>
  )
}