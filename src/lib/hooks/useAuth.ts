import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setUser, setProfile, fetchProfile } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
import { clearInvalidSession } from '@/lib/utils/authUtils'
import { User, Profile } from '@/types'

interface UseAuthOptions {
  requiredRole?: 'student' | 'parent' | 'teacher' | 'admin'
  redirectTo?: string
  requireProfile?: boolean
}

interface AuthState {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

export function useAuth(options: UseAuthOptions = {}): AuthState {
  const {
    requiredRole,
    redirectTo = '/login',
    requireProfile = true
  } = options

  const router = useRouter()
  const dispatch = useAppDispatch()
  const [authError, setAuthError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  // Get Redux state
  const reduxAuth = useAppSelector((state) => state.auth)
  const currentUser = reduxAuth.user
  const currentProfile = reduxAuth.profile
  const currentIsLoading = reduxAuth.isLoading

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 [useAuth] Initializing authentication...')
        console.log('🔄 [useAuth] Current Redux state - user:', !!currentUser, 'profile:', !!currentProfile, 'isLoading:', currentIsLoading)
        
        // If Redux already has user and profile, don't interfere
        if (currentUser && currentProfile && !currentIsLoading) {
          console.log('✅ [useAuth] Redux state already authenticated, skipping initialization')
          setInitializing(false)
          return
        }
        
        // If Redux is still loading, wait for it
        if (currentIsLoading) {
          console.log('🔄 [useAuth] Redux is loading, waiting...')
          setInitializing(false)
          return
        }
        
        // First, clear any invalid session data
        const wasCleared = await clearInvalidSession()
        if (wasCleared) {
          console.log('🔄 [useAuth] Invalid session cleared, redirecting to login...')
          setAuthError('Session expired')
          setInitializing(false)
          router.push(redirectTo)
          return
        }
        
        // Check if we have a valid session locally
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.log('🔄 [useAuth] Local session error:', sessionError.message)
          if (sessionError.message?.includes('Invalid Refresh Token') || sessionError.message?.includes('Refresh Token Not Found')) {
            console.log('🔄 [useAuth] Invalid refresh token, signing out...')
            await supabase.auth.signOut()
            router.push(redirectTo)
            return
          }
        }

        // Check current session via API
        const response = await fetch('/api/auth/session', {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        })
        const sessionData = await response.json()
        
        if (!response.ok) {
          console.log(`🔄 [useAuth] Session API returned ${response.status}:`, sessionData?.error)
          
          // Handle refresh token errors specifically
          if (sessionData?.code === 'REFRESH_TOKEN_INVALID' || 
              sessionData?.error?.includes('Invalid refresh token')) {
            console.log('🔄 [useAuth] Invalid refresh token from API, signing out...')
            await supabase.auth.signOut()
            router.push(redirectTo)
            return
          }
          
          // Only log unexpected errors (not 401 unauthorized)
          if (response.status !== 401) {
            console.error('Session API error:', response.status, response.statusText)
            if (sessionData?.error) {
              console.error('Session error details:', sessionData.error)
            }
          }
          
          // If we have a local session but API fails, try to refresh
          if (session && response.status === 401) {
            console.log('🔄 [useAuth] Local session exists but API auth failed, attempting refresh...')
            const { error: refreshError } = await supabase.auth.refreshSession()
            if (refreshError) {
              console.log('🔄 [useAuth] Refresh failed, redirecting to login:', refreshError.message)
              await supabase.auth.signOut()
              router.push(redirectTo)
              return
            }
            // Retry after refresh
            return initializeAuth()
          }
          
          setAuthError('Authentication required')
          setInitializing(false)
          router.push(redirectTo)
          return
        }
        
        if (sessionData.error) {
          console.error('Session error:', sessionData.error)
          setAuthError('Authentication required')
          setInitializing(false)
          return
        }
        
        const user = sessionData.user

        if (!user) {
          setAuthError('Please log in to continue')
          setInitializing(false)
          return
        }

        // User exists, fetch profile if needed
        if (!currentProfile && !currentIsLoading) {
          try {
            const response = await fetch('/api/get-profile', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ userId: user.id }),
            })

