// Simple in-memory cache for API responses
interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

class APICache {
  private cache = new Map<string, CacheEntry>()

  set(key: string, data: any, ttlMinutes: number = 5): void {
    const ttl = ttlMinutes * 60 * 1000 // Convert to milliseconds
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Entry has expired
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      // Entry has expired
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.cache.delete(key))
  }
}

// Global cache instance
export const apiCache = new APICache()

// Helper function to create cache keys
export function createCacheKey(endpoint: string, params?: Record<string, any>): string {
  if (!params) return endpoint
  
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&')
  
  return `${endpoint}?${sortedParams}`
}

// Cleanup expired entries every 10 minutes
setInterval(() => {
  apiCache.cleanup()
}, 10 * 60 * 1000)
