/**
 * ============================================================================
 * Cache Invalidation Utilities
 * ============================================================================
 * Centralized cache invalidation for data consistency
 * ============================================================================
 */

import { redis, cacheKeys, invalidateTag } from './redis-client'

/**
 * Invalidate student cache when data changes
 */
export async function invalidateStudentCache(studentId: string): Promise<void> {
  await Promise.all([
    redis.delete(cacheKeys.studentGrowth(studentId)),
    redis.delete(cacheKeys.studentToday(studentId)),
    redis.delete(`student:${studentId}:dashboard:unified`),
    invalidateTag('student')
  ])
}

/**
 * Invalidate school-wide cache when announcements/polls change
 */
export async function invalidateSchoolCache(schoolId: string): Promise<void> {
  await Promise.all([
    redis.delete(cacheKeys.schoolAnnouncements(schoolId)),
    redis.delete(cacheKeys.schoolPolls(schoolId)),
    invalidateTag(`school:${schoolId}`)
  ])
}

/**
 * Invalidate cache when test results are added/updated
 */
export async function invalidateTestResultsCache(studentId: string): Promise<void> {
  await invalidateStudentCache(studentId)
}

/**
 * Invalidate cache when quests are completed
 */
export async function invalidateQuestCache(studentId: string): Promise<void> {
  await redis.delete(cacheKeys.studentToday(studentId))
  await redis.delete(`student:${studentId}:dashboard:unified`)
}

/**
 * Invalidate cache when assessments are created/updated
 */
export async function invalidateAssessmentCache(schoolId: string): Promise<void> {
  // This affects all students in the school
  await redis.deletePattern(`student:*:today`)
  await redis.deletePattern(`student:*:dashboard:unified`)
  await invalidateSchoolCache(schoolId)
}

/**
 * Clear all student caches (use sparingly)
 */
export async function clearAllStudentCaches(): Promise<void> {
  await redis.deletePattern('student:*')
}

/**
 * Scheduled cache cleanup (call from cron job)
 */
export async function scheduledCacheCleanup(): Promise<void> {
  // Redis automatically handles TTL, but we can force cleanup if needed
  console.log('🧹 Scheduled cache cleanup completed')
}
