/**
 * Client-side hook for teacher authentication
 * Manages local token storage and automatic refresh
 */

import { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '@/lib/redux/store'

interface TeacherAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  token: string | null
  teacherId: string | null
  schoolId: string | null
  error: string | null
}

const TOKEN_KEY = 'teacher_auth_token'
const TOKEN_EXPIRY_KEY = 'teacher_auth_expiry'

export function useTeacherAuth() {
  const [authState, setAuthState] = useState<TeacherAuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    teacherId: null,
    schoolId: null,
    error: null
  })

  const profile = useSelector((state: RootState) => state.auth.profile)
  
  // Load token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY)
    
    if (storedToken && storedExpiry) {
      const expiry = parseInt(storedExpiry, 10)
      if (Date.now() < expiry) {
        // Token is still valid
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]))
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            token: storedToken,
            teacherId: payload.teacherId,
            schoolId: payload.schoolId,
            error: null
          })
        } catch (error) {
          // Invalid token format
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(TOKEN_EXPIRY_KEY)
        }
      } else {
        // Token expired, clear it
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(TOKEN_EXPIRY_KEY)
      }
    }
    
    setAuthState(prev => ({ ...prev, isLoading: false }))
  }, [])
  
  // Attach token to API calls
  const authenticatedFetch = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = new Headers(options.headers)
    
    if (authState.token) {
      headers.set('x-teacher-token', authState.token)
    }
    
    const response = await fetch(url, {
      ...options,
      headers
    })
    
    // Check if we got a new token in response
    const newToken = response.headers.get('x-teacher-token')
    if (newToken && newToken !== authState.token) {
      // Update stored token
      localStorage.setItem(TOKEN_KEY, newToken)
      localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 15 * 60 * 1000))
      
      try {
        const payload = JSON.parse(atob(newToken.split('.')[1]))
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          token: newToken,
          teacherId: payload.teacherId,
          schoolId: payload.schoolId,
          error: null
        })
      } catch (error) {
        console.error('Failed to parse new token:', error)
      }
    }
    
    // Handle 401/403 responses
    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(TOKEN_EXPIRY_KEY)
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        teacherId: null,
        schoolId: null,
        error: 'Authentication required'
      })
    }
    
    return response
  }, [authState.token])
  
  // Force refresh token
  const refreshAuth = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))
    
    try {
      // Call any teacher endpoint to get fresh token
      const response = await fetch('/api/teacher/profile')
      
      if (response.ok) {
        const newToken = response.headers.get('x-teacher-token')
        if (newToken) {
          localStorage.setItem(TOKEN_KEY, newToken)
          localStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 15 * 60 * 1000))
          
          const payload = JSON.parse(atob(newToken.split('.')[1]))
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            token: newToken,
            teacherId: payload.teacherId,
            schoolId: payload.schoolId,
            error: null
          })
        }
      } else {
        throw new Error('Failed to refresh authentication')
      }
    } catch (error) {
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        teacherId: null,
        schoolId: null,
        error: error instanceof Error ? error.message : 'Authentication failed'
      })
    }
  }, [])
  
  // Clear authentication
  const clearAuth = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_EXPIRY_KEY)
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      teacherId: null,
      schoolId: null,
      error: null
    })
  }, [])
  
  // Auto-refresh token before expiry
  useEffect(() => {
    if (!authState.token) return undefined
    
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY)
    if (!expiryStr) return undefined
    
    const expiry = parseInt(expiryStr, 10)
    const timeUntilExpiry = expiry - Date.now()
    
    // Refresh 1 minute before expiry
    const refreshTime = timeUntilExpiry - 60000
    
    if (refreshTime > 0) {
      const timeout = setTimeout(refreshAuth, refreshTime)
      return () => clearTimeout(timeout)
    }
    
    return undefined
  }, [authState.token, refreshAuth])
  
  return {
    ...authState,
    authenticatedFetch,
    refreshAuth,
    clearAuth,
    isTeacher: profile?.role === 'teacher'
  }
}

/**
 * HOC to protect teacher pages
 */
export function withTeacherAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, isLoading, isTeacher, error } = useTeacherAuth()
    const profile = useSelector((state: RootState) => state.auth.profile)
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )
    }
    
    if (!isAuthenticated || !isTeacher) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
            <p className="text-gray-600">{error || 'Teacher authentication required'}</p>
          </div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}
