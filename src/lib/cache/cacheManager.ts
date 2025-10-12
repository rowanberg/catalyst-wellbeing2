/**
 * Cache Manager for Student Dashboard
 * Implements TTL-based caching with different strategies for different data types
 */

import { LRUCache } from 'lru-cache';

interface CacheOptions {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Cache configurations for different data types
const CACHE_CONFIGS = {
  // Wallet data - moderate freshness needed (5 minutes)
  wallet: { ttl: 5 * 60 * 1000, maxSize: 1000 },
  
  // Transactions - can be slightly stale (30 seconds)
  transactions: { ttl: 30 * 1000, maxSize: 500 },
  
  // Dashboard stats - can be cached longer (10 minutes)
  dashboard: { ttl: 10 * 60 * 1000, maxSize: 200 },
  
  // Profile data - cached for longer (15 minutes)
  profile: { ttl: 15 * 60 * 1000, maxSize: 1000 },
  
  // Static-ish data like school info (1 hour)
  school: { ttl: 60 * 60 * 1000, maxSize: 100 },
  
  // API responses that change rarely (30 minutes)
  metadata: { ttl: 30 * 60 * 1000, maxSize: 50 }
};

class CacheManager {
  private caches: Map<string, LRUCache<string, CacheItem<any>>>;
  
  constructor() {
    this.caches = new Map();
    
    // Initialize caches for each type
    Object.entries(CACHE_CONFIGS).forEach(([type, config]) => {
      this.caches.set(type, new LRUCache({
        max: config.maxSize,
        ttl: config.ttl,
        allowStale: false,
        updateAgeOnGet: false,
        noDeleteOnStaleGet: false
      }));
    });
  }

  /**
   * Get cached data with TTL check
   */
  get<T>(type: string, key: string): T | null {
    const cache = this.caches.get(type);
    if (!cache) return null;

    const item = cache.get(key);
    if (!item) return null;

    // Check if item is still valid
    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Set data in cache with timestamp
   */
  set<T>(type: string, key: string, data: T): void {
    const cache = this.caches.get(type);
    if (!cache) return;

    const config = CACHE_CONFIGS[type as keyof typeof CACHE_CONFIGS];
    if (!config) return;

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: config.ttl
    };

    cache.set(key, item);
  }

  /**
   * Delete specific cache entry
   */
  delete(type: string, key: string): void {
    const cache = this.caches.get(type);
    if (cache) {
      cache.delete(key);
    }
  }

  /**
   * Clear entire cache type
   */
  clear(type: string): void {
    const cache = this.caches.get(type);
    if (cache) {
      cache.clear();
    }
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(type: string, pattern: string): void {
    const cache = this.caches.get(type);
    if (!cache) return;

    const regex = new RegExp(pattern);
    const keysToDelete: string[] = [];

    cache.forEach((value, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    
    this.caches.forEach((cache, type) => {
      stats[type] = {
        size: cache.size,
        maxSize: cache.max,
        hitRatio: cache.calculatedSize > 0 ? (cache.size / cache.calculatedSize) : 0
      };
    });

    return stats;
  }

  /**
   * Get or set with a function (memoization pattern)
   */
  async getOrSet<T>(
    type: string, 
    key: string, 
    fetchFunction: () => Promise<T>,
    forceRefresh: boolean = false
  ): Promise<T> {
    // Try to get from cache first
    if (!forceRefresh) {
      const cached = this.get<T>(type, key);
      if (cached !== null) {
        return cached;
      }
    }

    // Fetch fresh data
    try {
      const data = await fetchFunction();
      this.set(type, key, data);
      return data;
    } catch (error) {
      // If fetch fails and we have stale data, return it
      const stale = this.get<T>(type, key);
      if (stale !== null) {
        return stale;
      }
      throw error;
    }
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

// Utility functions for common caching patterns

/**
 * Cache wrapper for API calls
 */
export async function withCache<T>(
  type: string,
  key: string,
  apiCall: () => Promise<T>,
  options: { forceRefresh?: boolean } = {}
): Promise<T> {
  return cacheManager.getOrSet(type, key, apiCall, options.forceRefresh);
}

/**
 * Generate cache key for user-specific data
 */
export function generateUserCacheKey(userId: string, resource: string, ...params: string[]): string {
  return [userId, resource, ...params].join(':');
}

/**
 * Generate cache key for wallet-specific data
 */
export function generateWalletCacheKey(walletId: string, resource: string, ...params: string[]): string {
  return [walletId, resource, ...params].join(':');
}

/**
 * Invalidate user-related caches
 */
export function invalidateUserCaches(userId: string): void {
  const types = ['wallet', 'transactions', 'dashboard', 'profile'];
  
  types.forEach(type => {
    cacheManager.invalidatePattern(type, `^${userId}:`);
  });
}

/**
 * Invalidate wallet-related caches
 */
export function invalidateWalletCaches(walletId: string): void {
  const types = ['wallet', 'transactions'];
  
  types.forEach(type => {
    cacheManager.invalidatePattern(type, `^${walletId}:`);
  });
}

/**
 * Pre-warm cache with commonly accessed data
 */
export async function preWarmCache(userId: string): Promise<void> {
  // This can be called after login to populate cache
  // Implementation depends on your specific use case
  console.log(`Pre-warming cache for user ${userId}`);
}

/**
 * Cache middleware for API routes
 */
export function createCacheMiddleware(type: string, keyGenerator: (req: any) => string, ttlOverride?: number) {
  return async function cacheMiddleware(
    req: any,
    handler: () => Promise<any>
  ): Promise<any> {
    const key = keyGenerator(req);
    
    try {
      return await withCache(type, key, handler);
    } catch (error) {
      // If caching fails, execute handler directly
      return await handler();
    }
  };
}

// Export cache configurations for external use
export { CACHE_CONFIGS };

// Cleanup function (call on app shutdown)
export function cleanupCache(): void {
  cacheManager.clearAll();
}
