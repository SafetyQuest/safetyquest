// apps/web/middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const LEARNER_ONLY_PERMISSIONS = [
  'programs.view',
  'courses.view',
  'lessons.view',
  'quizzes.view',
  'badges.view'
];

function canAccessAdmin(roleModel: any): boolean {
  if (!roleModel?.permissions || roleModel.permissions.length === 0) {
    return false;
  }

  const userPermissions = roleModel.permissions.map((p: any) => p.name);
  
  const hasNonLearnerPermission = userPermissions.some(
    (perm: string) => !LEARNER_ONLY_PERMISSIONS.includes(perm)
  );
  
  return hasNonLearnerPermission;
}

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 🆕 CRITICAL FIX: Allow password change API to bypass middleware redirect
    if (path === '/api/auth/change-password') {
      return NextResponse.next();
    }

    // PASSWORD CHANGE ENFORCEMENT (only for pages, not APIs)
    if (token?.mustChangePassword === true && path !== '/auth/set-password') {
      return NextResponse.redirect(new URL('/auth/set-password', req.url));
    }

    // Prevent accessing set-password if not needed
    if (path === '/auth/set-password' && token?.mustChangePassword === false) {
      const legacyAdmin = token.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token.roleModel);
      const hasAdminAccess = legacyAdmin || newRbacAdmin;

      if (hasAdminAccess) {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return NextResponse.redirect(new URL('/learn/dashboard', req.url));
    }

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

    if (path.startsWith('/admin')) {
      const legacyAdmin = token?.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token?.roleModel);
      const hasAdminAccess = legacyAdmin || newRbacAdmin;

      if (!hasAdminAccess) {
        return NextResponse.redirect(new URL('/learn/dashboard', req.url));
      }
    }

    if (path === '/') {
      // Anonymous visitors — including search engine and Safe Browsing crawlers —
      // fall through to the public landing page at app/page.tsx. Without this
      // guard an unauthenticated request would be sent to /learn/dashboard, which
      // bounces straight back to /login, leaving the site with no publicly
      // reachable content at all.
      if (!token) {
        return NextResponse.next();
      }

      const legacyAdmin = token.role === 'ADMIN';
      const newRbacAdmin = canAccessAdmin(token.roleModel);
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

        // Public landing page. Must stay reachable without a session so that
        // crawlers see real content instead of a redirect to a credential form.
        // The authenticated redirect to /admin or /learn/dashboard still happens
        // in the middleware body above.
        if (path === '/') {
          return true;
        }

        // 🆕 CRITICAL FIX: Allow password change API and set-password page for authenticated users
        if (path === '/auth/set-password' || path === '/api/auth/change-password') {
          return !!token;
        }

        if (!token) {
          return false;
        }

        // Remove /api/admin from authorized check to prevent blocking password change API
        if (path.startsWith('/api/admin')) {
          const legacyAdmin = token.role === 'ADMIN';
          const newRbacAdmin = canAccessAdmin(token.roleModel as any);
          return legacyAdmin || newRbacAdmin;
        }

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
    '/api/admin/:path*',  // Keep this but handle change-password specially
    '/learn/:path*',
    '/api/learner/:path*',
    '/auth/set-password'
  ]
};