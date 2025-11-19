import { NextRequest, NextResponse } from 'next/server'

// Security configuration
const SECURITY_CONFIG = {
  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      "'unsafe-eval'", // Required for development
      'https://vercel.live',
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Tailwind CSS
      'https://fonts.googleapis.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
      'http:', // For development
      '*.supabase.co'
    ],
    'media-src': [
      "'self'",
      'data:',
      'blob:',
      '*.supabase.co'
    ],
    'connect-src': [
      "'self'",
      'wss:',
      'ws:', // For development WebSocket
      '*.supabase.co',
      'https://api.openai.com',
      'https://vercel.live'
    ],
    'frame-src': [
      "'self'",
      'https://vercel.live'
    ],
    'worker-src': [
      "'self'",
      'blob:'
    ],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'upgrade-insecure-requests': []
  },

  // Rate limiting configuration
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: {
      '/api/auth': 5, // Auth endpoints
      '/api/admin': 100, // Admin endpoints
      '/api/v1': 200, // Regular API
      'default': 300 // Default limit
    }
  },

  // Trusted domains for CORS
  trustedDomains: [
    'localhost:3000',
    'catalyst-wellbeing.vercel.app',
    '*.vercel.app'
  ]
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security middleware
export class SecurityMiddleware {
  private static instance: SecurityMiddleware
  
  static getInstance(): SecurityMiddleware {
    if (!SecurityMiddleware.instance) {
      SecurityMiddleware.instance = new SecurityMiddleware()
    }
    return SecurityMiddleware.instance
  }

  // Apply security headers
  applySecurityHeaders(response: NextResponse): NextResponse {
    // Content Security Policy
    const cspHeader = this.buildCSPHeader()
    response.headers.set('Content-Security-Policy', cspHeader)
    
    // Security headers
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    }
    
    // Remove server information
    response.headers.delete('Server')
    response.headers.delete('X-Powered-By')
    
    return response
  }

  // Build CSP header string
  private buildCSPHeader(): string {
    const directives = Object.entries(SECURITY_CONFIG.csp)
      .map(([directive, sources]) => {
        if (sources.length === 0) {
          return directive.replace(/([A-Z])/g, '-$1').toLowerCase()
        }
        return `${directive.replace(/([A-Z])/g, '-$1').toLowerCase()} ${sources.join(' ')}`
      })
    
    return directives.join('; ')
  }

  // Rate limiting
  checkRateLimit(request: NextRequest): { allowed: boolean; remaining: number; resetTime: number } {
    const clientIP = this.getClientIP(request)
    const pathname = request.nextUrl.pathname
    const key = `${clientIP}:${pathname}`
    
    // Determine rate limit for this endpoint
    const limit = this.getRateLimitForPath(pathname)
    const windowMs = SECURITY_CONFIG.rateLimiting.windowMs
    const now = Date.now()
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      }
    }
    
    entry.count++
    rateLimitStore.set(key, entry)
    
    // Clean up expired entries
    this.cleanupExpiredEntries()
    
    return {
      allowed: entry.count <= limit,
      remaining: Math.max(0, limit - entry.count),
      resetTime: entry.resetTime
    }
  }

  private getRateLimitForPath(pathname: string): number {
    const limits = SECURITY_CONFIG.rateLimiting.maxRequests
    
    for (const [path, limit] of Object.entries(limits)) {
      if (path !== 'default' && pathname.startsWith(path)) {
        return limit
      }
    }
    
    return limits.default
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers for client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const clientIP = request.headers.get('x-client-ip')
    
    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }
    
    return realIP || clientIP || 'unknown'
  }

  private cleanupExpiredEntries() {
    const now = Date.now()
    
    Array.from(rateLimitStore.entries()).forEach(([key, entry]) => {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key)
      }
    })
  }

  // CORS handling
  handleCORS(request: NextRequest): NextResponse | null {
    const origin = request.headers.get('origin')
    
    // Allow same-origin requests
    if (!origin) {
      return null
    }
    
    // Check if origin is trusted
    const isTrusted = SECURITY_CONFIG.trustedDomains.some(domain => {
      if (domain.startsWith('*.')) {
        const baseDomain = domain.slice(2)
        return origin.endsWith(baseDomain)
      }
      return origin.includes(domain)
    })
    
    if (!isTrusted && process.env.NODE_ENV === 'production') {
      return new NextResponse('CORS policy violation', { status: 403 })
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400'
        }
      })
    }
    
    return null
  }

  // Input sanitization
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return this.sanitizeString(input)
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item))
    }
    
    if (input && typeof input === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeString(key)] = this.sanitizeInput(value)
      }
      return sanitized
    }
    
    return input
  }

  private sanitizeString(str: string): string {
    // Remove potential XSS vectors
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:text\/html/gi, '')
      .trim()
  }

  // SQL injection prevention
  validateSQLInput(input: string): boolean {
    const sqlInjectionPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /('|(\\')|(;)|(\\)|(\/\*)|(--)|(\*\/))/,
      /((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))((\%75)|u|(\%55))((\%6E)|n|(\%4E))((\%69)|i|(\%49))((\%6F)|o|(\%4F))((\%6E)|n|(\%4E))/i
    ]
    
    return !sqlInjectionPatterns.some(pattern => pattern.test(input))
  }

  // Generate security report
  generateSecurityReport(request: NextRequest): {
    timestamp: number
    ip: string
    userAgent: string
    path: string
    method: string
    headers: Record<string, string>
    securityFlags: string[]
  } {
    const securityFlags: string[] = []
    
    // Check for suspicious patterns
    const userAgent = request.headers.get('user-agent') || ''
    const path = request.nextUrl.pathname
    
    if (userAgent.toLowerCase().includes('bot')) {
      securityFlags.push('BOT_DETECTED')
    }
    
    if (path.includes('..')) {
      securityFlags.push('PATH_TRAVERSAL_ATTEMPT')
    }
    
    if (path.includes('<script>')) {
      securityFlags.push('XSS_ATTEMPT')
    }
    
    return {
      timestamp: Date.now(),
      ip: this.getClientIP(request),
      userAgent,
      path,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      securityFlags
    }
  }
}

