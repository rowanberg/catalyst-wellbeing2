/**
 * Client-side Teacher Dashboard Cache
 * Provides aggressive caching for teacher dashboard data to minimize API calls
 */

interface CachedData<T> {
  data: T
  timestamp: number
  expiresAt: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
const STALE_DURATION = 10 * 60 * 1000 // 10 minutes - serve stale data while revalidating

class TeacherDashboardCache {
  private cache = new Map<string, CachedData<any>>()
  private pendingRequests = new Map<string, Promise<any>>()

  /**
   * Get cached data or fetch from API
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { forceRefresh?: boolean }
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    const now = Date.now()

    // Force refresh bypasses cache
    if (!options?.forceRefresh && cached) {
      // Fresh data - return immediately
      if (now < cached.expiresAt) {
        console.log(`✅ [Client Cache] HIT for ${key} (fresh)`)
        return cached.data
      }

      // Stale data - return stale while revalidating in background
      if (now < cached.timestamp + STALE_DURATION) {
        console.log(`⚡ [Client Cache] HIT for ${key} (stale-while-revalidate)`)
        
        // Return stale data immediately
        const staleData = cached.data
        
        // Revalidate in background (don't await)
        this.revalidate(key, fetcher).catch(console.error)
        
        return staleData
      }

      // Expired - remove from cache
      this.cache.delete(key)
    }

    // Check for pending request
    const pending = this.pendingRequests.get(key)
    if (pending) {
      console.log(`🔄 [Client Cache] Waiting for pending request: ${key}`)
      return pending
    }

    // Fetch fresh data
    console.log(`🔄 [Client Cache] MISS for ${key} - fetching`)
    const promise = fetcher()
    this.pendingRequests.set(key, promise)

    try {
      const data = await promise
      this.set(key, data)
      return data
    } finally {
      this.pendingRequests.delete(key)
    }
  }

  /**
   * Store data in cache
   */
  private set<T>(key: string, data: T): void {
    const now = Date.now()
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
    })
    console.log(`💾 [Client Cache] Stored ${key}`)
  }

  /**
   * Revalidate stale data in background
   */
  private async revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<void> {
    try {
      const data = await fetcher()
      this.set(key, data)
      console.log(`✨ [Client Cache] Revalidated ${key}`)
    } catch (error) {
      console.error(`❌ [Client Cache] Revalidation failed for ${key}:`, error)
    }
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
    console.log(`🗑️ [Client Cache] Invalidated ${key}`)
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.pendingRequests.clear()
    console.log(`🧹 [Client Cache] Cleared all cache`)
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      pending: this.pendingRequests.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Export singleton instance
export const teacherCache = new TeacherDashboardCache()

/**
 * Fetch teacher dashboard data with caching
 */
export async function fetchTeacherDashboard(teacherId: string, forceRefresh = false) {
  return teacherCache.get(
    `teacher-dashboard-${teacherId}`,
    async () => {
      const startTime = Date.now()
      const response = await fetch(`/api/teacher/dashboard-combined?teacher_id=${teacherId}`)
      
      if (!response.ok) {
        throw new Error(`Dashboard API returned ${response.status}`)
      }
      
      const data = await response.json()
      const duration = Date.now() - startTime
      console.log(`⚡ [Dashboard API] Fetched in ${duration}ms`)
      
      return data
    },
    { forceRefresh }
  )
}
