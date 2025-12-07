// apps/web/components/learner/shared/ProgressBar.tsx

interface ProgressBarProps {
  progress: number
  height?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function ProgressBar({ 
  progress, 
  height = 'md',
  showLabel = false 
}: ProgressBarProps) {
  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4'
  }

  const getColor = () => {
    if (progress === 100) return 'bg-green-600'
    if (progress >= 75) return 'bg-blue-600'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="w-full">
      <div className={`w-full bg-gray-200 rounded-full ${heightClasses[height]} overflow-hidden`}>
        <div
          className={`${getColor()} ${heightClasses[height]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <div className="text-xs text-gray-600 mt-1 text-right">
          {progress}%
        </div>
      )}
    </div>
  )
}