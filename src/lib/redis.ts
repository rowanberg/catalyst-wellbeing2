import { Redis } from '@upstash/redis'

// Type definitions for cached data
export interface CachedGradesData {
  grades: Array<{
    id: string
    grade_level: number
    grade_name: string
    is_active: boolean
  }>
  school_id: string
  cached_at: string
  source: string
}

// Initialize Upstash Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

// Cache key generators
export const CacheKeys = {
  grades: (schoolId: string) => `school:${schoolId}:grades`,
}

// Cache TTL constants (in seconds)
export const CacheTTL = {
  GRADES: 864000, // 10 days - grade levels change rarely, invalidated by admin
}

// Grade Levels Cache Functions
export async function getCachedGrades(schoolId: string): Promise<CachedGradesData | null> {
  try {
    const key = CacheKeys.grades(schoolId)
    const data = await redis.get<CachedGradesData>(key)
    return data
  } catch (error) {
    console.error('Redis GET error:', error)
    return null // Graceful degradation - return null on cache failure
  }
}

export async function setCachedGrades(schoolId: string, data: CachedGradesData) {
  try {
    const key = CacheKeys.grades(schoolId)
    await redis.set(key, data, { ex: CacheTTL.GRADES })
    console.log(`✅ [Redis] Cached grades for school ${schoolId}`)
  } catch (error) {
    console.error('Redis SET error:', error)
    // Don't throw - cache failure shouldn't break the API
  }
}

export async function invalidateGrades(schoolId: string) {
  try {
    const key = CacheKeys.grades(schoolId)
    await redis.del(key)
    console.log(`🗑️ [Redis] Invalidated grades cache for school ${schoolId}`)
  } catch (error) {
    console.error('Redis DEL error:', error)
  }
}

// Batch invalidation for multiple schools (if needed)
export async function invalidateMultipleSchoolGrades(schoolIds: string[]) {
  try {
    const keys = schoolIds.map(id => CacheKeys.grades(id))
    if (keys.length > 0) {
      await redis.del(...keys)
      console.log(`🗑️ [Redis] Invalidated grades cache for ${schoolIds.length} schools`)
    }
  } catch (error) {
    console.error('Redis batch DEL error:', error)
  }
}

// Health check function
export async function checkRedisHealth() {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis health check failed:', error)
    return false
  }
}
