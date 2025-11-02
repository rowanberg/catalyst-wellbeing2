/**
 * ============================================================================
 * API Error Handler
 * ============================================================================
 * Consistent error handling across all APIs
 * Provides graceful degradation and detailed logging
 * ============================================================================
 */

import { NextResponse } from 'next/server'

export interface ApiError {
  message: string
  code?: string
  status: number
  details?: any
}

/**
 * Handle API errors with consistent format
 */
export function handleApiError(error: any, context?: string): NextResponse {
  console.error(`❌ [API Error]${context ? ` ${context}:` : ''}`, error)

  // Determine appropriate status code
  const status = error.status || error.statusCode || 500
  
  // Determine error message
  let message = 'An unexpected error occurred'
  
  if (error.message) {
    message = error.message
  }
  
  // Database-specific errors
  if (error.code) {
    switch (error.code) {
      case '23505':
        message = 'Duplicate entry'
        break
      case '23503':
        message = 'Referenced record not found'
        break
      case '42P01':
        message = 'Database table not found - migrations may need to be run'
        break
      case 'PGRST116':
        message = 'No rows returned'
        break
    }
  }

  // Construct error response
  const errorResponse: ApiError = {
    message,
    status,
    code: error.code,
    ...(process.env.NODE_ENV === 'development' && { details: error })
  }

  return NextResponse.json(errorResponse, { status })
}

/**
 * Wrap async API handler with error handling
 */
export function withErrorHandling(
  handler: (request: any) => Promise<NextResponse>,
  context?: string
) {
  return async (request: any) => {
    try {
      return await handler(request)
    } catch (error) {
      return handleApiError(error, context)
    }
  }
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: any): boolean {
  // Timeout errors, network errors, etc.
  const recoverableCodes = ['ETIMEDOUT', 'ECONNREFUSED', 'ENOTFOUND']
  return recoverableCodes.includes(error.code) || error.status === 503
}

/**
 * Retry operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000
  } = options

  let lastError: any
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt === maxRetries || !isRecoverableError(error)) {
        throw error
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay))
      
      // Exponential backoff
      delay = Math.min(delay * 2, maxDelay)
      
      console.log(`⚠️ Retry attempt ${attempt + 1}/${maxRetries}`)
    }
  }

  throw lastError
}