            if (response.ok) {
              const profileData = await response.json()
              
              // Set user data from profile
              const userData: User = {
                id: user.id,
                email: user.email || '',
                role: profileData.role || 'student',
                school_id: profileData.school_id,
                created_at: user.created_at || '',
                updated_at: user.updated_at || ''
              }

              dispatch(setUser(userData))
              dispatch(setProfile(profileData))

              // Check role requirements
              if (requiredRole && profileData.role !== requiredRole) {
                router.push(`/${profileData.role}`)
                return
              }

              
              setInitializing(false)
            } else {
              // Check if this is a Google OAuth user without a profile
              const errorData = await response.json().catch(() => ({}))
              
              if (response.status === 404 && errorData.code === 'PROFILE_NOT_FOUND') {
                // Check if user has Google provider
                if (user.app_metadata?.provider === 'google') {
                  console.log('🔄 Google OAuth user without profile detected in useAuth, redirecting to registration...')
                  
                  // Store Google OAuth data for registration
                  const googleUserData = {
                    email: user.email,
                    firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
                    lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                    avatarUrl: user.user_metadata?.avatar_url || null,
                    userId: user.id,
                    provider: 'google'
                  }
                  
                  sessionStorage.setItem('google_oauth_data', JSON.stringify(googleUserData))
                  router.push('/register')
                  return
                }
              }
              
              // For development/testing only - create mock profile
              if (process.env.NODE_ENV === 'development') {
                console.warn('Profile fetch failed, using mock profile for development')
                const mockRole = requiredRole || 'admin'
                const mockProfileData = {
                  id: user.id,
                  user_id: user.id,
                  first_name: mockRole === 'teacher' ? 'Teacher' : mockRole === 'student' ? 'Student' : 'Admin',
                  last_name: 'User',
                  role: mockRole,
                  school_id: '6123d635-43a0-4c21-8c0e-66b9f231ee5e', // Use real school ID from logs
                  grade_level: null,
                  class_name: null,
                  xp: 0,
                  gems: 0,
                  level: 1,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
                
                const userData: User = {
                  id: user.id,
                  email: user.email || '',
                  role: mockRole,
                  school_id: '6123d635-43a0-4c21-8c0e-66b9f231ee5e',
                  created_at: user.created_at || '',
                  updated_at: user.updated_at || ''
                }

                dispatch(setUser(userData))
                dispatch(setProfile(mockProfileData))
                setInitializing(false)
              } else {
                // In production, redirect to login for profile errors
                router.push('/login')
              }
            }
          } catch (error) {
            console.error('Profile fetch error:', error)
            // Use mock profile as fallback
            const mockRole = requiredRole || 'admin'
            const mockProfileData = {
              id: user.id,
              user_id: user.id,
              first_name: mockRole === 'teacher' ? 'Teacher' : mockRole === 'student' ? 'Student' : 'Admin',
              last_name: 'User',
              role: mockRole,
              school_id: '6123d635-43a0-4c21-8c0e-66b9f231ee5e',
              grade_level: null,
              class_name: null,
              xp: 0,
              gems: 0,
              level: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            const userData: User = {
              id: user.id,
              email: user.email || '',
              role: mockRole,
              school_id: '6123d635-43a0-4c21-8c0e-66b9f231ee5e',
              created_at: user.created_at || '',
              updated_at: user.updated_at || ''
            }

            dispatch(setUser(userData))
            dispatch(setProfile(mockProfileData))
            setInitializing(false)
          }
        } else {
          // Profile exists, check role requirements
          if (requiredRole && currentProfile?.role !== requiredRole) {
            router.push(`/${currentProfile?.role || 'login'}`)
            return
          }
          setInitializing(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthError('Failed to initialize authentication')
        setInitializing(false)
      }
    }

    initializeAuth()
  }, [dispatch, router, redirectTo, currentUser, currentProfile, currentIsLoading])

  return {
    user: currentUser,
    profile: currentProfile,
    isLoading: currentIsLoading || initializing,
    isAuthenticated: !!currentUser && (!requireProfile || !!currentProfile),
    error: authError
  }
}
