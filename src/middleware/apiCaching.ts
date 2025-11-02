/**
 * API Response Caching Middleware
 * Adds Cache-Control headers to GET requests
 * Implements stale-while-revalidate pattern
 */

import { NextResponse, NextRequest } from 'next/server'

// Cache configuration by route pattern
const CACHE_CONFIG: Record<string, CacheConfig> = {
  // Profile data - 5 minutes cache
  '/api/profile': {
    maxAge: 300,
    swr: 60,
    type: 'private'
  },
  '/api/get-profile': {
    maxAge: 300,
    swr: 60,
    type: 'private'
  },
  '/api/v2/student/profile': {
    maxAge: 300,
    swr: 60,
    type: 'private'
  },
  
  // Student data - 2 minutes cache
  '/api/student/assessments': {
    maxAge: 120,
    swr: 30,
    type: 'private'
  },
  '/api/student/achievements': {
    maxAge: 180,
    swr: 60,
    type: 'private'
  },
  
  // Teacher data - 3 minutes cache
  '/api/teacher/classes': {
    maxAge: 180,
    swr: 60,
    type: 'private'
  },
  '/api/teacher/students': {
    maxAge: 180,
    swr: 60,
    type: 'private'
  },
  '/api/teacher/data': {
    maxAge: 180,
    swr: 60,
    type: 'private'
  },
  
  // School/Admin data - 5 minutes cache
  '/api/admin/school': {
    maxAge: 300,
    swr: 120,
    type: 'private'
  },
  '/api/admin/stats': {
    maxAge: 300,
    swr: 120,
    type: 'private'
  },
  
  // Static/reference data - 1 hour cache
  '/api/classes': {
    maxAge: 3600,
    swr: 600,
    type: 'public'
  },
  '/api/schools': {
    maxAge: 3600,
    swr: 600,
    type: 'public'
  }
}

interface CacheConfig {
  maxAge: number  // seconds
  swr: number     // stale-while-revalidate seconds
  type: 'public' | 'private'
}

/**
 * Get cache configuration for a route
 */
function getCacheConfig(pathname: string): CacheConfig | null {
  // Exact match
  if (CACHE_CONFIG[pathname]) {
    return CACHE_CONFIG[pathname]
  }
  
  // Pattern matching
  for (const [pattern, config] of Object.entries(CACHE_CONFIG)) {
    if (pathname.startsWith(pattern)) {
      return config
    }
  }
  
  // Default for GET requests to /api/*
  if (pathname.startsWith('/api/')) {
    return {
      maxAge: 60,  // 1 minute default
      swr: 30,
      type: 'private'
    }
  }
  
  return null
}

/**
 * Build Cache-Control header value
 */
function buildCacheControlHeader(config: CacheConfig): string {
  const parts = [
    config.type,
    `max-age=${config.maxAge}`,
    `stale-while-revalidate=${config.swr}`
  ]
  
  return parts.join(', ')
}

/**
 * Add ETag for cache validation
 */
function generateETag(content: string): string {
  // Simple hash function for ETag
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return `"${Math.abs(hash).toString(16)}"`
}

/**
 * Middleware wrapper for API routes
 * Usage: export const GET = withCaching(async (request) => { ... })
 */
export function withCaching(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const { pathname } = new URL(request.url)
    
    // Only cache GET requests
    if (request.method !== 'GET') {
      return handler(request)
    }
    
    // Get cache configuration
    const cacheConfig = getCacheConfig(pathname)
    if (!cacheConfig) {
      return handler(request)
    }
    
    // Check if-none-match header for ETag validation
    const ifNoneMatch = request.headers.get('if-none-match')
    
    try {
      // Execute handler
      const response = await handler(request)
      
      // Clone response to read body
      const clonedResponse = response.clone()
      const body = await clonedResponse.text()
      
      // Generate ETag
      const etag = generateETag(body)
      
      // Check if client has cached version
      if (ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'Cache-Control': buildCacheControlHeader(cacheConfig),
            'ETag': etag
          }
        })
      }
      
      // Add caching headers to response
      const headers = new Headers(response.headers)
      headers.set('Cache-Control', buildCacheControlHeader(cacheConfig))
      headers.set('ETag', etag)
      
      // Add Vary header for proper caching
      headers.set('Vary', 'Authorization, Cookie')
      
      // Optional: Add timing header for debugging
      if (process.env.NODE_ENV === 'development') {
        headers.set('X-Cache-Config', JSON.stringify(cacheConfig))
      }
      
      return new NextResponse(body, {
        status: response.status,
        statusText: response.statusText,
        headers
      })
    } catch (error) {
      console.error('Caching middleware error:', error)
      return handler(request)
    }
  }
}

/**
 * Response wrapper that adds cache headers
 * For manual use in API routes
 */
export function cachedResponse(
  data: any,
  options?: {
    maxAge?: number
    swr?: number
    type?: 'public' | 'private'
  }
) {
  const config: CacheConfig = {
    maxAge: options?.maxAge ?? 60,
    swr: options?.swr ?? 30,
    type: options?.type ?? 'private'
  }
  
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', buildCacheControlHeader(config))
  response.headers.set('Vary', 'Authorization, Cookie')
  
  return response
}

/**
 * No-cache response wrapper
 * For sensitive or real-time data
 */
export function noCacheResponse(data: any, status = 200) {
  const response = NextResponse.json(data, { status })
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  
  return response
}

/**
 * CDN-friendly response for public data
 */
export function publicCachedResponse(
  data: any,
  options?: {
    maxAge?: number
    sMaxAge?: number // CDN cache time
  }
) {
  const maxAge = options?.maxAge ?? 3600 // 1 hour
  const sMaxAge = options?.sMaxAge ?? 7200 // 2 hours for CDN
  
  const response = NextResponse.json(data)
  response.headers.set(
    'Cache-Control',
    `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=600`
  )
  
  return response
}

/**
 * Cache invalidation helper
 * For use after mutations
 */
export function getCacheInvalidationPaths(resource: string): string[] {
  const paths: string[] = []
  
  switch (resource) {
    case 'profile':
      paths.push('/api/profile', '/api/get-profile', '/api/v2/student/profile')
      break
    case 'assessments':
      paths.push('/api/student/assessments', '/api/teacher/assessments')
      break
    case 'attendance':
      paths.push('/api/attendance', '/api/teacher/attendance')
      break
    // Add more resources as needed
  }
  
  return paths
}
