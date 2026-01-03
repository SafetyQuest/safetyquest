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
  // Helper function to convert YouTube URL to embed format
  const getYouTubeEmbedUrl = (url: string): string => {
    try {
      // Handle youtube.com/watch?v=VIDEO_ID
      const watchMatch = url.match(/[?&]v=([^&]+)/)
      if (watchMatch) {
        return `https://www.youtube.com/embed/${watchMatch[1]}`
      }
      
      // Handle youtu.be/VIDEO_ID
      const shortMatch = url.match(/youtu\.be\/([^?]+)/)
      if (shortMatch) {
        return `https://www.youtube.com/embed/${shortMatch[1]}`
      }
      
      // Handle youtube.com/embed/VIDEO_ID (already in correct format)
      if (url.includes('/embed/')) {
        return url
      }
      
      // If none match, return original URL
      return url
    } catch (error) {
      return url
    }
  }

  const renderContent = () => {
    const contentType = step.contentType
    const contentData = step.contentData

    if (!contentType || !contentData) {
      return (
        <div 
          className="text-center py-12"
          style={{ color: 'var(--text-muted)' }}
        >
          No content available
        </div>
      )
    }

    switch (contentType) {
      case 'text':
        try {
          const textData = JSON.parse(contentData)
          const htmlContent = textData.html || contentData
          return (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
              style={{ color: 'var(--text-primary)' }}
            />
          )
        } catch (error) {
          return (
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: contentData }}
              style={{ color: 'var(--text-primary)' }}
            />
          )
        }

      case 'image':
        try {
          const imageData = JSON.parse(contentData)
          return (
            <div className="space-y-4">
              {imageData.caption && (
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
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
                <p 
                  className="text-center italic"
                  style={{ color: 'var(--text-secondary)' }}
                >
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
          const embedUrl = getYouTubeEmbedUrl(videoData.url)
          
          return (
            <div className="space-y-4">
              {videoData.title && (
                <h3 
                  className="text-xl font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {videoData.title}
                </h3>
              )}
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={embedUrl}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  allowFullScreen
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  title={videoData.title || 'Video content'}
                />
              </div>
              {videoData.description && (
                <p style={{ color: 'var(--text-secondary)' }}>
                  {videoData.description}
                </p>
              )}
            </div>
          )
        } catch (error) {
          // Fallback for plain URL string
          const embedUrl = getYouTubeEmbedUrl(contentData)
          return (
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                src={embedUrl}
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                title="Video content"
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
      <div 
        className="flex items-center justify-between pt-6"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {onPrevious ? (
          <button
            onClick={onPrevious}
            className="px-6 py-3 rounded-md font-medium transition-colors"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              background: 'var(--background)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--background)'
            }}
          >
            ← Previous
          </button>
        ) : (
          <div />
        )}

        <button
          onClick={onComplete}
          className="px-6 py-3 rounded-md font-medium transition-colors"
          style={{
            background: 'var(--primary)',
            color: 'var(--text-inverse)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--primary-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--primary)'
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}