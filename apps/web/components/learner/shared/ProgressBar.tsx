// apps/web/components/learner/shared/ProgressBar.tsx
'use client'

interface ProgressBarProps {
  progress: number
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
  animated?: boolean
}

export default function ProgressBar({ 
  progress, 
  height = 'md',
  showLabel = false,
  variant = 'default',
  animated = true
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const getGradient = () => {
    // Auto-determine variant based on progress if variant is 'default'
    if (variant === 'default') {
      if (progress === 100) {
        return 'linear-gradient(90deg, var(--success), var(--success-dark))'
      }
      if (progress >= 70) {
        return 'linear-gradient(90deg, var(--primary-light), var(--primary))'
      }
      if (progress >= 30) {
        return 'linear-gradient(90deg, var(--warning), var(--warning-dark))'
      }
      return 'linear-gradient(90deg, var(--danger), var(--danger-dark))'
    }

    // Use explicit variant
    switch (variant) {
      case 'success':
        return 'linear-gradient(90deg, var(--success), var(--success-dark))'
      case 'warning':
        return 'linear-gradient(90deg, var(--warning), var(--warning-dark))'
      case 'danger':
        return 'linear-gradient(90deg, var(--danger), var(--danger-dark))'
      default:
        return 'linear-gradient(90deg, var(--primary-light), var(--primary))'
    }
  }

  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full">
      <div 
        className={`w-full rounded-full overflow-hidden ${heightClasses[height]}`}
        style={{ background: 'var(--surface)' }}
      >
        <div
          className={`rounded-full relative overflow-hidden ${heightClasses[height]} transition-all duration-700 ease-out`}
          style={{ 
            width: `${clampedProgress}%`,
            background: getGradient(),
          }}
        >
          {/* Shimmer effect (only if animated) */}
          {animated && clampedProgress > 0 && (
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'shimmer 2s infinite',
              }}
            />
          )}
        </div>
      </div>
      
      {showLabel && (
        <div 
          className="text-sm font-medium mt-2 text-right" 
          style={{ color: 'var(--text-secondary)' }}
        >
          {clampedProgress}%
        </div>
      )}
    </div>
  )
}