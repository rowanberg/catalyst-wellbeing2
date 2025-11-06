import { invalidateSchoolInfo, invalidateSchoolSettings, invalidateAllSchoolCaches } from './redis-school'

/**
 * School Cache Invalidation Helper Functions
 * 
 * These functions should be called when ADMIN updates school data
 * to ensure teachers see fresh information.
 * 
 * NOTE: These are ONLY for teacher-facing school data.
 * Students don't have dedicated school info endpoints.
 */

/**
 * Invalidate school information cache
 * 
 * Call this when ADMIN updates:
 * - School name, address, contact details
 * - Principal name
 * - Mission/vision statements
 * - School hours, office hours
 * - Emergency contacts
 * - Facilities information
 * 
 * @param schoolId - The school ID whose cache should be invalidated
 */
export async function invalidateSchoolInfoCache(schoolId: string) {
  try {
    await invalidateSchoolInfo(schoolId)
    console.log(`✅ [Cache Invalidation] Cleared school info cache for: ${schoolId}`)
    return true
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed to clear school info cache for: ${schoolId}`, error)
    return false
  }
}

/**
 * Invalidate school settings cache
 * 
 * Call this when ADMIN updates:
 * - School settings/preferences
 * - Configuration options
 * 
 * @param schoolId - The school ID
 */
export async function invalidateSchoolSettingsCache(schoolId: string) {
  try {
    await invalidateSchoolSettings(schoolId)
    console.log(`✅ [Cache Invalidation] Cleared school settings cache for: ${schoolId}`)
    return true
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed to clear school settings cache for: ${schoolId}`, error)
    return false
  }
}

/**
 * Invalidate ALL school caches
 * 
 * Call this when making major changes:
 * - School setup completion
 * - Bulk school updates
 * - Data migrations
 * 
 * @param schoolId - The school ID
 */
export async function invalidateAllSchoolData(schoolId: string) {
  try {
    await invalidateAllSchoolCaches(schoolId)
    console.log(`✅ [Cache Invalidation] Cleared ALL school caches for: ${schoolId}`)
    return true
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed to clear all school caches for: ${schoolId}`, error)
    return false
  }
}

/**
 * Helper to invalidate after database operations
 * Use this as a wrapper for your database mutations
 * 
 * @example
 * await invalidateAfterSchoolMutation(
 *   () => supabase.from('schools').update(updates).eq('id', schoolId),
 *   schoolId
 * )
 */
export async function invalidateAfterSchoolMutation<T>(
  operation: () => Promise<T>,
  schoolId: string
): Promise<T> {
  const result = await operation()
  // Invalidate cache in background (don't block response)
  invalidateSchoolInfoCache(schoolId).catch(console.error)
  return result
}

/**
 * Batch invalidation for multiple schools
 * Use when bulk operations affect multiple schools
 * 
 * @param schoolIds - Array of school IDs
 */
export async function invalidateMultipleSchools(schoolIds: string[]) {
  try {
    const promises = schoolIds.map(id => invalidateAllSchoolCaches(id))
    await Promise.all(promises)
    console.log(`✅ [Cache Invalidation] Cleared caches for ${schoolIds.length} schools`)
    return true
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed to clear caches for multiple schools`, error)
    return false
  }
}
