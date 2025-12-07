import { Redis } from '@upstash/redis'

/**
 * TWO-TIER CACHING STRATEGY for Parent Portal
 * 
 * Tier 1: LOCAL MEMORY CACHE (5-30 minutes)
 * - Ultra-fast access (0ms network latency)
 * - Reduces Redis API calls by 95%+
 * - Auto-expires based on data type
 * 
 * Tier 2: REDIS CACHE (5 minutes - 1 hour)
 * - Persistent across server restarts
 * - Shared across multiple instances
 * - Fallback when local cache expires
 */

// ============================================================================
// LOCAL IN-MEMORY CACHE (Tier 1)
// ============================================================================

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const localParentCache = new Map<string, CacheEntry<any>>()

// Different TTLs for different data types
const LOCAL_CACHE_TTL = {
  SETTINGS: 30 * 60 * 1000,      // 30 minutes (changes rarely)
  DASHBOARD: 5 * 60 * 1000,      // 5 minutes (changes frequently)
  ANALYTICS: 15 * 60 * 1000,     // 15 minutes (expensive queries)
  COMMUNITY: 5 * 60 * 1000,      // 5 minutes (real-time content)
  WELLBEING: 10 * 60 * 1000,
}

/**
 * Get from local memory cache
 * Returns null if expired or not found
 */
function getFromLocalCache<T>(key: string): T | null {
  const entry = localParentCache.get(key)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    localParentCache.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * Set to local memory cache with custom TTL
 */
function setToLocalCache<T>(key: string, data: T, ttlMs: number): void {
  localParentCache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  })
}

/**
 * Clear from local memory cache
 */
function clearFromLocalCache(key: string): void {
  localParentCache.delete(key)
}

/**
 * Clear all local parent cache (for testing/debugging)
 */
export function clearAllLocalParentCache(): void {
  localParentCache.clear()
  console.log('🧹 [Local Cache] Cleared all parent portal cache')
}

// ============================================================================
// REDIS CACHE (Tier 2)
// ============================================================================

/**
 * Single Upstash Redis instance for ALL PARENT DATA
 * 
 * Why single instance?
 * - Parent portal has moderate traffic (manageable by one Redis)
 * - Simplifies management and reduces costs
 * - 10K commands/day free tier is sufficient for most schools
 * - Can upgrade to paid tier if needed (cheap)
 */
export const redisParents = new Redis({
  url: process.env.UPSTASH_REDIS_PARENTS_URL!,
  token: process.env.UPSTASH_REDIS_PARENTS_TOKEN!,
})

// Cache key generators for parent data
export const ParentCacheKeys = {
  // Parent settings (profile + children list)
  settings: (parentId: string) => `parent:${parentId}:settings`,

  // Student dashboard data
  dashboard: (studentId: string) => `student:${studentId}:dashboard`,

  // Student analytics
  analytics: (studentId: string) => `student:${studentId}:analytics`,
  wellbeing: (studentId: string) => `student:${studentId}:wellbeing`,

  // Community feed (per school per page)
  communityFeed: (schoolId: string, page: number, filters?: string) =>
    `community:${schoolId}:page:${page}${filters ? `:${filters}` : ''}`,
}

// Cache TTL constants (in seconds)
export const ParentCacheTTL = {
  SETTINGS: 1296000,      // 15 days - parent settings change rarely
  DASHBOARD: 1296000,     // 15 days - invalidated when data changes
  ANALYTICS: 1296000,     // 15 days - invalidated when grades change
  COMMUNITY_FEED: 1296000, // 15 days - invalidated when posts change
  WELLBEING: 1296000,
}

// ============================================================================
// PARENT SETTINGS CACHE (Profile + Children List)
// ============================================================================

/**
 * Get cached parent settings with TWO-TIER CACHING
 * Used by: /api/v1/parents/settings (GET)
 */
export async function getCachedParentSettings(parentId: string) {
  const cacheKey = ParentCacheKeys.settings(parentId)

  // Tier 1: Check local memory cache first (ULTRA FAST)
  const localData = getFromLocalCache(cacheKey)
  if (localData) {
    console.log(`⚡ [Local Cache] INSTANT HIT - Parent settings: ${parentId} (0ms)`)
    return localData
  }

  // Tier 2: Check Redis cache (FAST)
  try {
    const redisData = await redisParents.get(cacheKey)
    if (redisData) {
      console.log(`✅ [Parents Redis] Cache HIT - Settings: ${parentId} (~50ms)`)
      // Store in local cache for next request
      setToLocalCache(cacheKey, redisData, LOCAL_CACHE_TTL.SETTINGS)
      console.log(`💾 [Local Cache] Stored parent settings (30min TTL)`)
      return redisData
    }
    return null
  } catch (error) {
    console.error('Parents Redis GET error (settings):', error)
    return null
  }
}

