/**
 * ============================================================================
 * Assessment-Specific Redis Caching - Upstash REST API
 * ============================================================================
 * Dedicated Upstash Redis instance for maximum assessment performance
 * Uses Upstash REST SDK for serverless-friendly HTTP-based connections
 * Optimized for teacher assessment queries with smart invalidation
 * ============================================================================
 */

import { Redis } from '@upstash/redis'

// ============================================================================
// Configuration - Upstash REST API for Assessments
// ============================================================================

const ASSESSMENT_REST_URL = process.env.UPSTASH_REDIS_ASSESSMENTS_URL
const ASSESSMENT_REST_TOKEN = process.env.UPSTASH_REDIS_ASSESSMENTS_TOKEN

const REDIS_ENABLED = !!(ASSESSMENT_REST_URL && ASSESSMENT_REST_TOKEN)

// Cache key prefixes for organization
export const CACHE_PREFIX = {
    ASSESSMENTS_LIST: 'assessments:list',
    ASSESSMENT_DETAIL: 'assessments:detail',
    ASSESSMENT_GRADES: 'assessments:grades',
    ASSESSMENT_STATS: 'assessments:stats',
    TEACHER_ASSESSMENTS: 'teacher:assessments'
} as const

// Optimized TTLs based on data volatility
export const CACHE_TTL = {
    ASSESSMENTS_LIST: 3600, // 1 hour - assessments don't change frequently
    ASSESSMENT_DETAIL: 1800, // 30 minutes - individual assessments are stable
    ASSESSMENT_GRADES: 600, // 10 minutes - grades update moderately
    ASSESSMENT_STATS: 600, // 10 minutes - stats recalculated frequently
    SHORT: 300, // 5 minutes - highly volatile data
    LONG: 3600 // 1 hour - very stable data
} as const

// ============================================================================
// In-Memory Fallback Cache (Development/Failover)
// ============================================================================

interface MemoryCacheEntry {
    data: any
    timestamp: number
    ttl: number
}

class MemoryCache {
    private cache = new Map<string, MemoryCacheEntry>()
    private readonly MAX_SIZE = 500 // Increased for assessments

    set(key: string, value: any, ttl: number): void {
        // Evict oldest entry if at capacity
        if (this.cache.size >= this.MAX_SIZE) {
            const firstKey = this.cache.keys().next().value
            if (firstKey) this.cache.delete(firstKey)
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

    deletePattern(pattern: string): void {
        const regex = new RegExp(pattern.replace('*', '.*'))
        const keysToDelete = Array.from(this.cache.keys()).filter(key => regex.test(key))
        keysToDelete.forEach(key => this.cache.delete(key))
    }

    clear(): void {
        this.cache.clear()
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.MAX_SIZE,
            keys: Array.from(this.cache.keys())
        }
    }
}

const memoryCache = new MemoryCache()

// ============================================================================
// Assessment Redis Client (Upstash REST SDK)
// ============================================================================

class AssessmentRedisClient {
    private client: Redis | null = null
    private isEnabled = false

    constructor() {
        this.connect()
    }

    connect(): void {
        if (!REDIS_ENABLED) {
            console.log('⚠️  [Assessment Redis] Disabled - using in-memory cache')
            console.log('    Missing: UPSTASH_REDIS_ASSESSMENTS_URL or UPSTASH_REDIS_ASSESSMENTS_TOKEN')
            return
        }

        try {
            this.client = new Redis({
                url: ASSESSMENT_REST_URL!,
                token: ASSESSMENT_REST_TOKEN!,
                // Performance optimizations
                automaticDeserialization: true,
                retry: {
                    retries: 3,
                    backoff: (retryCount) => Math.min(retryCount * 100, 1000)
                }
            })
            this.isEnabled = true
            console.log('✅ [Assessment Redis] Connected successfully (REST API)')
            console.log(`    URL: ${ASSESSMENT_REST_URL}`)
        } catch (error) {
            console.error('❌ [Assessment Redis] Connection failed:', error)
            this.client = null
            this.isEnabled = false
        }
    }

    /**
     * Get with automatic fallback to memory cache
     */
    async get<T = any>(key: string): Promise<T | null> {
        try {
            if (this.isEnabled && this.client) {
                const value = await this.client.get<T>(key)
                if (value !== null) {
                    return value
                }
            }
        } catch (error) {
            console.error(`❌ [Assessment Redis] GET error for ${key}:`, error)
        }

        // Fallback to memory cache
        return memoryCache.get(key)
    }

    /**
     * Set with dual storage (Redis + Memory)
     */
    async set(key: string, value: any, ttl: number = CACHE_TTL.SHORT): Promise<void> {
        // Always set in memory cache first (instant)
        memoryCache.set(key, value, ttl)

        // Then set in Redis (async, best effort)
        if (this.isEnabled && this.client) {
            try {
                await this.client.setex(key, ttl, JSON.stringify(value))
            } catch (error) {
                console.error(`❌ [Assessment Redis] SET error for ${key}:`, error)
            }
        }
    }

