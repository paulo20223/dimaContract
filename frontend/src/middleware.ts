import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TOKEN_KEY = 'auth_token'

const protectedPaths = ['/contracts', '/clients', '/services', '/banks']

export function middleware(request: NextRequest) {
  const token = request.cookies.get(TOKEN_KEY)?.value
  const { pathname } = request.nextUrl

  const isProtectedPath = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )

  // Root path: redirect based on auth status
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/contracts', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Protected paths: require authentication
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Login page: redirect authenticated users to dashboard
  if (pathname === '/login' && token) {
    return NextResponse.redirect(new URL('/contracts', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/contracts/:path*', '/clients/:path*', '/services/:path*', '/banks/:path*', '/login'],
}