/**
 * Cache parent settings in BOTH tiers
 */
export async function setCachedParentSettings(parentId: string, data: any) {
  const cacheKey = ParentCacheKeys.settings(parentId)

  // Tier 1: Local memory
  setToLocalCache(cacheKey, data, LOCAL_CACHE_TTL.SETTINGS)
  console.log(`💾 [Local Cache] Stored parent settings: ${parentId} (30min TTL)`)

  // Tier 2: Redis
  try {
    await redisParents.set(cacheKey, data, { ex: ParentCacheTTL.SETTINGS })
    console.log(`✅ [Parents Redis] Cached settings: ${parentId} (15d TTL)`)
  } catch (error) {
    console.error('Parents Redis SET error (settings):', error)
  }
}

/**
 * Invalidate parent settings from BOTH tiers
 * Call when: parent profile updated, child linked/unlinked
 */
export async function invalidateParentSettings(parentId: string) {
  const cacheKey = ParentCacheKeys.settings(parentId)

  clearFromLocalCache(cacheKey)
  console.log(`🗑️ [Local Cache] Cleared parent settings: ${parentId}`)

  try {
    await redisParents.del(cacheKey)
    console.log(`🗑️ [Parents Redis] Invalidated settings: ${parentId}`)
  } catch (error) {
    console.error('Parents Redis DEL error (settings):', error)
  }
}

// ============================================================================
// STUDENT DASHBOARD CACHE
// ============================================================================

/**
 * Get cached student dashboard with TWO-TIER CACHING
 * Used by: /api/v1/parents/dashboard (GET)
 */
export async function getCachedStudentDashboard(studentId: string) {
  const cacheKey = ParentCacheKeys.dashboard(studentId)

  // Tier 1: Local cache
  const localData = getFromLocalCache(cacheKey)
  if (localData) {
    console.log(`⚡ [Local Cache] INSTANT HIT - Dashboard: ${studentId} (0ms)`)
    return localData
  }

  // Tier 2: Redis
  try {
    const redisData = await redisParents.get(cacheKey)
    if (redisData) {
      console.log(`✅ [Parents Redis] Cache HIT - Dashboard: ${studentId} (~50ms)`)
      setToLocalCache(cacheKey, redisData, LOCAL_CACHE_TTL.DASHBOARD)
      console.log(`💾 [Local Cache] Stored dashboard (5min TTL)`)
      return redisData
    }
    return null
  } catch (error) {
    console.error('Parents Redis GET error (dashboard):', error)
    return null
  }
}

/**
 * Cache student dashboard in BOTH tiers
 */
export async function setCachedStudentDashboard(studentId: string, data: any) {
  const cacheKey = ParentCacheKeys.dashboard(studentId)

  // Tier 1: Local memory (5 min - frequently changing data)
  setToLocalCache(cacheKey, data, LOCAL_CACHE_TTL.DASHBOARD)
  console.log(`💾 [Local Cache] Stored dashboard: ${studentId} (5min TTL)`)

  // Tier 2: Redis
  try {
    await redisParents.set(cacheKey, data, { ex: ParentCacheTTL.DASHBOARD })
    console.log(`✅ [Parents Redis] Cached dashboard: ${studentId} (15d TTL)`)
  } catch (error) {
    console.error('Parents Redis SET error (dashboard):', error)
  }
}

/**
 * Invalidate student dashboard from BOTH tiers
 * Call when: grade added, attendance marked, assignment created, mood tracked
 */
export async function invalidateStudentDashboard(studentId: string) {
  const cacheKey = ParentCacheKeys.dashboard(studentId)

  clearFromLocalCache(cacheKey)
  console.log(`🗑️ [Local Cache] Cleared dashboard: ${studentId}`)

  try {
    await redisParents.del(cacheKey)
    console.log(`🗑️ [Parents Redis] Invalidated dashboard: ${studentId}`)
  } catch (error) {
    console.error('Parents Redis DEL error (dashboard):', error)
  }
}

