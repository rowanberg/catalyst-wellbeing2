/**
 * Secure Error Handling Utility
 * Prevents internal error details from being exposed to clients
 */

import { NextResponse } from 'next/server'

interface ErrorDetails {
  message: string
  code?: string
  status?: number
  metadata?: Record<string, any>
}

/**
 * Generates a unique request ID for error tracking
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

/**
 * Securely handles errors without exposing internal details
 */
export function handleSecureError(
  error: any,
  context: string,
  requestId?: string
): NextResponse {
  const reqId = requestId || generateRequestId()
  
  // Log full error details internally (never send to client)
  console.error(`[ERROR:${reqId}] ${context}:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    details: error.details,
    hint: error.hint,
    timestamp: new Date().toISOString()
  })
  
  // Determine appropriate status code
  const status = determineStatusCode(error)
  
  // Return sanitized error to client
  return NextResponse.json({
    error: getSafeErrorMessage(error, status),
    code: getSafeErrorCode(error),
    requestId: reqId,
    timestamp: new Date().toISOString()
  }, { status })
}

/**
 * Determines appropriate HTTP status code from error
 */
function determineStatusCode(error: any): number {
  // Supabase error codes
  if (error.code === '23505') return 409 // Unique violation
  if (error.code === '23503') return 400 // Foreign key violation
  if (error.code === '42501') return 403 // Insufficient privilege
  if (error.code === 'PGRST116') return 404 // Not found
  if (error.code === 'PGRST301') return 400 // Invalid query
  
  // Custom error codes
  if (error.name === 'ValidationError') return 400
  if (error.name === 'AuthenticationError') return 401
  if (error.name === 'AuthorizationError') return 403
  if (error.name === 'NotFoundError') return 404
  if (error.name === 'RateLimitError') return 429
  
  // Explicit status from error object
  if (error.status) return error.status
  
  // Default to 500
  return 500
}

/**
 * Returns user-friendly error message without exposing internals
 */
function getSafeErrorMessage(error: any, status: number): string {
  // Never expose internal error messages in production
  if (process.env.NODE_ENV === 'production') {
    switch (status) {
      case 400: return 'Invalid request. Please check your input and try again.'
      case 401: return 'Authentication required. Please log in.'
      case 403: return 'You do not have permission to perform this action.'
      case 404: return 'The requested resource was not found.'
      case 409: return 'This operation conflicts with existing data.'
      case 429: return 'Too many requests. Please try again later.'
      case 500: return 'An unexpected error occurred. Please try again.'
      default: return 'An error occurred while processing your request.'
    }
  }
  
  // In development, provide more context (but still sanitized)
  if (error.name === 'ValidationError') {
    return 'Validation failed. Please check your input.'
  }
  
  // Return generic message for unknown errors
  return error.message || 'An error occurred while processing your request.'
}

/**
 * Returns safe error code for client
 */
function getSafeErrorCode(error: any): string {
  const safeErrorCodes = [
    'VALIDATION_ERROR',
    'AUTHENTICATION_ERROR',
    'AUTHORIZATION_ERROR',
    'NOT_FOUND',
    'CONFLICT',
    'RATE_LIMIT_EXCEEDED',
    'BAD_REQUEST',
    'INTERNAL_ERROR'
  ]
  
  // If error has a safe code, return it
  if (error.code && safeErrorCodes.includes(error.code)) {
    return error.code
  }
  
  // Map common errors to safe codes
  if (error.name === 'ValidationError') return 'VALIDATION_ERROR'
  if (error.name === 'AuthenticationError') return 'AUTHENTICATION_ERROR'
  if (error.name === 'AuthorizationError') return 'AUTHORIZATION_ERROR'
  if (error.name === 'NotFoundError') return 'NOT_FOUND'
  if (error.name === 'RateLimitError') return 'RATE_LIMIT_EXCEEDED'
  
  return 'INTERNAL_ERROR'
}

/**
 * Custom error classes for better error handling
 */
export class AuthenticationError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends Error {
  constructor(resource = 'Resource') {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Too many requests') {
    super(message)
    this.name = 'RateLimitError'
  }
}

/**
 * Wrapper for async route handlers with automatic error handling
 */
export function withErrorHandler(
  handler: (request: Request, context?: any) => Promise<NextResponse>,
  context: string
) {
  return async (request: Request, routeContext?: any): Promise<NextResponse> => {
    const requestId = generateRequestId()
    
    try {
      return await handler(request, routeContext)
    } catch (error) {
      return handleSecureError(error, context, requestId)
    }
  }
}
