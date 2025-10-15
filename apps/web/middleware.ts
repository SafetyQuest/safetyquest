import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isOnLoginPage = req.nextUrl.pathname === '/admin/login';

    // Redirect authenticated users away from login page to dashboard
    if (isOnLoginPage && token) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isOnLoginPage = req.nextUrl.pathname === '/admin/login';
        
        // Allow access to login page without authentication
        if (isOnLoginPage) {
          return true;
        }
        
        // Require authentication for other admin pages
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*']
};