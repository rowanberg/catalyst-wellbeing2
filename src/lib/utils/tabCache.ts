/**
 * Tab Data Cache Manager
 * Implements a sophisticated caching strategy for tab data with TTL and memory management
 */

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

export class TabDataCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 10 // Maximum number of cache entries
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes default

  // Tab-specific TTL configurations (in milliseconds)
  // All tabs use 1-hour cache to match backend API cache strategy
  private tabTTL: Record<string, number> = {
    today: 60 * 60 * 1000,      // 1 hour
    growth: 60 * 60 * 1000,     // 1 hour
    wellbeing: 60 * 60 * 1000,  // 1 hour
    profile: 60 * 60 * 1000     // 1 hour
  }

  /**
   * Get cached data for a tab
   */
  get(tabId: string): any | null {
    const entry = this.cache.get(tabId)
    
    if (!entry) {
      return null
    }

    // Check if cache has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(tabId)
      return null
    }

    // Update timestamp for LRU
    entry.timestamp = now
    return entry.data
  }

  /**
   * Set cache data for a tab
   */
  set(tabId: string, data: any): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(tabId)) {
      const oldest = this.getOldestEntry()
      if (oldest) {
        this.cache.delete(oldest)
      }
    }

    const ttl = this.tabTTL[tabId] || this.defaultTTL
    this.cache.set(tabId, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  /**
   * Clear cache for a specific tab
   */
  clear(tabId: string): void {
    this.cache.delete(tabId)
  }

  /**
   * Clear all cached data
   */
  clearAll(): void {
    this.cache.clear()
  }

  /**
   * Check if cache exists and is valid
   */
  has(tabId: string): boolean {
    const entry = this.cache.get(tabId)
    if (!entry) return false
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(tabId)
      return false
    }
    
    return true
  }

  /**
   * Get cache age in seconds
   */
  getAge(tabId: string): number | null {
    const entry = this.cache.get(tabId)
    if (!entry) return null
    
    return Math.floor((Date.now() - entry.timestamp) / 1000)
  }

  /**
   * Get the oldest cache entry for LRU eviction
   */
  private getOldestEntry(): string | null {
    let oldest: string | null = null
    let oldestTime = Date.now()

    Array.from(this.cache.entries()).forEach(([key, entry]) => {
      if (entry.timestamp < oldestTime) {
        oldest = key
        oldestTime = entry.timestamp
      }
    })

    return oldest
  }

  /**
   * Preload multiple tabs in background
   */
  async preloadTabs(tabIds: string[], fetchFn: (tabId: string) => Promise<any>): Promise<void> {
    const promises = tabIds.map(async (tabId) => {
      if (!this.has(tabId)) {
        try {
          const data = await fetchFn(tabId)
          this.set(tabId, data)
        } catch (error) {
          console.error(`Failed to preload tab ${tabId}:`, error)
        }
      }
    })

    await Promise.all(promises)
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    entries: Array<{ tabId: string; age: number; ttl: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([tabId, entry]) => ({
      tabId,
      age: Math.floor((Date.now() - entry.timestamp) / 1000),
      ttl: Math.floor(entry.ttl / 1000)
    }))

    return {
      size: this.cache.size,
      entries
    }
  }
}

// Singleton instance for global access
let cacheInstance: TabDataCache | null = null

export function getTabCache(): TabDataCache {
  if (!cacheInstance) {
    cacheInstance = new TabDataCache()
  }
  return cacheInstance
}
