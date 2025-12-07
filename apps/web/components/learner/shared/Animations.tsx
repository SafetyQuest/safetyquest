// apps/web/components/learner/shared/Animations.tsx

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

// Fade In Animation
export function FadeIn({ 
  children, 
  delay = 0,
  duration = 0.3 
}: { 
  children: ReactNode
  delay?: number
  duration?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  )
}

// Slide Up Animation
export function SlideUp({ 
  children, 
  delay = 0,
  duration = 0.4 
}: { 
  children: ReactNode
  delay?: number
  duration?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  )
}

// Scale In Animation
export function ScaleIn({ 
  children, 
  delay = 0,
  duration = 0.3 
}: { 
  children: ReactNode
  delay?: number
  duration?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration, delay }}
    >
      {children}
    </motion.div>
  )
}

// Slide In From Left
export function SlideInLeft({ 
  children, 
  delay = 0 
}: { 
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

// Slide In From Right
export function SlideInRight({ 
  children, 
  delay = 0 
}: { 
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  )
}

// Stagger Children Animation
export function StaggerContainer({ 
  children,
  staggerDelay = 0.1 
}: { 
  children: ReactNode
  staggerDelay?: number
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  )
}

// Stagger Item (use inside StaggerContainer)
export function StaggerItem({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      {children}
    </motion.div>
  )
}

// Success Animation
export function SuccessAnimation({ 
  children,
  show = true 
}: { 
  children: ReactNode
  show?: boolean
}) {
  if (!show) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
    >
      {children}
    </motion.div>
  )
}

// Bounce Animation
export function BounceIn({ 
  children,
  delay = 0 
}: { 
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay
      }}
    >
      {children}
    </motion.div>
  )
}

// Rotate In Animation
export function RotateIn({ 
  children,
  delay = 0 
}: { 
  children: ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, rotate: -180 }}
      animate={{ opacity: 1, rotate: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {children}
    </motion.div>
  )
}

// Progress Bar Animation
export function AnimatedProgressBar({ 
  progress,
  color = 'blue' 
}: { 
  progress: number
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}) {
  const colors = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    purple: 'bg-purple-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600'
  }

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <motion.div
        className={`h-2 rounded-full ${colors[color]}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  )
}

// Number Counter Animation
export function AnimatedCounter({ 
  value,
  duration = 1 
}: { 
  value: number
  duration?: number
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.2 }}
        key={value}
      >
        {value}
      </motion.span>
    </motion.span>
  )
}

// Shake Animation (for errors)
export function Shake({ 
  children,
  trigger 
}: { 
  children: ReactNode
  trigger: boolean
}) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
      } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  )
}

// Pulse Animation
export function Pulse({ 
  children,
  infinite = false 
}: { 
  children: ReactNode
  infinite?: boolean
}) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 2,
        repeat: infinite ? Infinity : 0,
        ease: 'easeInOut'
      }}
    >
      {children}
    </motion.div>
  )
}

// Card Hover Animation
export function HoverCard({ 
  children,
  className = '' 
}: { 
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Page Transition Wrapper
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}