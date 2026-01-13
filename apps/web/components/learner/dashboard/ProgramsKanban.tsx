// FIXED: apps/web/components/learner/dashboard/ProgramsKanban.tsx
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

interface Tab {
  id: StatusType
  label: string
  icon: JSX.Element
  color: string
  bgColor: string
  activeColor: string
}

export default function ProgramsKanban({ programs }: ProgramsKanbanProps) {
  // Group programs by status
  const inProgress = programs.filter((p) => p.progress > 0 && p.progress < 100)
  const notStarted = programs.filter((p) => p.progress === 0)
  const completed = programs.filter((p) => p.progress === 100)

  const tabs: Tab[] = [
    {
      id: 'inProgress',
      label: 'In Progress',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'var(--warning)',
      bgColor: 'var(--warning-light)',
      activeColor: 'var(--warning-dark)',
    },
    {
      id: 'notStarted',
      label: 'Not Started',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'var(--primary)',
      bgColor: 'var(--primary-surface)',
      activeColor: 'var(--primary-dark)',
    },
    {
      id: 'completed',
      label: 'Completed',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'var(--success)',
      bgColor: 'var(--success-light)',
      activeColor: 'var(--success-dark)',
    },
  ]

  // Default to first tab with programs
  const getDefaultTab = (): StatusType => {
    if (inProgress.length > 0) return 'inProgress'
    if (notStarted.length > 0) return 'notStarted'
    if (completed.length > 0) return 'completed'
    return 'inProgress'
  }

  const [activeTab, setActiveTab] = useState<StatusType>(getDefaultTab())

  const getProgramsForTab = (id: StatusType): Program[] => {
    switch (id) {
      case 'inProgress':
        return inProgress
      case 'notStarted':
        return notStarted
      case 'completed':
        return completed
    }
  }

  const currentPrograms = getProgramsForTab(activeTab)
  const currentTab = tabs.find(t => t.id === activeTab)!

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
    <div>
      {/* Tab Headers - Always show all tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tab) => {
          const tabPrograms = getProgramsForTab(tab.id)
          const isActive = activeTab === tab.id
          const hasPrograms = tabPrograms.length > 0

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 min-w-[150px]"
            >
              <motion.div
                className="flex items-center justify-center space-x-2 px-4 py-3 rounded-lg transition-all"
                style={{
                  background: isActive ? tab.bgColor : 'var(--background)',
                  border: isActive ? `2px solid ${tab.color}` : '2px solid var(--border)',
                  color: isActive ? tab.activeColor : 'var(--text-secondary)',
                  opacity: hasPrograms ? 1 : 0.6,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Icon */}
                <div 
                  className="flex-shrink-0"
                  style={{ color: isActive ? tab.color : 'var(--text-muted)' }}
                >
                  {tab.icon}
                </div>

                {/* Label + Count */}
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm whitespace-nowrap">
                    {tab.label}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold min-w-[24px] text-center"
                    style={{
                      background: isActive ? tab.color : 'var(--surface)',
                      color: isActive ? 'var(--background)' : 'var(--text-muted)',
                    }}
                  >
                    {tabPrograms.length}
                  </span>
                </div>
              </motion.div>
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentPrograms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentPrograms.map((program, index) => (
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
          ) : (
            <div
              className="text-center py-12 rounded-xl"
              style={{
                background: currentTab.bgColor,
                border: `2px dashed ${currentTab.color}`,
              }}
            >
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
                style={{ background: currentTab.color, color: 'var(--background)' }}
              >
                {currentTab.icon}
              </div>
              <p className="font-semibold" style={{ color: 'var(--text-secondary)' }}>
                No {currentTab.label.toLowerCase()} programs
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}