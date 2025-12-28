// apps/web/middleware.ts
// ⚠️ UPDATED FOR RBAC MIGRATION - Phase 3 (Fixed Admin Access to Learner Routes)
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

/**
 * Helper function to check if a user has admin access
 * Supports both legacy role-based and new RBAC permission-based access
 */
function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions) return false;
  return roleModel.permissions.length > 0;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Check if on login page
    const isOnLoginPage = path === '/login';

    // Redirect authenticated users from login page to appropriate dashboard
    if (isOnLoginPage && token) {
      // ✅ Check if user can access admin using RBAC
      const legacyAdmin = token.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token.roleModel);
      const hasAdminAccess = legacyAdmin || newRbacAdmin;

      if (hasAdminAccess) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      // Otherwise redirect to learner dashboard
      return NextResponse.redirect(new URL('/learn/dashboard', req.url));
    }

    // ✅ Root path redirect - send users to their appropriate dashboard
    if (path === '/') {
      const legacyAdmin = token?.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token?.roleModel);
      const hasAdminAccess = legacyAdmin || newRbacAdmin;

      if (hasAdminAccess) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/learn/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Allow access to login page without authentication
        if (path === '/login') {
          return true;
        }

        // Require authentication for all other protected routes
        if (!token) {
          return false;
        }

        // ✅ UPDATED: Admin routes - allow multiple roles with admin permissions
        if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
          // Support both legacy and new RBAC
          const legacyAdmin = token.role === 'ADMIN';
          const newRbacAdmin = canAccessAdmin(token.roleModel as any);
          return legacyAdmin || newRbacAdmin;
        }

        // ✅ FIXED: Learner routes - ALL authenticated users can access
        // This allows admins to also access their own training
        if (path.startsWith('/learn') || path.startsWith('/api/learner')) {
          return true; // ✅ Allow all authenticated users, including admins
        }

        // Other protected routes - just require authentication
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/',
    '/admin/:path*',
    '/api/admin/:path*',
    '/learn/:path*',
    '/api/learner/:path*'
  ]
};