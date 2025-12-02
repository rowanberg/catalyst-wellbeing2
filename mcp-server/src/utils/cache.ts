// Simple in-memory cache for MCP tool responses
// Improves performance by avoiding duplicate Supabase queries

interface CacheEntry {
    data: any
    timestamp: number
}

const cache = new Map<string, CacheEntry>()

/**
 * Get cached data if it exists and hasn't expired
 * @param key Cache key
 * @param ttl Time to live in milliseconds (default: 60 seconds)
 * @returns Cached data or null if expired/not found
 */
export function getCached(key: string, ttl: number = 60000): any | null {
    const cached = cache.get(key)
    if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.data
    }

    // Clean up expired entry
    if (cached) {
        cache.delete(key)
    }

    return null
}

/**
 * Store data in cache
 * @param key Cache key
 * @param data Data to cache
 */
export function setCache(key: string, data: any): void {
    cache.set(key, {
        data,
        timestamp: Date.now()
    })
}

/**
 * Clear specific cache entry
 * @param key Cache key
 */
export function clearCache(key: string): void {
    cache.delete(key)
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
    cache.clear()
}

/**
 * Clean up expired cache entries (run periodically)
 * @param maxAge Maximum age in milliseconds (default: 5 minutes)
 */
export function cleanupCache(maxAge: number = 300000): void {
    const now = Date.now()
    cache.forEach((entry, key) => {
        if (now - entry.timestamp > maxAge) {
            cache.delete(key)
        }
    })
}

// Auto-cleanup every 5 minutes
setInterval(() => cleanupCache(), 300000)
