/**
 * Supabase Admin Client Singleton
 * Prevents connection pool exhaustion by reusing a single client instance
 * 
 * Usage:
 * import { getSupabaseAdmin } from '@/lib/supabase/admin-client'
 * const supabase = getSupabaseAdmin()
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

let supabaseAdminInstance: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  // Return existing instance if available
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    const errorMsg = 'Missing Supabase credentials. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    logger.error(errorMsg)
    throw new Error(errorMsg)
  }

  try {
    supabaseAdminInstance = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-app-name': 'catalyst',
          'x-app-version': process.env.npm_package_version || '1.0.0',
        },
      },
    })

    return supabaseAdminInstance
  } catch (error) {
    logger.error('Failed to initialize Supabase admin client', error)
    throw error
  }
}

/**
 * Reset singleton instance (primarily for testing)
 */
export function resetSupabaseAdmin(): void {
  supabaseAdminInstance = null
}
