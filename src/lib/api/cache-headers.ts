/**
 * API Cache Headers Utility
 * Standardized caching strategies for different data types
 */
import { NextResponse } from 'next/server'

export const CacheStrategies = {
  // No cache for real-time data (messages, notifications)
  NO_CACHE: 'no-cache, no-store, must-revalidate',
  
  // Short cache for frequently changing data (5 minutes)
  SHORT_CACHE: 'public, max-age=300, stale-while-revalidate=60',
  
  // Medium cache for semi-static data (15 minutes)
  MEDIUM_CACHE: 'public, max-age=900, stale-while-revalidate=180',
  
  // Long cache for static data (1 hour)
  LONG_CACHE: 'public, max-age=3600, stale-while-revalidate=600',
  
  // Very long cache for rarely changing data (24 hours)
  VERY_LONG_CACHE: 'public, max-age=86400, stale-while-revalidate=3600'
} as const

export function addCacheHeaders(response: NextResponse, strategy: string): NextResponse {
  response.headers.set('Cache-Control', strategy)
  response.headers.set('Vary', 'Authorization')
  return response
}

export function createCachedResponse(data: any, strategy: string = CacheStrategies.SHORT_CACHE): NextResponse {
  const response = NextResponse.json(data)
  return addCacheHeaders(response, strategy)
}
