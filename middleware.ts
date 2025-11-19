import { NextRequest, NextResponse } from 'next/server'
import { SecurityMiddleware } from '@/middleware/security'

export function middleware(request: NextRequest) {
  const security = SecurityMiddleware.getInstance()
  
  // Apply security headers to all responses
  const response = NextResponse.next()
  
  // Apply security headers
  security.applySecurityHeaders(response)
  
  // Check rate limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const rateLimit = security.checkRateLimit(request)
    
    if (!rateLimit.allowed) {
      return new NextResponse('Rate limit exceeded', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
          'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
        }
      })
    }
    
    // Add rate limit headers to successful responses
    response.headers.set('X-RateLimit-Limit', '100')
    response.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(rateLimit.resetTime).toISOString())
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - sw.js (service worker)
     * - manifest.json (PWA manifest)
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icons/).*)',
  ],
}
