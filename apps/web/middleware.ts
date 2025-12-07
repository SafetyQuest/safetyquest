// middleware.ts
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    
    // Check if on login page
    const isOnLoginPage = path === '/login';
    
    // Redirect authenticated users to their respective dashboards
    if (isOnLoginPage && token) {
      if (token.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      if (token.role === 'LEARNER') {
        return NextResponse.redirect(new URL('/learn/dashboard', req.url));
      }
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
        
        // Admin routes - require ADMIN role
        if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
          return token?.role === 'ADMIN';
        }
        
        // Learner routes - require LEARNER role
        if (path.startsWith('/learn') || path.startsWith('/api/learner')) {
          return token?.role === 'LEARNER';
        }
        
        // Other protected routes - just require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/api/admin/:path*',
    '/learn/:path*',
    '/api/learner/:path*'
  ]
};