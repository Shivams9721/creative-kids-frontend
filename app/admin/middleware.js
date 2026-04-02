import { NextResponse } from 'next/server';

export function middleware(request) {
  // Replace 'authToken' with the actual name of your session cookie or JWT
  const token = request.cookies.get('authToken')?.value;

  // If accessing an /admin route and no token is found, redirect to login
  if (request.nextUrl.pathname.startsWith('/admin') && !token) {
    // Redirects to /login, passing the original URL so they can be redirected back after logging in
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};