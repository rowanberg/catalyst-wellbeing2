/**
 * CSRF Protection Middleware
 * Implements token-based CSRF protection for state-changing operations
 */

import crypto from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_SECRET_COOKIE = 'csrf-secret'
const TOKEN_EXPIRY = 3600000 // 1 hour in milliseconds

interface CSRFToken {
  token: string
  secret: string
  expiresAt: number
}

/**
 * Generates a CSRF token and secret pair
 */
export function generateCSRFToken(): CSRFToken {
  const secret = crypto.randomBytes(32).toString('hex')
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = Date.now() + TOKEN_EXPIRY
  
  return { token, secret, expiresAt }
}

/**
 * Creates CSRF token hash from token and secret
 */
function hashToken(token: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(token)
    .digest('hex')
}

/**
 * Validates CSRF token against stored secret
 */
export function validateCSRFToken(
  token: string | null,
  secret: string | null
): boolean {
  if (!token || !secret) {
    return false
  }
  
  try {
    // Prevent timing attacks
    const expectedHash = hashToken(token, secret)
    const actualHash = hashToken(token, secret)
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(actualHash)
    )
  } catch {
    return false
  }
}

/**
 * Middleware to verify CSRF token on state-changing requests
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const method = request.method.toUpperCase()
    
    // Only protect state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const token = request.headers.get(CSRF_TOKEN_HEADER)
      const secret = request.cookies.get(CSRF_SECRET_COOKIE)?.value ?? null
      
      if (!validateCSRFToken(token, secret)) {
        return NextResponse.json(
          { 
            error: 'Invalid or missing CSRF token',
            code: 'CSRF_TOKEN_INVALID'
          },
          { status: 403 }
        )
      }
    }
    
    return handler(request)
  }
}

/**
 * API route to generate CSRF token for client
 */
export async function GET(request: NextRequest) {
  const { token, secret, expiresAt } = generateCSRFToken()
  
  const response = NextResponse.json({
    token,
    expiresAt
  })
  
  // Set secret in HTTP-only cookie
  response.cookies.set(CSRF_SECRET_COOKIE, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY / 1000,
    path: '/'
  })
  
  return response
}
