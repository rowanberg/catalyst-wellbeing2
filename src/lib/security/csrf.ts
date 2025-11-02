/**
 * CSRF Protection Service
 * Implements double-submit cookie pattern for CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf_token'
const CSRF_HEADER_NAME = 'X-CSRF-Token'

/**
 * Generate a cryptographically secure CSRF token
 * Uses Web Crypto API for Edge runtime compatibility
 */
export function generateCSRFToken(): string {
  // Use Web Crypto API (available in Edge runtime)
  const array = new Uint8Array(CSRF_TOKEN_LENGTH)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Set CSRF token in response cookies
 */
export function setCSRFCookie(response: NextResponse, token?: string): string {
  const csrfToken = token || generateCSRFToken()
  
  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false, // Must be accessible to JavaScript for double-submit
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 3600 * 24, // 24 hours
  })
  
  return csrfToken
}

/**
 * Verify CSRF token from request
 */
export function verifyCSRFToken(request: NextRequest): boolean {
  // Skip CSRF check for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true
  }
  
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  if (!cookieToken) {
    console.warn('CSRF verification failed: No cookie token')
    return false
  }
  
  // Get token from header or body
  let requestToken = request.headers.get(CSRF_HEADER_NAME)
  
  // If not in header, try to get from body (for forms)
  if (!requestToken) {
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      // For JSON requests, we already have it in header
      console.warn('CSRF verification failed: No header token for JSON request')
      return false
    }
  }
  
  if (!requestToken) {
    console.warn('CSRF verification failed: No request token')
    return false
  }
  
  // Use timing-safe comparison
  return timingSafeEqual(cookieToken, requestToken)
}

/**
 * Timing-safe string comparison to prevent timing attacks
 * Uses constant-time comparison for Edge runtime
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  // Convert strings to arrays for constant-time comparison
  const aBytes = new TextEncoder().encode(a)
  const bBytes = new TextEncoder().encode(b)
  
  let result = 0
  for (let i = 0; i < aBytes.length; i++) {
    result |= aBytes[i] ^ bBytes[i]
  }
  
  return result === 0
}

/**
 * CSRF protection middleware
 */
export async function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<(request: NextRequest) => Promise<NextResponse>> {
  return async (request: NextRequest) => {
    // Verify CSRF token for state-changing requests
    if (!verifyCSRFToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
    
    // Process request
    const response = await handler(request)
    
    // Set new CSRF token for next request
    if (!request.cookies.get(CSRF_COOKIE_NAME)) {
      setCSRFCookie(response)
    }
    
    return response
  }
}

/**
 * Client-side helper to get CSRF token
 */
export function getCSRFToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const match = document.cookie.match(new RegExp(`${CSRF_COOKIE_NAME}=([^;]+)`))
  return match ? match[1] : null
}

/**
 * Client-side helper to add CSRF token to fetch requests
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const csrfToken = getCSRFToken()
  
  if (csrfToken) {
    options.headers = {
      ...options.headers,
      [CSRF_HEADER_NAME]: csrfToken,
    }
  }
  
  return fetch(url, options)
}

/**
 * React hook for CSRF token management
 */
export function useCSRFToken() {
  if (typeof window === 'undefined') {
    return { token: null, fetchWithCSRF }
  }
  
  const token = getCSRFToken()
  
  return {
    token,
    fetchWithCSRF,
    addToHeaders: (headers: HeadersInit = {}): HeadersInit => {
      if (!token) return headers
      
      if (headers instanceof Headers) {
        headers.set(CSRF_HEADER_NAME, token)
        return headers
      }
      
      return {
        ...headers,
        [CSRF_HEADER_NAME]: token,
      }
    }
  }
}
