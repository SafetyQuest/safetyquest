'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

export default function AdminSidebar({ session }: { session: any }) {
  const pathname = usePathname();
  const [settingsOpen, setSettingsOpen] = useState(
    pathname?.startsWith('/admin/settings')
  );

  const isActive = (path: string) => pathname === path;
  const isSettingsActive = pathname?.startsWith('/admin/settings');

  // Check permissions for each section
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

  // Show settings if user has any settings permission
  const canViewSettings = canViewUserTypes || canViewRoles || canViewTags || canViewBadges;

  return (
    <aside className="w-64 bg-white shadow-md flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-blue-600">SafetyQuest</h2>
        <p className="text-sm text-gray-600">Admin Portal</p>
      </div>

      <nav className="mt-6 flex-1 overflow-y-auto">
        {/* Dashboard - always show for admin users */}
        <Link
          href="/admin"
          className={`flex items-center px-6 py-3 ${
            isActive('/admin')
              ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
          }`}
        >
          <span className="text-xl mr-3">📊</span>
          Dashboard
        </Link>

        {/* Users - only if has users.view */}
        {canViewUsers && (
          <Link
            href="/admin/users"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/users')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl mr-3">👥</span>
            Users
          </Link>
        )}

        {/* Programs - only if can create/manage (not just view for learners) */}
        {canViewPrograms && canCreatePrograms && (
          <Link
            href="/admin/programs"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/programs')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl mr-3">📚</span>
            Programs
          </Link>
        )}

        {/* Courses - only if can create/manage */}
        {canViewCourses && canCreateCourses && (
          <Link
            href="/admin/courses"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/courses')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl mr-3">📖</span>
            Courses
          </Link>
        )}

        {/* Lessons - only if can create/manage */}
        {canViewLessons && canCreateLessons && (
          <Link
            href="/admin/lessons"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/lessons')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl mr-3">📝</span>
            Lessons
          </Link>
        )}

        {/* Quizzes - only if can create/manage */}
        {canViewQuizzes && canCreateQuizzes && (
          <Link
            href="/admin/quizzes"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/quizzes')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl mr-3">❓</span>
            Quizzes
          </Link>
        )}

        {/* Media - only if has media.view */}
        {canViewMedia && (
          <Link
            href="/admin/media"
            className={`flex items-center px-6 py-3 ${
              isActive('/admin/media')
                ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <span className="text-xl mr-3">🖼️</span>
            Media Library
          </Link>
        )}

        {/* Settings Dropdown - only if has any settings permission */}
        {canViewSettings && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`w-full flex items-center justify-between px-6 py-3 ${
                isSettingsActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">⚙️</span>
                Settings
              </div>
              {settingsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {settingsOpen && (
              <div className="bg-gray-50">
                {/* User Types - only if has permission */}
                {canViewUserTypes && (
                  <Link
                    href="/admin/settings/user-types"
                    className={`flex items-center px-6 py-2.5 pl-12 text-sm ${
                      isActive('/admin/settings/user-types')
                        ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <span className="mr-2">👥</span>
                    User Types
                  </Link>
                )}

                {/* Roles & Permissions - only if has permission */}
                {canViewRoles && (
                  <Link
                    href="/admin/settings/roles"
                    className={`flex items-center px-6 py-2.5 pl-12 text-sm ${
                      isActive('/admin/settings/roles')
                        ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <span className="mr-2">🔐</span>
                    Roles & Permissions
                  </Link>
                )}

                {/* Tags - only if has permission */}
                {canViewTags && (
                  <Link
                    href="/admin/settings/tags"
                    className={`flex items-center px-6 py-2.5 pl-12 text-sm ${
                      isActive('/admin/settings/tags')
                        ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <span className="mr-2">🏷️</span>
                    Tags
                  </Link>
                )}

                {/* Badges - only if has permission */}
                {canViewBadges && (
                  <Link
                    href="/admin/settings/badges"
                    className={`flex items-center px-6 py-2.5 pl-12 text-sm ${
                      isActive('/admin/settings/badges')
                        ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                  >
                    <span className="mr-2">🏅</span>
                    Badges
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-6 border-t">
        <div className="text-sm text-gray-600 mb-3">
          <p className="font-medium">{session.user.name}</p>
          <p className="text-xs">{session.user.email}</p>
        </div>
        <SignOutButton />
      </div>
    </aside>
  );
}