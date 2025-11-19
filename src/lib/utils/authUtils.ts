import { supabase } from '@/lib/supabaseClient'

/**
 * Clear invalid authentication session data
 * This helps resolve refresh token issues on page reload
 */
export async function clearInvalidSession() {
  try {
    // Check if we have a session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log('🔄 [AuthUtils] Session error detected:', error.message)
      
      // If it's a refresh token error, clear everything
      if (error.message?.includes('Invalid Refresh Token') || 
          error.message?.includes('Refresh Token Not Found') ||
          error.message?.includes('refresh_token_not_found')) {
        
        console.log(' [AuthUtils] Clearing invalid session data...')
        
        // Sign out to clear all session data
        await supabase.auth.signOut()
        
        // Clear specific Supabase keys
        if (typeof window !== 'undefined') {
          const keysToRemove = [
            'sb-access-token',
            'sb-refresh-token',
            'supabase.auth.token',
            'sb-fsvuhhticbfjftnwzsue-auth-token'
          ]
          
          keysToRemove.forEach(key => {
            window.localStorage.removeItem(key)
            // Also clear cookies
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          })
        }
        
        return true // Indicates session was cleared
      }
    }
    
    return false // No clearing needed
  } catch (error) {
    console.error('🔄 [AuthUtils] Error clearing session:', error)
    return false
  }
}

/**
 * Check if the current session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return false
    }
    
    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.log('🔄 [AuthUtils] Session expired')
      return false
    }
    
    return true
  } catch (error) {
    console.error('🔄 [AuthUtils] Error checking session validity:', error)
    return false
  }
}
