/**
 * Profile Cache Layer - Optimized for high-frequency access
 * Uses multi-tier caching: Memory (instant) → Redis (fast) → Database (slow)
 */

// Tier 1: In-memory cache (0ms latency)
const memoryCache = new Map<string, { data: any; timestamp: number; hits: number }>()

// Cache configuration
const MEMORY_TTL = 30 * 60 * 1000  // 30 minutes
const STALE_WINDOW = 5 * 60 * 1000  // 5 minutes stale-while-revalidate
const MAX_MEMORY_SIZE = 1000  // Max profiles in memory

// Cache statistics for monitoring
let cacheStats = {
  hits: 0,
  misses: 0,
  size: 0,
  lastCleanup: Date.now()
}

/**
 * Get profile from memory cache
 */
export function getFromMemory(userId: string): any | null {
  const entry = memoryCache.get(userId)
  if (!entry) {
    cacheStats.misses++
    return null
  }

  const age = Date.now() - entry.timestamp
  
  // Expired - remove and return null
  if (age > MEMORY_TTL + STALE_WINDOW) {
    memoryCache.delete(userId)
    cacheStats.misses++
    return null
  }

  // Cache hit
  entry.hits++
  cacheStats.hits++
  cacheStats.size = memoryCache.size
  
  return entry.data
}

/**
 * Store profile in memory cache
 */
export function setInMemory(userId: string, data: any): void {
  // Evict least-used entries if cache is full
  if (memoryCache.size >= MAX_MEMORY_SIZE) {
    evictLeastUsed()
  }

  memoryCache.set(userId, {
    data,
    timestamp: Date.now(),
    hits: 0
  })
  
  cacheStats.size = memoryCache.size
}

/**
 * Invalidate specific user's cache
 */
export function invalidateProfile(userId: string): void {
  memoryCache.delete(userId)
  cacheStats.size = memoryCache.size
}

/**
 * Evict least recently used entries (LRU)
 */
function evictLeastUsed(): void {
  const entries: Array<[string, { data: any; timestamp: number; hits: number }]> = []
  memoryCache.forEach((value, key) => {
    entries.push([key, value])
  })
  
  // Sort by hits (ascending) and timestamp (oldest first)
  entries.sort((a, b) => {
    const hitsDiff = a[1].hits - b[1].hits
    if (hitsDiff !== 0) return hitsDiff
    return a[1].timestamp - b[1].timestamp
  })
  
  // Remove bottom 10%
  const toRemove = Math.ceil(entries.length * 0.1)
  for (let i = 0; i < toRemove; i++) {
    memoryCache.delete(entries[i][0])
  }
}

/**
 * Periodic cache cleanup (call from background job)
 */
export function cleanupCache(): void {
  const now = Date.now()
  const hardExpiry = MEMORY_TTL + STALE_WINDOW
  const toDelete: string[] = []
  
  memoryCache.forEach((entry, userId) => {
    if (now - entry.timestamp > hardExpiry) {
      toDelete.push(userId)
    }
  })
  
  toDelete.forEach(userId => memoryCache.delete(userId))
  
  cacheStats.size = memoryCache.size
  cacheStats.lastCleanup = now
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    ...cacheStats,
    hitRate: cacheStats.hits + cacheStats.misses > 0 
      ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2) + '%'
      : '0%'
  }
}

/**
 * Clear entire cache (use sparingly)
 */
export function clearAllCache(): void {
  memoryCache.clear()
  cacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    lastCleanup: Date.now()
  }
}

// Auto-cleanup every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupCache()
  }, 10 * 60 * 1000)
}
