/**
 * Request Deduplication Utility
 * Prevents duplicate concurrent requests to the same endpoint
 * Safe for GET/read-only operations
 */

type PendingRequest<T> = {
  promise: Promise<T>
  timestamp: number
}

// Store in-flight requests
const pendingRequests = new Map<string, PendingRequest<any>>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
const REQUEST_TIMEOUT = 30 * 1000 // 30 seconds

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    // Convert entries to array for iteration compatibility
    const entries = Array.from(pendingRequests.entries())
    for (const [key, req] of entries) {
      if (now - req.timestamp > REQUEST_TIMEOUT) {
        pendingRequests.delete(key)
      }
    }
  }, CLEANUP_INTERVAL)
}

/**
 * Deduplicate concurrent requests to the same resource
 * If a request is already in-flight, returns the same promise
 * 
 * @param key - Unique identifier for the request
 * @param fetcher - Function that performs the actual request
 * @returns Promise with the result
 * 
 * @example
 * const data = await dedupedRequest(
 *   `teacher-classes-${teacherId}`,
 *   () => fetchTeacherClasses(teacherId)
 * )
 */
export async function dedupedRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if request is already in-flight
  const pending = pendingRequests.get(key)
  
  if (pending) {
    console.log(`[Dedup] Reusing in-flight request for: ${key}`)
    return pending.promise
  }
  
  // Start new request
  console.log(`[Dedup] Starting new request for: ${key}`)
  const promise = fetcher().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key)
  })
  
  // Store pending request
  pendingRequests.set(key, {
    promise,
    timestamp: Date.now()
  })
  
  return promise
}

/**
 * Generate cache key from request parameters
 * 
 * @example
 * const key = generateCacheKey('teacher-classes', { teacherId: '123', includeStudents: true })
 * // Returns: "teacher-classes:teacherId=123&includeStudents=true"
 */
export function generateCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${endpoint}:${sortedParams}`
}

/**
 * Clear all pending requests (useful for testing)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear()
}
