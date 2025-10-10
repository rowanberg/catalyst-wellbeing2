import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Get super admin access key from environment variable
// This should be a strong, randomly generated key stored securely
function getSecureSuperAdminKey(): string {
  const key = process.env.SUPER_ADMIN_SECRET_KEY
  if (!key) {
    console.error('SUPER_ADMIN_SECRET_KEY environment variable is not set')
    // Return a fallback for development - in production this should never happen
    return 'development-only-fallback-key-not-secure'
  }
  return key
}

// Edge Runtime compatible timing-safe comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip middleware for non-superpanel routes
  if (!pathname.startsWith('/superpanel')) {
    return NextResponse.next()
  }

  // Always allow auth page - no checks at all
  if (pathname === '/superpanel/auth') {
    return NextResponse.next()
  }

  // For dashboard and other protected routes, verify access key
  const accessKey = req.cookies.get('super_admin_key')?.value
  const validKey = getSecureSuperAdminKey()

  // Use timing-safe comparison to prevent timing attacks
  if (!accessKey || !timingSafeEqual(accessKey, validKey)) {
    return NextResponse.redirect(new URL('/superpanel/auth', req.url))
  }

  // Valid key - allow access with security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/superpanel/dashboard/:path*',
    '/superpanel/analytics/:path*',
    '/superpanel/schools/:path*',
  ],
}
