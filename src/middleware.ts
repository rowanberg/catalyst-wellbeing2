import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'

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
  
  // Create a response object that we'll modify
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  // Create Supabase client for auth handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - this resolves refresh token errors
  // Suppress auth errors as they're expected for unauthenticated requests
  let user: User | null = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error && data.user) {
      user = data.user
    }
  } catch (err) {
    // Silently handle auth errors - they're normal for logged out users
    user = null
  }

  // Handle superpanel routes (separate auth system)
  if (pathname.startsWith('/superpanel')) {
    // Always allow auth page - no checks at all
    if (pathname === '/superpanel/auth') {
      response = NextResponse.next()
    } else {
      // For dashboard and other protected routes, verify session token
      const sessionToken = req.cookies.get('super_admin_session')?.value
      
      if (!sessionToken) {
        console.log('[Middleware] No super_admin_session cookie found, redirecting to auth')
        return NextResponse.redirect(new URL('/superpanel/auth', req.url))
      }
      
      // Validate session token format
      const validKey = getSecureSuperAdminKey()
      try {
        const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
        const hasValidPrefix = decoded.startsWith(validKey)
        
        if (!hasValidPrefix) {
          console.log('[Middleware] Invalid session token, redirecting to auth')
          return NextResponse.redirect(new URL('/superpanel/auth', req.url))
        }
      } catch (error) {
        console.log('[Middleware] Session token decode failed, redirecting to auth')
        return NextResponse.redirect(new URL('/superpanel/auth', req.url))
      }
    }
  } 
  // Handle root path redirect
  else if (pathname === '/') {
    if (user) {
      // Has valid session - will redirect via client (needs profile lookup)
      response = NextResponse.next()
    } else {
      // No session - redirect directly to login (server-side)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  // For protected routes, redirect to login if no valid session
  else if (pathname.startsWith('/student') || pathname.startsWith('/teacher') || 
           pathname.startsWith('/parent') || pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
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
  // Allow camera only on Ai Live and Luminex activation pages
  const allowCamera = pathname.startsWith('/teacher/ai-live') || pathname.startsWith('/luminex/activate')
  const permissionsPolicy = [
    `camera=${allowCamera ? '(self)' : '()'}`,
    'microphone=()',
    'geolocation=(self)',
    'interest-cohort=()'
  ].join(', ')
  response.headers.set('Permissions-Policy', permissionsPolicy)
  
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
    // Match all paths except API routes, static files, and images
    // CRITICAL: Exclude /api/* to prevent redirect loops
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
