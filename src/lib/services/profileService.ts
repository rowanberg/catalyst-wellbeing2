/**
 * Centralized Profile Service
 * Eliminates duplicate profile queries across 174+ API files
 * Implements request deduplication and caching
 */

import { cache } from 'react'
import { createSupabaseServerClient } from '@/lib/supabase-server'

// Types
export interface Profile {
  id: string
  user_id: string
  first_name: string
  last_name: string
  email: string
  role: 'student' | 'teacher' | 'admin' | 'parent'
  school_id?: string
  class_id?: string
  grade_level?: number
  profile_picture?: string
  created_at: string
  updated_at: string
}

export interface ProfileWithSchool extends Profile {
  school?: {
    id: string
    name: string
    school_code: string
    logo_url?: string
  }
}

// In-flight request deduplication
const pendingRequests = new Map<string, Promise<any>>()

// Cache TTL - 5 minutes
const CACHE_TTL = 5 * 60 * 1000

// Simple in-memory cache with TTL
class ProfileCache {
  private cache = new Map<string, { data: any; timestamp: number }>()

  set(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() })
  }

  get(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }
}

const profileCache = new ProfileCache()

/**
 * Get profile by user ID with deduplication and caching
 * Server-side only with React cache
 */
export const getCachedProfile = cache(async (userId: string): Promise<Profile | null> => {
  const cacheKey = `profile:${userId}`

  // Check memory cache first
  const cached = profileCache.get(cacheKey)
  if (cached) return cached

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Cache the result
    profileCache.set(cacheKey, data)
    return data
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
})

/**
 * Get profile with school information
 * Optimized single query with JOIN
 */
export const getProfileWithSchool = cache(async (userId: string): Promise<ProfileWithSchool | null> => {
  const cacheKey = `profile-school:${userId}`

  // Check cache
  const cached = profileCache.get(cacheKey)
  if (cached) return cached

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        schools!fk_profiles_school_id (
          id,
          name,
          school_code,
          logo_url
        )
      `)
      .eq('user_id', userId)
      .single()

    if (error) throw error

    // Normalize the response - schools is returned as array, convert to single object
    const normalizedData = {
      ...data,
      school: Array.isArray(data.schools) ? data.schools[0] : data.schools
    }
    delete normalizedData.schools

    // Cache result
    profileCache.set(cacheKey, normalizedData)
    return normalizedData
  } catch (error) {
    console.error('Error fetching profile with school:', error)
    return null
  }
})

/**
 * Deduplicated profile fetch for API routes
 * Prevents multiple simultaneous requests for same profile
 */
export async function getDedupedProfile(userId: string): Promise<Profile | null> {
  const key = `inflight:profile:${userId}`

  // Check if request is already in-flight
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  // Create new request
  const promise = getCachedProfile(userId)
  pendingRequests.set(key, promise)

  try {
    const result = await promise
    return result
  } finally {
    // Clean up after request completes
    setTimeout(() => pendingRequests.delete(key), 100)
  }
}

/**
 * Deduplicated profile with school fetch
 */
export async function getDedupedProfileWithSchool(userId: string): Promise<ProfileWithSchool | null> {
  const key = `inflight:profile-school:${userId}`

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!
  }

  const promise = getProfileWithSchool(userId)
  pendingRequests.set(key, promise)

  try {
    const result = await promise
    return result
  } finally {
    setTimeout(() => pendingRequests.delete(key), 100)
  }
}

/**
 * Batch fetch multiple profiles (optimized)
 */
export async function getProfilesBatch(userIds: string[]): Promise<Map<string, Profile>> {
  const cacheKey = `profiles-batch:${userIds.sort().join(',')}`
  
  // Check cache
  const cached = profileCache.get(cacheKey)
  if (cached) return new Map(cached)

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds)

    if (error) throw error

    const profileMap = new Map<string, Profile>()
    data?.forEach(profile => {
      profileMap.set(profile.user_id, profile)
      // Also cache individual profiles
      profileCache.set(`profile:${profile.user_id}`, profile)
    })

    // Cache the batch result
    profileCache.set(cacheKey, Array.from(profileMap.entries()))
    return profileMap
  } catch (error) {
    console.error('Error fetching profiles batch:', error)
    return new Map()
  }
}

/**
 * Update profile and invalidate cache
 */
export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error

    // Invalidate all caches for this user
    profileCache.delete(`profile:${userId}`)
    profileCache.delete(`profile-school:${userId}`)

    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    return null
  }
}

/**
 * Clear all profile caches (use sparingly)
 */
export function clearProfileCache(userId?: string) {
  if (userId) {
    profileCache.delete(`profile:${userId}`)
    profileCache.delete(`profile-school:${userId}`)
  } else {
    profileCache.clear()
  }
}

/**
 * Get current authenticated user's profile
 * Most common use case
 */
export async function getCurrentUserProfile(): Promise<ProfileWithSchool | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    return getDedupedProfileWithSchool(user.id)
  } catch (error) {
    console.error('Error getting current user profile:', error)
    return null
  }
}