// Utility functions for API routes
export const withSecurity = (handler: (req: NextRequest) => Promise<NextResponse>) => {
  return async (request: NextRequest): Promise<NextResponse> => {
    const security = SecurityMiddleware.getInstance()
    
    try {
      // Check CORS
      const corsResponse = security.handleCORS(request)
      if (corsResponse) {
        return corsResponse
      }
      
      // Check rate limiting
      const rateLimit = security.checkRateLimit(request)
      if (!rateLimit.allowed) {
        const response = new NextResponse('Rate limit exceeded', { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': SECURITY_CONFIG.rateLimiting.maxRequests.default.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString()
          }
        })
        return security.applySecurityHeaders(response)
      }
      
      // Execute handler
      const response = await handler(request)
      
      // Apply security headers
      return security.applySecurityHeaders(response)
      
    } catch (error) {
      console.error('[Security] Middleware error:', error)
      
      const errorResponse = new NextResponse('Internal Server Error', { status: 500 })
      return security.applySecurityHeaders(errorResponse)
    }
  }
}

// Input validation middleware
export const validateInput = (schema: any) => {
  return (handler: (req: NextRequest, validatedData: any) => Promise<NextResponse>) => {
    return async (request: NextRequest): Promise<NextResponse> => {
      const security = SecurityMiddleware.getInstance()
      
      try {
        let data: any = {}
        
        // Parse request body if present
        if (request.body) {
          const text = await request.text()
          if (text) {
            data = JSON.parse(text)
          }
        }
        
        // Parse query parameters
        const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
        data = { ...data, ...searchParams }
        
        // Sanitize input
        const sanitizedData = security.sanitizeInput(data)
        
        // Validate against schema (you can integrate with Zod or similar)
        // For now, basic validation
        if (schema.required) {
          for (const field of schema.required) {
            if (!(field in sanitizedData)) {
              return new NextResponse(`Missing required field: ${field}`, { status: 400 })
            }
          }
        }
        
        // Check for SQL injection in string fields
        for (const [key, value] of Object.entries(sanitizedData)) {
          if (typeof value === 'string' && !security.validateSQLInput(value)) {
            return new NextResponse(`Invalid input detected in field: ${key}`, { status: 400 })
          }
        }
        
        return await handler(request, sanitizedData)
        
      } catch (error) {
        console.error('[Security] Input validation error:', error)
        return new NextResponse('Invalid request data', { status: 400 })
      }
    }
  }
}

// Audit logging
export const auditLog = (action: string, details: any = {}) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action,
    details,
    environment: process.env.NODE_ENV
  }
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // Send to your logging service (e.g., DataDog, LogRocket, etc.)
    console.log('[AUDIT]', JSON.stringify(logEntry))
  } else {
    console.log('[AUDIT]', logEntry)
  }
}

export default SecurityMiddleware
