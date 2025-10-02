/**
 * Standardized API Response Helper
 * Ensures consistent response format across all endpoints
 * 
 * Usage:
 * import { ApiResponse } from '@/lib/api/response'
 * return ApiResponse.success(data)
 * return ApiResponse.error('Message', 400)
 */

import { NextResponse } from 'next/server'

interface SuccessResponse<T> {
  success: true
  data: T
  timestamp: string
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    [key: string]: any
  }
}

interface ErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: any
  }
  timestamp: string
}

export class ApiResponse {
  /**
   * Success response
   */
  static success<T>(
    data: T,
    status: number = 200,
    meta?: SuccessResponse<T>['meta']
  ): NextResponse<SuccessResponse<T>> {
    const response: SuccessResponse<T> = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    }

    if (meta) {
      response.meta = meta
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Error response
   */
  static error(
    message: string,
    status: number = 400,
    code?: string,
    details?: any
  ): NextResponse<ErrorResponse> {
    const response: ErrorResponse = {
      success: false,
      error: {
        message,
        code,
        details,
      },
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response, { status })
  }

  /**
   * Bad Request (400)
   */
  static badRequest(message: string = 'Bad Request'): NextResponse {
    return this.error(message, 400, 'BAD_REQUEST')
  }

  /**
   * Unauthorized (401)
   */
  static unauthorized(message: string = 'Unauthorized'): NextResponse {
    return this.error(message, 401, 'UNAUTHORIZED')
  }

  /**
   * Forbidden (403)
   */
  static forbidden(message: string = 'Forbidden'): NextResponse {
    return this.error(message, 403, 'FORBIDDEN')
  }

  /**
   * Not Found (404)
   */
  static notFound(message: string = 'Not Found'): NextResponse {
    return this.error(message, 404, 'NOT_FOUND')
  }

  /**
   * Conflict (409)
   */
  static conflict(message: string = 'Conflict'): NextResponse {
    return this.error(message, 409, 'CONFLICT')
  }

  /**
   * Too Many Requests (429)
   */
  static tooManyRequests(
    message: string = 'Too Many Requests',
    retryAfter?: number
  ): NextResponse {
    const response = this.error(message, 429, 'TOO_MANY_REQUESTS')
    
    if (retryAfter) {
      response.headers.set('Retry-After', retryAfter.toString())
    }
    
    return response
  }

  /**
   * Internal Server Error (500)
   */
  static internalError(
    message: string = 'Internal Server Error',
    error?: Error
  ): NextResponse {
    // Only include error details in development
    const details = process.env.NODE_ENV === 'development' && error
      ? { message: error.message, stack: error.stack }
      : undefined

    return this.error(message, 500, 'INTERNAL_ERROR', details)
  }

  /**
   * Response with caching headers
   * @param data Response data
   * @param cacheSeconds Cache duration in seconds
   * @param status HTTP status code
   */
  static cached<T>(
    data: T,
    cacheSeconds: number = 60,
    status: number = 200
  ): NextResponse<SuccessResponse<T>> {
    const response = this.success(data, status)
    
    // Set cache control headers
    const staleWhileRevalidate = Math.floor(cacheSeconds / 2)
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${cacheSeconds}, stale-while-revalidate=${staleWhileRevalidate}`
    )
    
    return response
  }

  /**
   * Response with no-cache headers (for sensitive data)
   */
  static noCache<T>(data: T, status: number = 200): NextResponse<SuccessResponse<T>> {
    const response = this.success(data, status)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    return response
  }
}
