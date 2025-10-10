import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    supabaseUrl.includes('your_supabase_url_here') || supabaseAnonKey.includes('your_supabase_anon_key_here') ||
    supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Using placeholder Supabase configuration for development')
  console.warn('Please update your .env.local file with valid Supabase credentials:')
  console.warn('NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: {
      getItem: (key: string) => {
        if (typeof window !== 'undefined') {
          return window.localStorage.getItem(key)
        }
        return null
      },
      setItem: (key: string, value: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, value)
          // Set secure cookie with proper flags
          const isProduction = process.env.NODE_ENV === 'production'
          const cookieOptions = [
            `${key}=${value}`,
            'path=/',
            'max-age=604800',
            'SameSite=Strict',
            isProduction ? 'Secure' : '',
            'HttpOnly'
          ].filter(Boolean).join('; ')
          
          // Note: HttpOnly can't be set from JavaScript, needs server-side setting
          document.cookie = `${key}=${value}; path=/; max-age=604800; SameSite=Strict${isProduction ? '; Secure' : ''}`
        }
      },
      removeItem: (key: string) => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(key)
          // Also remove cookie
          document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        }
      }
    }
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  }
})

// Handle auth state changes and refresh token errors
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange(async (event, session) => {
    // Use debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [AuthStateChange] Event: ${event}`, session ? 'Session active' : 'No session')
    }
    
    if (event === 'TOKEN_REFRESHED') {
      // Token refresh handled silently
    } else if (event === 'SIGNED_OUT') {
      // Clear all auth-related data
      window.localStorage.clear()
      // Clear Redux store
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login'
      }
    } else if (event === 'USER_UPDATED') {
      // User update handled silently
    } else if (event === 'SIGNED_IN') {
      // Sign in handled silently
    }
  })

  // Handle refresh token errors specifically
  supabase.auth.getSession().catch((error) => {
    if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
      console.log('🔄 [RefreshToken] Invalid or expired refresh token, signing out...')
      supabase.auth.signOut()
    }
  })
}
