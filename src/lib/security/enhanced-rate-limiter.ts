/**
 * Enhanced Rate Limiting with Multiple Strategies
 * Protects against brute force, credential stuffing, and DoS attacks
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  keyPrefix?: string
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store (use Redis in production)
const store: RateLimitStore = {}

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  AUTH_LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    keyPrefix: 'auth_login'
  },
  AUTH_REGISTER: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: 'auth_register'
  },
  AUTH_PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    keyPrefix: 'auth_reset'
  },
  API_GENERAL: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
    keyPrefix: 'api_general'
  },
  API_WALLET: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    keyPrefix: 'api_wallet'
  },
  FILE_UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
    keyPrefix: 'file_upload'
  }
}

/**
 * Gets client identifier (IP + User ID if authenticated)
 */
function getClientKey(request: NextRequest, prefix: string): string {
  // Try to get IP from various headers (NextRequest doesn't have .ip property)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown'
  
  // Add user ID if authenticated (from authorization header)
  const authHeader = request.headers.get('authorization')
  const userId = authHeader ? authHeader.substring(0, 10) : ''
  
  return `${prefix}:${ip}${userId ? `:${userId}` : ''}`
}

/**
 * Checks if request exceeds rate limit
 */
function checkRateLimit(key: string, config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const record = store[key]
  
  // Clean up expired records periodically
  if (Math.random() < 0.01) { // 1% chance
    cleanupExpiredRecords()
  }
  
  if (!record || now > record.resetTime) {
    // Create new record
    store[key] = {
      count: 1,
      resetTime: now + config.windowMs
    }
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs
    }
  }
  
  // Check existing record
  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime
    }
  }
  
  // Increment count
  record.count++
  
  return {
    allowed: true,
    remaining: config.maxRequests - record.count,
    resetTime: record.resetTime
  }
}

/**
 * Cleanup expired records from store
 */
function cleanupExpiredRecords() {
  const now = Date.now()
  const keys = Object.keys(store)
  
  for (const key of keys) {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  }
}

/**
 * Rate limit middleware factory
 */
export function createRateLimiter(config: RateLimitConfig) {
  return async (
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> => {
    const key = getClientKey(request, config.keyPrefix || 'default')
    const result = checkRateLimit(key, config)
    
    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000)
      
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
          }
        }
      )
    }
    
    // Execute handler
    const response = await handler()
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(result.resetTime).toISOString())
    
    return response
  }
}

/**
 * Convenience wrapper for different rate limit types
 */
export const rateLimiters = {
  authLogin: (request: NextRequest, handler: () => Promise<NextResponse>) =>
    createRateLimiter(RATE_LIMITS.AUTH_LOGIN)(request, handler),
  
  authRegister: (request: NextRequest, handler: () => Promise<NextResponse>) =>
    createRateLimiter(RATE_LIMITS.AUTH_REGISTER)(request, handler),
  
  passwordReset: (request: NextRequest, handler: () => Promise<NextResponse>) =>
    createRateLimiter(RATE_LIMITS.AUTH_PASSWORD_RESET)(request, handler),
  
  apiGeneral: (request: NextRequest, handler: () => Promise<NextResponse>) =>
    createRateLimiter(RATE_LIMITS.API_GENERAL)(request, handler),
  
  wallet: (request: NextRequest, handler: () => Promise<NextResponse>) =>
    createRateLimiter(RATE_LIMITS.API_WALLET)(request, handler),
  
  fileUpload: (request: NextRequest, handler: () => Promise<NextResponse>) =>
    createRateLimiter(RATE_LIMITS.FILE_UPLOAD)(request, handler)
}

/**
 * Usage example:
 * 
 * export async function POST(request: NextRequest) {
 *   return rateLimiters.authLogin(request, async () => {
 *     // Your handler code here
 *     return NextResponse.json({ success: true })
 *   })
 * }
 */
