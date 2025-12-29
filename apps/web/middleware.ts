// apps/web/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

// ✅ Define learner-only permissions (these don't grant admin access)
const LEARNER_ONLY_PERMISSIONS = [
  'programs.view',
  'courses.view',
  'lessons.view',
  'quizzes.view',
  'badges.view'
];

// ✅ UPDATED: Check if user has permissions beyond learner-only list
function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions || roleModel.permissions.length === 0) {
    return false;
  }

  // Get user's permission names
  const userPermissions = roleModel.permissions.map((p: any) => p.name);
  
  // Check if user has ANY permission that's NOT in the learner-only list
  const hasNonLearnerPermission = userPermissions.some(
    (perm: string) => !LEARNER_ONLY_PERMISSIONS.includes(perm)
  );
  
  return hasNonLearnerPermission;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    const isOnLoginPage = path === '/login';

    if (isOnLoginPage && token) {
      const legacyAdmin = token.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token.roleModel);
      const hasAdminAccess = legacyAdmin || newRbacAdmin;

      if (hasAdminAccess) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/learn/dashboard', req.url));
    }

    // Block learners from admin pages
    if (path.startsWith('/admin')) {
      const legacyAdmin = token?.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token?.roleModel);
      const hasAdminAccess = legacyAdmin || newRbacAdmin;

      if (!hasAdminAccess) {
        return NextResponse.redirect(new URL('/learn/dashboard', req.url));
      }
    }

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

        if (path === '/login') {
          return true;
        }

        if (!token) {
          return false;
        }

        // Admin API routes - block learners
        if (path.startsWith('/api/admin')) {
          const legacyAdmin = token.role === 'ADMIN';
          const newRbacAdmin = canAccessAdmin(token.roleModel as any);
          return legacyAdmin || newRbacAdmin;
        }

        // Learner routes - allow all authenticated users
        if (path.startsWith('/learn') || path.startsWith('/api/learner')) {
          return true;
        }

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