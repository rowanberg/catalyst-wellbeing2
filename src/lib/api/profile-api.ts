/**
 * Profile API with IndexedDB caching
 * Reduces /api/get-profile calls from 200+ to 1-2 per session
 */

import { ProfileCache } from '@/lib/db/indexeddb';

/**
 * Fetch profile with IndexedDB caching
 * Checks IndexedDB first, then falls back to API
 * 
 * @param userId - User ID to fetch profile for
 * @returns Profile data
 */
export async function fetchProfileWithCache(userId: string): Promise<any> {
  try {
    // Step 1: Check IndexedDB cache first
    const cached = await ProfileCache.get(userId);
    if (cached) {
      return cached; // Cache HIT - no API call needed!
    }

    // Step 2: Cache MISS - fetch from API
    console.log('[ProfileAPI] Fetching from server for user:', userId);

    const response = await fetch('/api/get-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const profile = await response.json();

    // Step 3: Store in IndexedDB for next time
    await ProfileCache.set(userId, profile);

    return profile;
  } catch (error) {
    // Don't log "profile not found" as an error - it's expected for new Google OAuth users
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (!errorMessage.includes('Profile not found') && !errorMessage.includes('not be fully set up')) {
      console.error('[ProfileAPI] Error fetching profile:', error)
    }
    throw error
  }
}

/**
 * Invalidate profile cache (call after profile update)
 * 
 * @param userId - User ID to invalidate
 */
export async function invalidateProfileCache(userId: string): Promise<void> {
  await ProfileCache.invalidate(userId);
}

/**
 * Clear all profile caches (call on logout)
 */
export async function clearAllProfileCaches(): Promise<void> {
  await ProfileCache.clear();
}
