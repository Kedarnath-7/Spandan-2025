import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Check if accessing protected routes
  if (req.nextUrl.pathname.startsWith('/admin/dashboard') || 
      req.nextUrl.pathname.startsWith('/admin/events') ||
      req.nextUrl.pathname.startsWith('/admin/registrations')) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
  }

  // Check if accessing registration page
  if (req.nextUrl.pathname.startsWith('/register')) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Redirect to login with callback to register page
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/events/:path*', '/admin/registrations/:path*', '/register/:path*']
};