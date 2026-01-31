// apps/web/components/learner/layout/LearnerNav.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signOut } from 'next-auth/react'
import { Building2, GraduationCap } from 'lucide-react' // ✅ Add this import
import { useSession } from 'next-auth/react' // ✅ Add this import

// ✅ Helper to check if user has admin access
function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions || roleModel.permissions.length === 0) {
    return false;
  }
  return true;
}

interface LearnerNavProps {
  user: {
    name: string
    email: string
  }
}

export default function LearnerNav({ user }: LearnerNavProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  // ✅ Get session for client-side checks
  const { data: session } = useSession()

  const navItems = [
    { name: 'Dashboard', href: '/learn/dashboard', icon: '📊' },
    { name: 'My Learning', href: '/learn/programs', icon: '📚' },
    { name: 'Achievements', href: '/learn/achievements', icon: '🏆' },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
  }
  
  // ✅ Check if user can access admin dashboard
  const legacyAdmin = session?.user?.role === 'ADMIN';
  const newRbacAdmin = canAccessAdmin(session?.user?.roleModel);
  const hasAdminAccess = legacyAdmin || newRbacAdmin;
  
  const isOnAdminDashboard = pathname?.startsWith('/admin');
  const isOnLearnerDashboard = pathname?.startsWith('/learn');

  return (
    <nav 
      className="sticky top-0 z-50 shadow-md"
      style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)' 
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center">
            {/* Logo */}
            <Link 
              href="/learn/dashboard" 
              className="flex items-center space-x-3 group"
            >
              <motion.div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'var(--primary-light)' }}
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>S</span>
              </motion.div>
              <div className="hidden sm:block">
                <span className="text-xl font-bold" style={{ color: 'var(--text-inverse)' }}>
                  SafetyQuest
                </span>
                <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  TetraPak Safety Training
                </div>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{
                      color: active ? 'var(--text-inverse)' : 'rgba(255, 255, 255, 0.85)',
                      background: active ? 'rgba(0, 189, 242, 0.2)' : 'transparent',
                    }}
                  >
                    <span className="flex items-center space-x-2">
                      <span className="text-base">{item.icon}</span>
                      <span>{item.name}</span>
                    </span>
                    {active && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full"
                        style={{ background: 'var(--primary-light)' }}
                        initial={false}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Right side - Dashboard Switcher, User Menu & Mobile Toggle */}
          <div className="flex items-center space-x-2">
            {/* ✅ Dashboard Switcher - Desktop only */}
            {hasAdminAccess && isOnLearnerDashboard && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-medium"
                title="Switch to Admin Portal"
              >
                <Building2 className="w-4 h-4" />
                <span className="hidden lg:inline">Admin Portal</span>
              </Link>
            )}
            
            {/* Desktop User Menu */}
            <div className="hidden sm:flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium" style={{ color: 'var(--text-inverse)' }}>
                  {user.name}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  {user.email}
                </div>
              </div>
              
              {/* User Avatar */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200"
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {getUserInitials(user.name)}
                </button>
                
                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg overflow-hidden z-50"
                      style={{
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {/* ✅ Dashboard Switcher in User Menu - Mobile friendly */}
                      {hasAdminAccess && isOnLearnerDashboard && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-100"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          <Building2 className="w-4 h-4" />
                          Admin Portal
                        </Link>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm font-medium transition-colors"
                        style={{ color: 'var(--danger)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--danger-light)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sign Out Button (Mobile) */}
            <button
              onClick={handleSignOut}
              className="sm:hidden px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                background: 'rgba(255, 0, 0, 0.15)',
                color: 'var(--text-inverse)',
              }}
            >
              Sign Out
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md transition-colors"
              style={{
                color: 'var(--text-inverse)',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
              aria-label="Toggle menu"
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{
              background: 'var(--primary-dark)',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors"
                    style={{
                      color: active ? 'var(--text-inverse)' : 'rgba(255, 255, 255, 0.85)',
                      background: active ? 'rgba(0, 189, 242, 0.2)' : 'transparent',
                    }}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {/* ✅ Dashboard Switcher - Mobile */}
              {hasAdminAccess && isOnLearnerDashboard && (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors"
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    background: 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Building2 className="w-5 h-5" />
                  <span>Admin Portal</span>
                </Link>
              )}
            </div>
            
            {/* Mobile User Info */}
            <div 
              className="pt-4 pb-3 border-t"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div className="px-4 flex items-center">
                <div 
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm"
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                  }}
                >
                  {getUserInitials(user.name)}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium" style={{ color: 'var(--text-inverse)' }}>
                    {user.name}
                  </div>
                  <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                    {user.email}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-outside handler for user menu */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </nav>
  )
}