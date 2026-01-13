// apps/web/components/learner/dashboard/ProgramsKanban.tsx
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ProgramCard from './ProgramCard'

interface Program {
  id: string
  title: string
  description: string | null
  totalLessons: number
  completedLessons: number
  progress: number
}

interface ProgramsKanbanProps {
  programs: Program[]
}

type StatusType = 'inProgress' | 'notStarted' | 'completed'

interface StatusSection {
  id: StatusType
  title: string
  icon: JSX.Element
  color: string
  bgColor: string
  borderColor: string
  defaultExpanded: boolean
}

export default function ProgramsKanban({ programs }: ProgramsKanbanProps) {
  // Group programs by status
  const inProgress = programs.filter((p) => p.progress > 0 && p.progress < 100)
  const notStarted = programs.filter((p) => p.progress === 0)
  const completed = programs.filter((p) => p.progress === 100)

  const sections: StatusSection[] = [
    {
      id: 'inProgress',
      title: 'In Progress',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      ),
      color: 'var(--warning)',
      bgColor: 'var(--warning-light)',
      borderColor: 'var(--warning)',
      defaultExpanded: true,
    },
    {
      id: 'notStarted',
      title: 'Not Started',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'var(--primary)',
      bgColor: 'var(--primary-surface)',
      borderColor: 'var(--primary-light)',
      defaultExpanded: true,
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'var(--success)',
      bgColor: 'var(--success-light)',
      borderColor: 'var(--success)',
      defaultExpanded: false,
    },
  ]

  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<StatusType>>(
    new Set(sections.filter((s) => s.defaultExpanded).map((s) => s.id))
  )

  const toggleSection = (id: StatusType) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getProgramsForSection = (id: StatusType): Program[] => {
    switch (id) {
      case 'inProgress':
        return inProgress
      case 'notStarted':
        return notStarted
      case 'completed':
        return completed
    }
  }

  if (programs.length === 0) {
    return (
      <div
        className="text-center py-16 rounded-xl"
        style={{
          background: 'var(--background)',
          border: '2px dashed var(--border)',
        }}
      >
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
          style={{ background: 'var(--surface)' }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: 'var(--text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
          No programs assigned yet
        </p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Contact your administrator to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => {
        const sectionPrograms = getProgramsForSection(section.id)
        const isExpanded = expandedSections.has(section.id)

        // Don't render section if no programs
        if (sectionPrograms.length === 0) return null

        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: sectionIndex * 0.1 }}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full group"
            >
              <div
                className="flex items-center justify-between p-4 rounded-xl mb-4 transition-all hover:shadow-md"
                style={{
                  background: section.bgColor,
                  border: `2px solid ${section.borderColor}`,
                }}
              >
                <div className="flex items-center space-x-3">
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-lg transition-transform group-hover:scale-110"
                    style={{
                      background: section.color,
                      color: 'var(--background)',
                    }}
                  >
                    {section.icon}
                  </div>

                  {/* Title & Count */}
                  <div className="text-left">
                    <h3
                      className="text-lg font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {section.title}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {sectionPrograms.length}{' '}
                      {sectionPrograms.length === 1 ? 'program' : 'programs'}
                    </p>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ color: section.color }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </motion.div>
              </div>
            </button>

            {/* Section Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sectionPrograms.map((program, index) => (
                      <motion.div
                        key={program.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <ProgramCard program={program} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}