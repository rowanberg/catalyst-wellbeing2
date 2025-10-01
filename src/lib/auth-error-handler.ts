/**
 * Authentication Error Handler
 * Handles refresh token errors and provides graceful fallbacks
 */

import { supabase } from './supabaseClient'
import { toast } from 'sonner'

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * Check if error is a refresh token error
 */
export const isRefreshTokenError = (error: any): boolean => {
  if (!error) return false
  
  const errorMessage = error.message?.toLowerCase() || ''
  const errorCode = error.code?.toLowerCase() || ''
  
  return (
    errorMessage.includes('refresh token') ||
    errorMessage.includes('invalid refresh token') ||
    errorMessage.includes('refresh token not found') ||
    errorCode === 'invalid_grant' ||
    errorCode === 'refresh_token_not_found'
  )
}

/**
 * Handle refresh token errors
 */
export const handleRefreshTokenError = async (): Promise<void> => {
  console.error('🔴 Refresh token error detected')
  
  try {
    // Clear local storage
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
      
      // Clear all cookies
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    }
    
    // Sign out from Supabase
    await supabase.auth.signOut()
    
    // Show user-friendly message
    toast.error('Session expired. Please sign in again.', {
      duration: 5000,
      action: {
        label: 'Sign In',
        onClick: () => {
          window.location.href = '/login'
        }
      }
    })
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login'
    }, 2000)
    
  } catch (error) {
    console.error('Error during auth cleanup:', error)
    // Force redirect even if cleanup fails
    window.location.href = '/login'
  }
}

/**
 * Retry function with refresh token error handling
 */
export const retryWithAuthCheck = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 1
): Promise<T> => {
  let lastError: any
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error
      
      // If it's a refresh token error, don't retry
      if (isRefreshTokenError(error)) {
        await handleRefreshTokenError()
        throw new AuthError('Session expired', error.code)
      }
      
      // If it's the last retry, throw the error
      if (i === maxRetries) {
        throw error
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
    }
  }
  
  throw lastError
}

/**
 * Wrap API calls with auth error handling
 */
export const withAuthErrorHandling = <T extends (...args: any[]) => Promise<any>>(
  fn: T
): T => {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error: any) {
      if (isRefreshTokenError(error)) {
        await handleRefreshTokenError()
        throw new AuthError('Session expired', error.code)
      }
      throw error
    }
  }) as T
}

/**
 * Check session validity
 */
export const checkSessionValidity = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      if (isRefreshTokenError(error)) {
        await handleRefreshTokenError()
        return false
      }
      throw error
    }
    
    return !!session
  } catch (error) {
    console.error('Error checking session validity:', error)
    return false
  }
}

/**
 * Refresh session manually
 */
export const refreshSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    
    if (error) {
      if (isRefreshTokenError(error)) {
        await handleRefreshTokenError()
        return false
      }
      throw error
    }
    
    return !!session
  } catch (error) {
    console.error('Error refreshing session:', error)
    return false
  }
}

/**
 * Initialize auth error monitoring
 */
export const initAuthErrorMonitoring = (): void => {
  if (typeof window === 'undefined') return
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 Auth state changed:', event)
    
    if (event === 'SIGNED_OUT') {
      console.log('User signed out, clearing data...')
      window.localStorage.clear()
    }
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('✅ Token refreshed successfully')
    }
    
    if (event === 'USER_UPDATED') {
      console.log('👤 User data updated')
    }
  })
  
  // Monitor for auth errors globally
  window.addEventListener('unhandledrejection', (event) => {
    if (isRefreshTokenError(event.reason)) {
      event.preventDefault()
      handleRefreshTokenError()
    }
  })
}

export default {
  isRefreshTokenError,
  handleRefreshTokenError,
  retryWithAuthCheck,
  withAuthErrorHandling,
  checkSessionValidity,
  refreshSession,
  initAuthErrorMonitoring,
}
