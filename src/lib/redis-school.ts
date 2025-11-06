import { Redis } from '@upstash/redis'

/**
 * Separate Redis instance for SCHOOL CONFIGURATION caching
 * 
 * Why separate instance?
 * - Higher rate limits (separate 10K commands/day quota)
 * - Isolate school data from grades data
 * - Different TTL requirements
 * - Used only by TEACHERS (not students)
 */
export const redisSchool = new Redis({
  url: process.env.UPSTASH_REDIS_SCHOOL_URL!,
  token: process.env.UPSTASH_REDIS_SCHOOL_TOKEN!,
})

// Cache key generators for school data
export const SchoolCacheKeys = {
  info: (schoolId: string) => `school:${schoolId}:info`,
  settings: (schoolId: string) => `school:${schoolId}:settings`,
  details: (schoolId: string) => `school:${schoolId}:details`,
}

// Cache TTL constants (in seconds)
export const SchoolCacheTTL = {
  INFO: 1296000, // 15 days - school info changes very rarely
  SETTINGS: 1296000, // 15 days - settings change rarely
  DETAILS: 1296000, // 15 days - details rarely change
}

/**
 * Get cached school information
 * Used by: /api/teacher/school-info
 */
export async function getCachedSchoolInfo(schoolId: string) {
  try {
    const key = SchoolCacheKeys.info(schoolId)
    const data = await redisSchool.get(key)
    if (data) {
      console.log(`✅ [School Redis] Cache HIT for school: ${schoolId}`)
    }
    return data
  } catch (error) {
    console.error('School Redis GET error:', error)
    return null // Graceful degradation
  }
}

/**
 * Cache school information
 * TTL: 15 days (school info rarely changes, admin will invalidate on updates)
 */
export async function setCachedSchoolInfo(schoolId: string, data: any) {
  try {
    const key = SchoolCacheKeys.info(schoolId)
    await redisSchool.set(key, data, { ex: SchoolCacheTTL.INFO })
    console.log(`✅ [School Redis] Cached info for school ${schoolId} (15d TTL)`)
  } catch (error) {
    console.error('School Redis SET error:', error)
    // Don't throw - cache failure shouldn't break the API
  }
}

/**
 * Invalidate school information cache
 * Call this when admin updates school details
 */
export async function invalidateSchoolInfo(schoolId: string) {
  try {
    const key = SchoolCacheKeys.info(schoolId)
    await redisSchool.del(key)
    console.log(`🗑️ [School Redis] Invalidated info cache for school: ${schoolId}`)
  } catch (error) {
    console.error('School Redis DEL error:', error)
  }
}

/**
 * Get cached school settings
 * Used by: /api/admin/school-settings (if needed)
 */
export async function getCachedSchoolSettings(schoolId: string) {
  try {
    const key = SchoolCacheKeys.settings(schoolId)
    const data = await redisSchool.get(key)
    return data
  } catch (error) {
    console.error('School Redis GET error:', error)
    return null
  }
}

/**
 * Cache school settings
 * TTL: 15 days (settings rarely change, admin will invalidate on updates)
 */
export async function setCachedSchoolSettings(schoolId: string, data: any) {
  try {
    const key = SchoolCacheKeys.settings(schoolId)
    await redisSchool.set(key, data, { ex: SchoolCacheTTL.SETTINGS })
    console.log(`✅ [School Redis] Cached settings for school ${schoolId} (15d TTL)`)
  } catch (error) {
    console.error('School Redis SET error:', error)
  }
}

/**
 * Invalidate school settings cache
 */
export async function invalidateSchoolSettings(schoolId: string) {
  try {
    const key = SchoolCacheKeys.settings(schoolId)
    await redisSchool.del(key)
    console.log(`🗑️ [School Redis] Invalidated settings cache for school: ${schoolId}`)
  } catch (error) {
    console.error('School Redis DEL error:', error)
  }
}

/**
 * Invalidate ALL school-related caches for a school
 * Use when making major changes to school data
 */
export async function invalidateAllSchoolCaches(schoolId: string) {
  try {
    const keys = [
      SchoolCacheKeys.info(schoolId),
      SchoolCacheKeys.settings(schoolId),
      SchoolCacheKeys.details(schoolId),
    ]
    await redisSchool.del(...keys)
    console.log(`🗑️ [School Redis] Invalidated ALL caches for school: ${schoolId}`)
  } catch (error) {
    console.error('School Redis bulk DEL error:', error)
  }
}

/**
 * Health check for school Redis instance
 */
export async function checkSchoolRedisHealth() {
  try {
    const result = await redisSchool.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('School Redis health check failed:', error)
    return false
  }
}
