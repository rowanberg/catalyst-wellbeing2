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
  
  // Create response with security headers for all routes
  let response: NextResponse

  // Handle superpanel authentication
  if (pathname.startsWith('/superpanel')) {
    // Always allow auth page - no checks at all
    if (pathname === '/superpanel/auth') {
      response = NextResponse.next()
    } else {
      // For dashboard and other protected routes, verify access key
      const accessKey = req.cookies.get('super_admin_key')?.value
      const validKey = getSecureSuperAdminKey()

      // Use timing-safe comparison to prevent timing attacks
      if (!accessKey || !timingSafeEqual(accessKey, validKey)) {
        return NextResponse.redirect(new URL('/superpanel/auth', req.url))
      }
      response = NextResponse.next()
    }
  } else {
    response = NextResponse.next()
  }

  // Apply comprehensive security headers to all responses
  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Enable XSS protection (for older browsers)
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Restrict permissions (Permissions Policy)
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), interest-cohort=()')
  
  // Content Security Policy (CSP) - don't apply to API routes or auth pages
  if (!pathname.startsWith('/_next') && 
      !pathname.includes('/api/') && 
      !pathname.includes('/auth/') &&
      !pathname.includes('/login') &&
      !pathname.includes('/register')) {
    
    // Build CSP header - exclude upgrade-insecure-requests in development
    const cspDirectives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: https://*.supabase.co https://cdn.jsdelivr.net https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://*.googleusercontent.com",
      "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co wss://*.supabase.in https://accounts.google.com https://www.googleapis.com",
      "frame-src 'self' https://accounts.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self' https://accounts.google.com"
    ]
    
    // Only add upgrade-insecure-requests in production
    if (process.env.NODE_ENV === 'production') {
      cspDirectives.push("upgrade-insecure-requests")
    }
    
    response.headers.set('Content-Security-Policy', cspDirectives.join('; ') + ';')
  }
  
  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }
  
  return response
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
