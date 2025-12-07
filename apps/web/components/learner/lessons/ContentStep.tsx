// apps/web/components/learner/lessons/ContentStep.tsx
'use client'

import { LessonStepData } from '@/lib/learner/queries'
import Image from 'next/image'

interface ContentStepProps {
  step: LessonStepData
  onComplete: () => void
  onPrevious?: () => void
}

export default function ContentStep({
  step,
  onComplete,
  onPrevious
}: ContentStepProps) {
  const renderContent = () => {
    const contentType = step.contentType
    const contentData = step.contentData

    if (!contentType || !contentData) {
      return (
        <div className="text-center py-12 text-gray-500">
          No content available
        </div>
      )
    }

    switch (contentType) {
      case 'text':
        return (
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: contentData }}
          />
        )

      case 'image':
        try {
          const imageData = JSON.parse(contentData)
          return (
            <div className="space-y-4">
              {imageData.caption && (
                <h3 className="text-xl font-semibold text-gray-900">
                  {imageData.caption}
                </h3>
              )}
              <div className="relative w-full" style={{ minHeight: '400px' }}>
                <Image
                  src={imageData.url}
                  alt={imageData.alt || 'Lesson image'}
                  fill
                  className="object-contain rounded-lg"
                />
              </div>
              {imageData.description && (
                <p className="text-gray-600 text-center italic">
                  {imageData.description}
                </p>
              )}
            </div>
          )
        } catch (error) {
          return (
            <div className="text-center py-12">
              <img
                src={contentData}
                alt="Lesson content"
                className="max-w-full h-auto mx-auto rounded-lg"
              />
            </div>
          )
        }

      case 'video':
        try {
          const videoData = JSON.parse(contentData)
          return (
            <div className="space-y-4">
              {videoData.title && (
                <h3 className="text-xl font-semibold text-gray-900">
                  {videoData.title}
                </h3>
              )}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={videoData.url}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              </div>
              {videoData.description && (
                <p className="text-gray-600">{videoData.description}</p>
              )}
            </div>
          )
        } catch (error) {
          return (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={contentData}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allowFullScreen
              />
            </div>
          )
        }

      case 'embed':
        return (
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: contentData }}
          />
        )

      default:
        return (
          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap">{contentData}</pre>
          </div>
        )
    }
  }

  return (
    <div className="p-8">
      {/* Content */}
      <div className="mb-8">
        {renderContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        {onPrevious ? (
          <button
            onClick={onPrevious}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            ← Previous
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={onComplete}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          Continue →
        </button>
      </div>
    </div>
  )
}