/**
 * Supabase Connection Pool Manager
 * Reduces database connection overhead by reusing clients
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

class SupabasePool {
  private static instance: SupabasePool
  private client: SupabaseClient | null = null
  private lastUsed: number = 0
  private readonly IDLE_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): SupabasePool {
    if (!SupabasePool.instance) {
      SupabasePool.instance = new SupabasePool()
    }
    return SupabasePool.instance
  }

  getClient(): SupabaseClient {
    const now = Date.now()
    
    // Reset client if idle too long
    if (this.client && now - this.lastUsed > this.IDLE_TIMEOUT) {
      this.client = null
    }

    if (!this.client) {
      this.client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          },
          db: {
            schema: 'public'
          },
          global: {
            headers: {
              'x-connection-pool': 'true'
            }
          }
        }
      )
    }

    this.lastUsed = now
    return this.client
  }

  // Graceful cleanup
  async cleanup() {
    this.client = null
  }
}

export const supabasePool = SupabasePool.getInstance()
export const getPooledClient = () => supabasePool.getClient()
