/**
 * Attendance Data Cache
 * Provides fast access to prefetched attendance data
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class AttendanceCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return false
    }

    // Check if cache is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  clear(): void {
    this.cache.clear()
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  // Invalidate all keys matching a pattern
  invalidatePattern(pattern: RegExp): void {
    const keys = Array.from(this.cache.keys())
    for (const key of keys) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }
}

export const attendanceCache = new AttendanceCache()
