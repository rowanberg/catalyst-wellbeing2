/**
 * ============================================================================
 * Redis Caching Infrastructure
 * ============================================================================
 * Enterprise-grade caching with Redis
 * Fallback to in-memory cache when Redis unavailable
 * 
 * Features:
 * - Automatic JSON serialization
 * - TTL support
 * - Stale-while-revalidate pattern
 * - In-memory fallback
 * - Connection pooling
 * - Error handling
 * ============================================================================
 */

import { createClient, RedisClientType } from 'redis'

// ============================================================================
// Configuration
// ============================================================================

const REDIS_URL = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL
const REDIS_ENABLED = !!REDIS_URL && process.env.NODE_ENV === 'production'

// ============================================================================
// In-Memory Fallback Cache
// ============================================================================

interface MemoryCacheEntry {
  data: any
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache = new Map<string, MemoryCacheEntry>()
  private readonly MAX_SIZE = 1000

  set(key: string, value: any, ttl: number): void {
    if (this.cache.size >= this.MAX_SIZE) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl
    })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl * 1000
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  keys(pattern: string): string[] {
    const regex = new RegExp(pattern.replace('*', '.*'))
    return Array.from(this.cache.keys()).filter(key => regex.test(key))
  }
}

const memoryCache = new MemoryCache()

// ============================================================================
// Redis Client
// ============================================================================

class RedisCacheClient {
  private client: RedisClientType | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  async connect(): Promise<void> {
    if (this.isConnected) return
    if (this.connectionPromise) return this.connectionPromise

    if (!REDIS_ENABLED) {
      console.log('⚠️  [Redis] Disabled - using in-memory cache')
      return
    }

    this.connectionPromise = (async () => {
      try {
        this.client = createClient({
          url: REDIS_URL,
          socket: {
            connectTimeout: 5000,
            reconnectStrategy: (retries) => {
              if (retries > 3) {
                console.error('❌ [Redis] Max retries reached')
                return new Error('Max retries reached')
              }
              return Math.min(retries * 100, 3000)
            }
          }
        })

        this.client.on('error', (err) => {
          console.error('❌ [Redis] Error:', err)
          this.isConnected = false
        })

        this.client.on('connect', () => {
          console.log('✅ [Redis] Connected')
          this.isConnected = true
        })

        this.client.on('disconnect', () => {
          console.log('⚠️  [Redis] Disconnected')
          this.isConnected = false
        })

        await this.client.connect()
      } catch (error) {
        console.error('❌ [Redis] Failed to connect:', error)
        this.client = null
        this.isConnected = false
      }
    })()

    await this.connectionPromise
    this.connectionPromise = null
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.isConnected && this.client) {
        const value = await this.client.get(key)
        if (value) {
          return JSON.parse(value) as T
        }
      }
    } catch (error) {
      console.error('❌ [Redis] GET error:', error)
    }

    // Fallback to memory cache
    return memoryCache.get(key)
  }

  async set(key: string, value: any, ttl: number = 300): Promise<void> {
    const serialized = JSON.stringify(value)

    try {
      // Try Redis first
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttl, serialized)
      }
    } catch (error) {
      console.error('❌ [Redis] SET error:', error)
    }

    // Always set in memory cache as backup
    memoryCache.set(key, value, ttl)
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key)
      }
    } catch (error) {
      console.error('❌ [Redis] DELETE error:', error)
    }

    memoryCache.delete(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern)
        if (keys.length > 0) {
          await this.client.del(keys)
        }
      }
    } catch (error) {
      console.error('❌ [Redis] DELETE PATTERN error:', error)
    }

    // Fallback to memory cache
    const keys = memoryCache.keys(pattern)
    keys.forEach(key => memoryCache.delete(key))
  }

  async clear(): Promise<void> {
    try {
      if (this.isConnected && this.client) {
        await this.client.flushDb()
      }
    } catch (error) {
      console.error('❌ [Redis] CLEAR error:', error)
    }

    memoryCache.clear()
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const redis = new RedisCacheClient()

// Auto-connect on import (server-side only)
if (typeof window === 'undefined') {
  redis.connect().catch(console.error)
}

// ============================================================================
// High-Level Cache Utilities
// ============================================================================

export interface CacheOptions {
  ttl?: number // seconds
  staleWhileRevalidate?: boolean
  tags?: string[]
}

/**
 * Get or fetch data with caching
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300, staleWhileRevalidate = false } = options

  // Try cache first
  const cached = await redis.get<T>(key)
  
  if (cached !== null) {
    // Cache hit
    if (staleWhileRevalidate) {
      // Return cached data immediately, refresh in background
      fetcher().then(fresh => redis.set(key, fresh, ttl)).catch(console.error)
    }
    return cached
  }

  // Cache miss - fetch fresh data
  const fresh = await fetcher()
  await redis.set(key, fresh, ttl)
  return fresh
}

/**
 * Cache with automatic invalidation tags
 */
export async function setCachedWithTags(
  key: string,
  value: any,
  tags: string[],
  ttl: number = 300
): Promise<void> {
  await redis.set(key, value, ttl)
  
  // Store tag mappings
  for (const tag of tags) {
    const tagKey = `tag:${tag}`
    const taggedKeys = await redis.get<string[]>(tagKey) || []
    if (!taggedKeys.includes(key)) {
      taggedKeys.push(key)
      await redis.set(tagKey, taggedKeys, ttl)
    }
  }
}

/**
 * Invalidate all cached entries with specific tag
 */
export async function invalidateTag(tag: string): Promise<void> {
  const tagKey = `tag:${tag}`
  const keys = await redis.get<string[]>(tagKey)
  
  if (keys && keys.length > 0) {
    await Promise.all(keys.map(key => redis.delete(key)))
  }
  
  await redis.delete(tagKey)
}

/**
 * Cache key builder for consistent naming
 */
export const cacheKeys = {
  studentGrowth: (studentId: string) => `student:${studentId}:growth`,
  studentToday: (studentId: string) => `student:${studentId}:today`,
  studentProfile: (userId: string) => `student:${userId}:profile`,
  teacherClasses: (teacherId: string) => `teacher:${teacherId}:classes`,
  parentDashboard: (parentId: string) => `parent:${parentId}:dashboard`,
  schoolAnnouncements: (schoolId: string) => `school:${schoolId}:announcements`,
  schoolPolls: (schoolId: string) => `school:${schoolId}:polls`,
}

// ============================================================================
// Cache Statistics
// ============================================================================

export async function getCacheStats() {
  return {
    redisConnected: redis['isConnected'],
    redisEnabled: REDIS_ENABLED,
    memoryCacheSize: memoryCache['cache'].size
  }
}
