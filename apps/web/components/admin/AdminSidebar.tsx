'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  ChevronDown, 
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  BookMarked,
  FileText,
  HelpCircle,
  Image,
  Settings,
  UserCog,
  Shield,
  Tag,
  Award
} from 'lucide-react';
import { SignOutButton } from '@/components/admin/SignOutButton';

// Helper to check if user has a specific permission
function hasPermission(session: any, resource: string, action: string): boolean {
  if (!session?.user) return false;
  
  // Legacy admin has all permissions
  if (session.user.role === 'ADMIN') return true;
  
  if (!session.user.roleModel?.permissions) return false;
  
  return session.user.roleModel.permissions.some(
    (p: any) => p.resource === resource && p.action === action
  );
}

// Helper to check if user has admin access
function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions || roleModel.permissions.length === 0) {
    return false;
  }
  return true;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

function NavItem({ href, icon, label, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`
        group flex items-center gap-3 px-4 py-2
        transition-colors duration-[--transition-base]
        ${isActive
          ? 'border-l-3 border-[var(--primary-light)] bg-[var(--primary-surface)] text-[var(--primary)] font-medium'
          : 'text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary-dark)]'
        }
      `}
    >
      <span className="transition-transform duration-[--transition-fast] group-hover:scale-110">
        {icon}
      </span>
      <span className="text-[var(--text-sm)]">{label}</span>
    </Link>
  );
}

