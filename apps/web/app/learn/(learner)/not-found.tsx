// apps/web/app/learn/(learner)/not-found.tsx

import Link from 'next/link'

export default function NotFound() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--surface)' }}
    >
      <div className="max-w-md w-full text-center">
        {/* 404 Icon */}
        <div 
          className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
          style={{
            background: 'var(--primary-surface)',
            border: '3px solid var(--primary-light)',
          }}
        >
          <svg 
            className="w-10 h-10" 
            style={{ color: 'var(--primary)' }}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* 404 Text */}
        <h1 
          className="text-6xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          404
        </h1>
        
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Page Not Found
        </h2>
        
        <p 
          className="mb-8"
          style={{ color: 'var(--text-secondary)' }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="space-y-3 mb-8">
          <Link
            href="/learn/dashboard"
            className="block w-full px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--primary)',
              color: 'var(--text-inverse)',
            }}
          >
            Go to Dashboard
          </Link>
          
          <Link
            href="/learn/programs"
            className="block w-full px-6 py-3 rounded-lg font-medium transition-all"
            style={{
              background: 'var(--background)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
            }}
          >
            Browse Programs
          </Link>
        </div>

        {/* Quick Links */}
        <div 
          className="pt-8"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p 
            className="text-sm mb-3"
            style={{ color: 'var(--text-secondary)' }}
          >
            Looking for something specific?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Link 
              href="/learn/dashboard" 
              className="text-sm transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Dashboard
            </Link>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <Link 
              href="/learn/programs" 
              className="text-sm transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Programs
            </Link>
            <span style={{ color: 'var(--border-medium)' }}>•</span>
            <Link 
              href="/learn/achievements" 
              className="text-sm transition-colors"
              style={{ color: 'var(--primary)' }}
            >
              Achievements
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}