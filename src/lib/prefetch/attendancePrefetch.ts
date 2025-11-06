/**
 * Attendance Data Prefetch Utility
 * Fetches and caches attendance data in the background
 */

import { attendanceCache } from '@/lib/cache/attendanceCache'

interface PrefetchOptions {
  userId: string
  schoolId?: string
}

/**
 * Prefetch attendance data in the background
 * This should be called after the teacher dashboard loads
 */
export async function prefetchAttendanceData({ userId, schoolId }: PrefetchOptions): Promise<void> {
  try {
    console.log('🚀 [Prefetch] Starting attendance data prefetch...')
    const startTime = performance.now()

    // Fetch critical attendance data in parallel
    const promises = [
      // 1. Fetch assigned classes
      fetch(`/api/teacher/class-assignments?teacher_id=${userId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            attendanceCache.set(`class-assignments:${userId}`, data, 5 * 60 * 1000)
            console.log('✅ [Prefetch] Cached class assignments')
          }
        })
        .catch(err => console.warn('⚠️ [Prefetch] Failed to fetch class assignments:', err)),

      // 2. Fetch grades if schoolId available
      schoolId ? fetch(`/api/teacher/grades?school_id=${schoolId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            attendanceCache.set(`grades:${schoolId}`, data, 10 * 60 * 1000)
            console.log('✅ [Prefetch] Cached grades')
          }
        })
        .catch(err => console.warn('⚠️ [Prefetch] Failed to fetch grades:', err)) : Promise.resolve()
    ]

    await Promise.allSettled(promises)

    const duration = Math.round(performance.now() - startTime)
    console.log(`✅ [Prefetch] Attendance data prefetch completed in ${duration}ms`)
  } catch (error) {
    console.warn('⚠️ [Prefetch] Attendance prefetch failed:', error)
  }
}

/**
 * Get cached attendance data
 */
export function getCachedAttendanceData<T>(key: string): T | null {
  return attendanceCache.get<T>(key)
}

/**
 * Check if attendance data is cached
 */
export function hasAttendanceCache(key: string): boolean {
  return attendanceCache.has(key)
}

/**
 * Invalidate attendance cache
 */
export function invalidateAttendanceCache(pattern?: string): void {
  if (pattern) {
    attendanceCache.invalidatePattern(new RegExp(pattern))
  } else {
    attendanceCache.clear()
  }
}