export default function AdminSidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname?.startsWith('/admin/settings')
  );
  
  const isActive = (path: string) => pathname === path;
  const isSettingsActive = pathname?.startsWith('/admin/settings');

  // Check permissions for each section (ORIGINAL LOGIC PRESERVED VERBATIM)
  const canViewUsers = hasPermission(session, 'users', 'view');
  const canViewPrograms = hasPermission(session, 'programs', 'view');
  const canCreatePrograms = hasPermission(session, 'programs', 'create');
  const canViewCourses = hasPermission(session, 'courses', 'view');
  const canCreateCourses = hasPermission(session, 'courses', 'create');
  const canViewLessons = hasPermission(session, 'lessons', 'view');
  const canCreateLessons = hasPermission(session, 'lessons', 'create');
  const canViewQuizzes = hasPermission(session, 'quizzes', 'view');
  const canCreateQuizzes = hasPermission(session, 'quizzes', 'create');
  const canViewMedia = hasPermission(session, 'media', 'view');
  const canViewUserTypes = hasPermission(session, 'user-types', 'view');
  const canViewRoles = hasPermission(session, 'roles', 'view');
  const canViewTags = hasPermission(session, 'tags', 'view');
  const canViewBadges = hasPermission(session, 'badges', 'view');

  // Show settings if user has any settings permission (ORIGINAL LOGIC PRESERVED VERBATIM)
  const canViewSettings = canViewUserTypes || canViewRoles || canViewTags || canViewBadges;

  // Check if user can access both dashboards (ORIGINAL LOGIC PRESERVED VERBATIM)
  const legacyAdmin = session?.user?.role === 'ADMIN';
  const newRbacAdmin = canAccessAdmin(session?.user?.roleModel);
  const hasAdminAccess = legacyAdmin || newRbacAdmin;
  
  const isOnAdminDashboard = pathname?.startsWith('/admin');
  const isOnLearnerDashboard = pathname?.startsWith('/learn');

  return (
    <aside className="w-60 bg-[var(--background)] border-r border-[var(--border)] flex flex-col">
      {/* COMPACT HEADER */}
      <div 
        className="px-4 py-3"
        style={{ 
          background: `linear-gradient(to bottom right, var(--primary), var(--primary-dark))`
        }}
      >
        <h1 className="text-lg font-bold text-[var(--text-inverse)]">SafetyQuest</h1>
        <p className="text-xs text-blue-100 mt-0.5">Admin</p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {/* DASHBOARD */}
        <NavItem
          href="/admin"
          icon={<LayoutDashboard className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
          label="Dashboard"
          isActive={isActive('/admin')}
        />

        {/* USERS */}
        {canViewUsers && (
          <NavItem
            href="/admin/users"
            icon={<Users className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
            label="Users"
            isActive={isActive('/admin/users')}
          />
        )}

        {/* CONTENT SECTION */}
        {((canViewPrograms && canCreatePrograms) || 
          (canViewCourses && canCreateCourses) || 
          (canViewLessons && canCreateLessons) || 
          (canViewQuizzes && canCreateQuizzes)) && (
          <>
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Content</h3>
            </div>
            
            {canViewPrograms && canCreatePrograms && (
              <NavItem
                href="/admin/programs"
                icon={<BookOpen className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
                label="Programs"
                isActive={isActive('/admin/programs')}
              />
            )}
            {canViewCourses && canCreateCourses && (
              <NavItem
                href="/admin/courses"
                icon={<BookMarked className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
                label="Courses"
                isActive={isActive('/admin/courses')}
              />
            )}
            {canViewLessons && canCreateLessons && (
              <NavItem
                href="/admin/lessons"
                icon={<FileText className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
                label="Lessons"
                isActive={isActive('/admin/lessons')}
              />
            )}
            {canViewQuizzes && canCreateQuizzes && (
              <NavItem
                href="/admin/quizzes"
                icon={<HelpCircle className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
                label="Quizzes"
                isActive={isActive('/admin/quizzes')}
              />
            )}
          </>
        )}

        {/* MEDIA */}
        {canViewMedia && (
          <>
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">Resources</h3>
            </div>
            <NavItem
              href="/admin/media"
              icon={<Image className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--primary-dark)]" />}
              label="Media Library"
              isActive={isActive('/admin/media')}
            />
          </>
        )}

        {/* SETTINGS */}
        {canViewSettings && (
          <>
            <div className="px-4 pt-3 pb-1">
              <h3 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">System</h3>
            </div>
            
            <div className="px-2">
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className={`
                  w-full flex items-center justify-between gap-2 px-4 py-2
                  text-[var(--text-primary)] font-medium
                  transition-colors duration-[--transition-base]
                  ${isSettingsActive 
                    ? 'text-[var(--primary)]' 
                    : 'hover:text-[var(--primary-dark)]'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-[var(--text-sm)]">Settings</span>
                </div>
                <ChevronDown 
                  className={`w-3 h-3 transition-transform duration-[--transition-base] ${
                    settingsOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              <div 
                className={`
                  overflow-hidden transition-all duration-[--transition-base]
                  ${settingsOpen ? 'max-h-64 mt-1' : 'max-h-0'}
                `}
              >
                <div className="pl-6 border-l-2 border-[var(--border)] ml-2.5 space-y-0.5 py-0.5">
                  {canViewUserTypes && (
                    <Link
                      href="/admin/settings/user-types"
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-r text-[13px]
                        transition-colors duration-[--transition-base]
                        ${isActive('/admin/settings/user-types')
                          ? 'border-l-2 border-[var(--primary-light)] bg-[var(--primary-surface)] text-[var(--primary)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary-dark)]'
                        }
                      `}
                    >
                      <UserCog className="w-3 h-3" />
                      User Types
                    </Link>
                  )}
                  {canViewRoles && (
                    <Link
                      href="/admin/settings/roles"
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-r text-[13px]
                        transition-colors duration-[--transition-base]
                        ${isActive('/admin/settings/roles')
                          ? 'border-l-2 border-[var(--primary-light)] bg-[var(--primary-surface)] text-[var(--primary)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary-dark)]'
                        }
                      `}
                    >
                      <Shield className="w-3 h-3" />
                      Roles
                    </Link>
                  )}
                  {canViewTags && (
                    <Link
                      href="/admin/settings/tags"
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-r text-[13px]
                        transition-colors duration-[--transition-base]
                        ${isActive('/admin/settings/tags')
                          ? 'border-l-2 border-[var(--primary-light)] bg-[var(--primary-surface)] text-[var(--primary)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary-dark)]'
                        }
                      `}
                    >
                      <Tag className="w-3 h-3" />
                      Tags
                    </Link>
                  )}
                  {canViewBadges && (
                    <Link
                      href="/admin/settings/badges"
                      className={`
                        flex items-center gap-2 px-2 py-1.5 rounded-r text-[13px]
                        transition-colors duration-[--transition-base]
                        ${isActive('/admin/settings/badges')
                          ? 'border-l-2 border-[var(--primary-light)] bg-[var(--primary-surface)] text-[var(--primary)] font-medium'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary-dark)]'
                        }
                      `}
                    >
                      <Award className="w-3 h-3" />
                      Badges
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </nav>

      {/* COMPACT USER SECTION */}
      <div className="border-t border-[var(--border)] p-3 space-y-2 bg-[var(--surface)]">
        <div className="flex items-center gap-2">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[var(--text-inverse)] text-xs"
            style={{ 
              background: `linear-gradient(to bottom right, var(--primary), var(--primary-dark))` 
            }}
          >
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[var(--text-primary)] text-[13px] truncate">{session.user.name}</p>
            <p className="text-[10px] text-[var(--text-muted)] truncate">{session.user.email}</p>
          </div>
        </div>
        
        {/* DASHBOARD SWITCHER - COMPACT */}
        {hasAdminAccess && isOnAdminDashboard && (
          <Link
            href="/learn/dashboard"
            className="
              flex items-center justify-center gap-1.5 px-3 py-2
              bg-gradient-to-r from-[var(--success)] to-[var(--success-dark)]
              text-[var(--text-inverse)] rounded text-[13px] font-medium
              hover:scale-[1.02] active:scale-[0.98]
              transition-transform duration-[--transition-fast]
            "
            title="Switch to My Training"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>My Training</span>
          </Link>
        )}
        
        <SignOutButton />
      </div>
    </aside>
  );
}