// ============================================================================
// STUDENT ANALYTICS CACHE
// ============================================================================

/**
 * Get cached student analytics with TWO-TIER CACHING
 * Used by: /api/v1/students/[id]/analytics (GET)
 */
export async function getCachedStudentAnalytics(studentId: string) {
  const cacheKey = ParentCacheKeys.analytics(studentId)

  // Tier 1: Local cache
  const localData = getFromLocalCache(cacheKey)
  if (localData) {
    console.log(`⚡ [Local Cache] INSTANT HIT - Analytics: ${studentId} (0ms)`)
    return localData
  }

  // Tier 2: Redis
  try {
    const redisData = await redisParents.get(cacheKey)
    if (redisData) {
      console.log(`✅ [Parents Redis] Cache HIT - Analytics: ${studentId} (~50ms)`)
      setToLocalCache(cacheKey, redisData, LOCAL_CACHE_TTL.ANALYTICS)
      console.log(`💾 [Local Cache] Stored analytics (15min TTL)`)
      return redisData
    }
    return null
  } catch (error) {
    console.error('Parents Redis GET error (analytics):', error)
    return null
  }
}

/**
 * Cache student analytics in BOTH tiers
 */
export async function setCachedStudentAnalytics(studentId: string, data: any) {
  const cacheKey = ParentCacheKeys.analytics(studentId)

  // Tier 1: Local memory (15 min - expensive calculations)
  setToLocalCache(cacheKey, data, LOCAL_CACHE_TTL.ANALYTICS)
  console.log(`💾 [Local Cache] Stored analytics: ${studentId} (15min TTL)`)

  // Tier 2: Redis
  try {
    await redisParents.set(cacheKey, data, { ex: ParentCacheTTL.ANALYTICS })
    console.log(`✅ [Parents Redis] Cached analytics: ${studentId} (15d TTL)`)
  } catch (error) {
    console.error('Parents Redis SET error (analytics):', error)
  }
}

/**
 * Invalidate student analytics from BOTH tiers
 * Call when: grade added (affects GPA, trends)
 */
export async function invalidateStudentAnalytics(studentId: string) {
  const cacheKey = ParentCacheKeys.analytics(studentId)

  clearFromLocalCache(cacheKey)
  console.log(`🗑️ [Local Cache] Cleared analytics: ${studentId}`)

  try {
    await redisParents.del(cacheKey)
    console.log(`🗑️ [Parents Redis] Invalidated analytics: ${studentId}`)
  } catch (error) {
    console.error('Parents Redis DEL error (analytics):', error)
  }
}

export async function getCachedStudentWellbeing(studentId: string) {
  const cacheKey = ParentCacheKeys.wellbeing(studentId)

  const localData = getFromLocalCache(cacheKey)
  if (localData) {
    console.log(`⚡ [Local Cache] INSTANT HIT - Wellbeing: ${studentId} (0ms)`)
    return localData
  }

  try {
    const redisData = await redisParents.get(cacheKey)
    if (redisData) {
      console.log(`✅ [Parents Redis] Cache HIT - Wellbeing: ${studentId} (~50ms)`)
      setToLocalCache(cacheKey, redisData, LOCAL_CACHE_TTL.WELLBEING)
      console.log('💾 [Local Cache] Stored wellbeing (10min TTL)')
      return redisData
    }
    return null
  } catch (error) {
    console.error('Parents Redis GET error (wellbeing):', error)
    return null
  }
}

export async function setCachedStudentWellbeing(studentId: string, data: any) {
  const cacheKey = ParentCacheKeys.wellbeing(studentId)

  setToLocalCache(cacheKey, data, LOCAL_CACHE_TTL.WELLBEING)
  console.log(`💾 [Local Cache] Stored wellbeing: ${studentId} (10min TTL)`)

  try {
    await redisParents.set(cacheKey, data, { ex: ParentCacheTTL.WELLBEING })
    console.log(`✅ [Parents Redis] Cached wellbeing: ${studentId} (15d TTL)`)
  } catch (error) {
    console.error('Parents Redis SET error (wellbeing):', error)
  }
}

