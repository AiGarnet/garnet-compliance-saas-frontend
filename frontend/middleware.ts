import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'

export function middleware(request: NextRequest) {
  // Skip middleware for static assets and API routes
  if (
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/static/') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next()
  }

  // For auth-protected routes, check if user is authenticated
  const authToken = request.cookies.get('authToken')?.value || 
                   request.headers.get('authorization')?.replace('Bearer ', '')

  const protectedPaths = ['/dashboard', '/questionnaires', '/vendors', '/compliance', '/billing']
  const subscriptionRequiredPaths = ['/dashboard', '/vendors', '/compliance']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  const isSubscriptionRequiredPath = subscriptionRequiredPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !authToken) {
    // Redirect to login with return URL
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated but accessing subscription-required paths, check subscription status
  if (isSubscriptionRequiredPath && authToken) {
    try {
      // Decode JWT to get user info (we'll add subscription check in AuthContext)
      // For now, this middleware just ensures authentication
      // The subscription check will be handled by the AuthContext and page-level guards
      
      return NextResponse.next()
    } catch (error) {
      // Invalid token, redirect to login
      const url = new URL('/auth/login', request.url)
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /_next/static (static files)
     * - /_next/image (image optimization files)
     * - /favicon.ico (favicon file)
     * - /public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 