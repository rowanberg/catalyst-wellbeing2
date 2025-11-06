import { invalidateGrades, invalidateMultipleSchoolGrades } from './redis'

/**
 * Cache Invalidation Helper Functions
 * 
 * These functions should be called when data is modified to ensure cache consistency.
 * Always call these in your POST/PUT/PATCH/DELETE endpoints.
 */

/**
 * Invalidate grade levels cache for a single school
 * 
 * Call this when:
 * - A new grade level is created
 * - A grade level is updated
 * - A grade level is activated/deactivated
 * - A grade level is deleted
 * 
 * @param schoolId - The school ID whose grade cache should be invalidated
 */
export async function invalidateSchoolGrades(schoolId: string) {
  try {
    await invalidateGrades(schoolId)
    console.log(`✅ [Cache Invalidation] Cleared grades cache for school: ${schoolId}`)
    return true
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed to clear grades cache for school: ${schoolId}`, error)
    return false
  }
}

/**
 * Invalidate grade levels cache for multiple schools
 * 
 * Call this when:
 * - Bulk operations affect multiple schools
 * - System-wide grade structure changes
 * 
 * @param schoolIds - Array of school IDs
 */
export async function invalidateMultipleSchools(schoolIds: string[]) {
  try {
    await invalidateMultipleSchoolGrades(schoolIds)
    console.log(`✅ [Cache Invalidation] Cleared grades cache for ${schoolIds.length} schools`)
    return true
  } catch (error) {
    console.error(`❌ [Cache Invalidation] Failed to clear grades cache for multiple schools`, error)
    return false
  }
}

/**
 * Helper to invalidate after database operations
 * Use this as a wrapper for your database mutations
 * 
 * @example
 * await invalidateAfterMutation(
 *   () => supabase.from('grade_levels').insert(newGrade),
 *   schoolId
 * )
 */
export async function invalidateAfterMutation<T>(
  operation: () => Promise<T>,
  schoolId: string
): Promise<T> {
  const result = await operation()
  // Invalidate cache in background (don't block response)
  invalidateSchoolGrades(schoolId).catch(console.error)
  return result
}