export async function invalidateStudentWellbeing(studentId: string) {
  const cacheKey = ParentCacheKeys.wellbeing(studentId)

  clearFromLocalCache(cacheKey)
  console.log(`🗑️ [Local Cache] Cleared wellbeing: ${studentId}`)

  try {
    await redisParents.del(cacheKey)
    console.log(`🗑️ [Parents Redis] Invalidated wellbeing: ${studentId}`)
  } catch (error) {
    console.error('Parents Redis DEL error (wellbeing):', error)
  }
}

// ============================================================================
// COMMUNITY FEED CACHE
// ============================================================================

/**
 * Get cached community feed with TWO-TIER CACHING
 * Used by: /api/v1/parents/community-feed (GET)
 */
export async function getCachedCommunityFeed(schoolId: string, page: number, filters?: string) {
  const cacheKey = ParentCacheKeys.communityFeed(schoolId, page, filters)

  // Tier 1: Local cache
  const localData = getFromLocalCache(cacheKey)
  if (localData) {
    console.log(`⚡ [Local Cache] INSTANT HIT - Feed: ${schoolId} page ${page} (0ms)`)
    return localData
  }

  // Tier 2: Redis
  try {
    const redisData = await redisParents.get(cacheKey)
    if (redisData) {
      console.log(`✅ [Parents Redis] Cache HIT - Feed: ${schoolId} page ${page} (~50ms)`)
      setToLocalCache(cacheKey, redisData, LOCAL_CACHE_TTL.COMMUNITY)
      console.log(`💾 [Local Cache] Stored feed (5min TTL)`)
      return redisData
    }
    return null
  } catch (error) {
    console.error('Parents Redis GET error (feed):', error)
    return null
  }
}

/**
 * Cache community feed in BOTH tiers
 */
export async function setCachedCommunityFeed(schoolId: string, page: number, data: any, filters?: string) {
  const cacheKey = ParentCacheKeys.communityFeed(schoolId, page, filters)

  // Tier 1: Local memory (5 min - real-time content)
  setToLocalCache(cacheKey, data, LOCAL_CACHE_TTL.COMMUNITY)
  console.log(`💾 [Local Cache] Stored feed: ${schoolId} page ${page} (5min TTL)`)

  // Tier 2: Redis
  try {
    await redisParents.set(cacheKey, data, { ex: ParentCacheTTL.COMMUNITY_FEED })
    console.log(`✅ [Parents Redis] Cached feed: ${schoolId} page ${page} (15d TTL)`)
  } catch (error) {
    console.error('Parents Redis SET error (feed):', error)
  }
}

/**
 * Invalidate all community feed pages for a school from BOTH tiers
 * Call when: new post created, post updated/deleted, reaction added
 */
