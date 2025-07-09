import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Remove admin route protection to avoid conflicts with client-side auth
  // Admin pages handle their own authentication
  
  return res;
}

export const config = {
  matcher: [] // No routes handled by middleware currently
};