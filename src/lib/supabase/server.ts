import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export async function createClient() {
  const cookieStore = await cookies()

  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (key: string) => {
          const cookie = cookieStore.get(key)
          return cookie?.value || null
        },
        setItem: (key: string, value: string) => {
          try {
            cookieStore.set(key, value, {
              path: '/',
              maxAge: 604800, // 7 days
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          } catch (error: any) {
            // Handle cookie setting errors in server context
            console.warn('Could not set cookie in server context:', key)
          }
        },
        removeItem: (key: string) => {
          try {
            cookieStore.set(key, '', {
              path: '/',
              expires: new Date(0)
            })
          } catch (error: any) {
            // Handle cookie removal errors in server context
            console.warn('Could not remove cookie in server context:', key)
          }
        }
      }
    },
    global: {
      headers: {
        'Cache-Control': 'no-cache'
      }
    }
  })
}

// Admin client for server-side operations that bypass RLS
export function createAdminClient() {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found, using anon key for development')
    return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