export async function invalidateCommunityFeed(schoolId: string) {
  // Clear all pages from local cache (wildcard not supported, clear entire cache)
  const keysToDelete: string[] = []
  for (const key of Array.from(localParentCache.keys())) {
    if (key.startsWith(`community:${schoolId}:`)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => clearFromLocalCache(key))
  console.log(`🗑️ [Local Cache] Cleared ${keysToDelete.length} community feed pages for school: ${schoolId}`)

  // Clear from Redis (scan for all pages)
  try {
    const pattern = `community:${schoolId}:*`
    const keys = await redisParents.keys(pattern)
    if (keys.length > 0) {
      await redisParents.del(...keys)
      console.log(`🗑️ [Parents Redis] Invalidated ${keys.length} feed pages for school: ${schoolId}`)
    }
  } catch (error) {
    console.error('Parents Redis DEL error (feed):', error)
  }
}

// ============================================================================
// LOCAL-ONLY CACHE (No Redis - Frequently Changing Data)
// ============================================================================

/**
 * Student Attendance Cache (LOCAL MEMORY ONLY)
 * 
 * Why local-only?
 * - Changes frequently (daily attendance marking)
 * - Real-time accuracy needed
 * - 15min cache is sufficient
 * - No need for Redis persistence
 */

const ATTENDANCE_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

/**
 * Get cached attendance data (LOCAL ONLY - no Redis)
 * Cache key includes year+month for granular invalidation
 */
export function getCachedAttendance(studentId: string, year: number, month: number) {
  const cacheKey = `attendance:${studentId}:${year}:${month}`
  const cached = getFromLocalCache(cacheKey)

  if (cached) {
    console.log(`⚡ [Local Cache] Attendance HIT: ${studentId} (${year}-${month}) - 0ms`)
    return cached
  }

  console.log(`💾 [Local Cache] Attendance MISS: ${studentId} (${year}-${month})`)
  return null
}

/**
 * Cache attendance data (LOCAL ONLY - 15min TTL)
 */
export function setCachedAttendance(studentId: string, year: number, month: number, data: any) {
  const cacheKey = `attendance:${studentId}:${year}:${month}`
  setToLocalCache(cacheKey, data, ATTENDANCE_CACHE_TTL)
  console.log(`💾 [Local Cache] Stored attendance: ${studentId} (${year}-${month}) - 15min TTL`)
}

/**
 * Invalidate attendance cache for specific month
 * Call when: attendance marked for this student in this month
 */
export function invalidateAttendance(studentId: string, year: number, month: number) {
  const cacheKey = `attendance:${studentId}:${year}:${month}`
  clearFromLocalCache(cacheKey)
  console.log(`🗑️ [Local Cache] Cleared attendance: ${studentId} (${year}-${month})`)
}

/**
 * Invalidate all attendance for a student (all months)
 */
export function invalidateAllAttendance(studentId: string) {
  const keysToDelete: string[] = []
  for (const key of Array.from(localParentCache.keys())) {
    if (key.startsWith(`attendance:${studentId}:`)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => clearFromLocalCache(key))
  console.log(`🗑️ [Local Cache] Cleared ${keysToDelete.length} attendance months for student: ${studentId}`)
}

/**
 * Community Feed Cache (LOCAL MEMORY ONLY)
 * 
 * Why local-only?
 * - Posts/reactions change frequently
 * - Real-time updates expected by parents
 * - 15min cache sufficient for reducing load
 * - No need for Redis persistence across servers
 */

const COMMUNITY_FEED_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

/**
 * Get cached community feed (LOCAL ONLY - no Redis)
 */
export function getCachedCommunityFeedLocal(schoolId: string, page: number, filters?: string) {
  const cacheKey = `community-local:${schoolId}:page:${page}${filters ? `:${filters}` : ''}`
  const cached = getFromLocalCache(cacheKey)

  if (cached) {
    console.log(`⚡ [Local Cache] Community feed HIT: ${schoolId} page ${page} - 0ms`)
    return cached
  }

  console.log(`💾 [Local Cache] Community feed MISS: ${schoolId} page ${page}`)
  return null
}

/**
 * Cache community feed (LOCAL ONLY - 15min TTL)
 */
export function setCachedCommunityFeedLocal(schoolId: string, page: number, data: any, filters?: string) {
  const cacheKey = `community-local:${schoolId}:page:${page}${filters ? `:${filters}` : ''}`
  setToLocalCache(cacheKey, data, COMMUNITY_FEED_CACHE_TTL)
  console.log(`💾 [Local Cache] Stored community feed: ${schoolId} page ${page} - 15min TTL`)
}

/**
 * Invalidate community feed for entire school (all pages)
 * Call when: new post created, post updated/deleted, reaction added
 */
export function invalidateCommunityFeedLocal(schoolId: string) {
  const keysToDelete: string[] = []
  for (const key of Array.from(localParentCache.keys())) {
    if (key.startsWith(`community-local:${schoolId}:`)) {
      keysToDelete.push(key)
    }
  }
  keysToDelete.forEach(key => clearFromLocalCache(key))
  console.log(`🗑️ [Local Cache] Cleared ${keysToDelete.length} community feed pages for school: ${schoolId}`)
}

// ============================================================================
// BULK INVALIDATION (For cascading updates)
// ============================================================================

/**
 * Invalidate all caches for a student (dashboard + analytics)
 * Use when student data changes significantly
 */
export async function invalidateAllStudentCaches(studentId: string) {
  await Promise.all([
    invalidateStudentDashboard(studentId),
    invalidateStudentAnalytics(studentId),
    invalidateStudentWellbeing(studentId),
  ])
  console.log(`🗑️ [Cache] Invalidated ALL caches for student: ${studentId}`)
}

/**
 * Health check for parents Redis instance
 */
export async function checkParentsRedisHealth() {
  try {
    const result = await redisParents.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Parents Redis health check failed:', error)
    return false
  }
}

/**
 * Get cache statistics (for monitoring)
 */
export function getParentCacheStats() {
  return {
    localCacheSize: localParentCache.size,
    localCacheKeys: Array.from(localParentCache.keys()),
  }
}