    /**
     * Delete key
     */
    async delete(key: string): Promise<void> {
        memoryCache.delete(key)

        if (this.isEnabled && this.client) {
            try {
                await this.client.del(key)
            } catch (error) {
                console.error(`❌ [Assessment Redis] DELETE error for ${key}:`, error)
            }
        }
    }

    /**
     * Delete all keys matching pattern
     */
    async deletePattern(pattern: string): Promise<void> {
        memoryCache.deletePattern(pattern)

        if (this.isEnabled && this.client) {
            try {
                // Get all matching keys
                const keys = await this.client.keys(pattern)

                if (keys.length > 0) {
                    // Delete in pipeline for better performance
                    const pipeline = this.client.pipeline()
                    keys.forEach(key => pipeline.del(key))
                    await pipeline.exec()

                    console.log(`🗑️  [Assessment Redis] Deleted ${keys.length} keys matching ${pattern}`)
                }
            } catch (error) {
                console.error(`❌ [Assessment Redis] DELETE PATTERN error for ${pattern}:`, error)
            }
        }
    }

    /**
     * Multi-get for batch operations
     */
    async mget<T = any>(keys: string[]): Promise<(T | null)[]> {
        if (keys.length === 0) return []

        try {
            if (this.isEnabled && this.client) {
                // Upstash returns array of values or null
                const values = await this.client.mget(...keys) as any
                return values as (T | null)[]
            }
        } catch (error) {
            console.error('❌ [Assessment Redis] MGET error:', error)
        }

        // Fallback to memory cache
        return keys.map(key => memoryCache.get(key))
    }

    /**
     * Get cache statistics
     */
    async getStats() {
        const memStats = memoryCache.getStats()

        if (this.isEnabled && this.client) {
            try {
                const dbsize = await this.client.dbsize()
                return {
                    redis: {
                        enabled: true,
                        connected: true,
                        type: 'REST API',
                        url: ASSESSMENT_REST_URL,
                        dbsize: dbsize
                    },
                    memory: memStats
                }
            } catch (error) {
                console.error('❌ [Assessment Redis] Stats error:', error)
            }
        }

        return {
            redis: {
                enabled: false,
                connected: false,
                type: 'REST API'
            },
            memory: memStats
        }
    }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const assessmentRedis = new AssessmentRedisClient()

// ============================================================================
// High-Level Cache Utilities for Assessments
// ============================================================================

/**
 * Generate cache key for teacher's assessment list
 */
export function getTeacherAssessmentsKey(teacherId: string, schoolId: string): string {
    return `${CACHE_PREFIX.TEACHER_ASSESSMENTS}:${schoolId}:${teacherId}`
}

/**
 * Generate cache key for assessment detail
 */
export function getAssessmentDetailKey(assessmentId: string): string {
    return `${CACHE_PREFIX.ASSESSMENT_DETAIL}:${assessmentId}`
}

/**
 * Generate cache key for assessment grades
 */
export function getAssessmentGradesKey(assessmentId: string): string {
    return `${CACHE_PREFIX.ASSESSMENT_GRADES}:${assessmentId}`
}

/**
 * Generate cache key for assessment stats
 */
export function getAssessmentStatsKey(assessmentId: string): string {
    return `${CACHE_PREFIX.ASSESSMENT_STATS}:${assessmentId}`
}

/**
 * Invalidate all assessment-related caches for a teacher
 */
export async function invalidateTeacherAssessments(teacherId: string, schoolId: string): Promise<void> {
    const pattern = `${CACHE_PREFIX.TEACHER_ASSESSMENTS}:${schoolId}:${teacherId}*`
    await assessmentRedis.deletePattern(pattern)
    console.log(`🗑️  [Cache] Invalidated assessments for teacher ${teacherId}`)
}

/**
 * Invalidate specific assessment and related caches
 */
export async function invalidateAssessment(assessmentId: string): Promise<void> {
    await Promise.all([
        assessmentRedis.delete(getAssessmentDetailKey(assessmentId)),
        assessmentRedis.delete(getAssessmentGradesKey(assessmentId)),
        assessmentRedis.delete(getAssessmentStatsKey(assessmentId))
    ])
    console.log(`🗑️  [Cache] Invalidated assessment ${assessmentId}`)
}

/**
 * Cached fetch with stale-while-revalidate
 */
export async function getCachedAssessments<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.ASSESSMENTS_LIST
): Promise<T> {
    // Try cache first
    const cached = await assessmentRedis.get<T>(key)

    if (cached !== null) {
        console.log(`⚡ [Cache HIT] ${key}`)
        return cached
    }

    // Cache miss - fetch fresh data
    console.log(`❌ [Cache MISS] ${key}`)
    const fresh = await fetcher()

    // Store in cache (fire-and-forget)
    assessmentRedis.set(key, fresh, ttl).catch(err => {
        console.error(`Failed to cache ${key}:`, err)
    })

    return fresh
}
