/**
 * Rate Limiting Middleware
 * Prevents API abuse with configurable rate limits
 */
import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
}

// In-memory store (use Redis in production for distributed systems)
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  // Convert to array to avoid iterator issues
  const entries = Array.from(requestCounts.entries())
  for (const [key, data] of entries) {
    if (now > data.resetTime) {
      requestCounts.delete(key)
    }
  }
}, 5 * 60 * 1000)

export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests, keyGenerator = (req) => getIP(req) } = config

  return (req: NextRequest): NextResponse | null => {
    const key = keyGenerator(req)
    const now = Date.now()
    const resetTime = now + windowMs

    const current = requestCounts.get(key)

    if (!current || now > current.resetTime) {
      // First request or window expired
      requestCounts.set(key, { count: 1, resetTime })
      return null // Continue to next middleware/handler
    }

    if (current.count >= maxRequests) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Math.ceil(current.resetTime / 1000).toString(),
            'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
          }
        }
      )
    }

    // Increment count
    current.count++
    requestCounts.set(key, current)

    return null // Continue to next middleware/handler
  }
}

function getIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const real = req.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (real) {
    return real
  }
  
  // NextRequest doesn't have ip property, fallback to unknown
  return 'unknown'
}

// Predefined rate limit configurations
export const rateLimits = {
  // API routes - moderate limiting
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // 100 requests per 15 minutes
  }),

  // Authentication routes - strict limiting
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 attempts per 15 minutes
  }),

  // File upload routes - very strict
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 uploads per hour
  })
}
