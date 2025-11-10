import { createBrowserClient } from '@supabase/ssr'

// Export for direct Edge Function calls
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
    supabaseUrl.includes('your_supabase_url_here') || supabaseAnonKey.includes('your_supabase_anon_key_here') ||
    supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Using placeholder Supabase configuration for development')
  console.warn('Please update your .env.local file with valid Supabase credentials:')
  console.warn('NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co')
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key')
}

// Use SSR-compatible browser client that properly syncs cookies with server
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  }
)

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
