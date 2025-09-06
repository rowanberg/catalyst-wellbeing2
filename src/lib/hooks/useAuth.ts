import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { setUser, setProfile, fetchProfile } from '@/lib/redux/slices/authSlice'
import { supabase } from '@/lib/supabaseClient'
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
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const [authError, setAuthError] = useState<string | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setAuthError('Failed to verify authentication')
          router.push(redirectTo)
          return
        }

        if (!session) {
          // No session, redirect to login only if not already on login page
          if (window.location.pathname !== '/login') {
            router.push(redirectTo)
          }
          return
        }

        // Session exists, fetch profile if needed
        if (!profile) {
          try {
            const response = await fetch('/api/get-profile', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ userId: session.user.id }),
            })

            if (response.ok) {
              const profileData = await response.json()
              
              // Set user data from profile
              const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                role: profileData.role || 'student',
                school_id: profileData.school_id,
                created_at: session.user.created_at || '',
                updated_at: session.user.updated_at || ''
              }

              dispatch(setUser(userData))
              dispatch(setProfile(profileData))

              // Check role requirements
              if (requiredRole && profileData.role !== requiredRole) {
                router.push(`/${profileData.role}`)
                return
              }
            } else {
              // If profile fetch fails, create a mock profile for development
              console.warn('Profile fetch failed, using mock profile for development')
              const mockProfileData = {
                id: session.user.id,
                user_id: session.user.id,
                first_name: 'Admin',
                last_name: 'User',
                role: 'admin' as const,
                school_id: '1',
                grade_level: null,
                class_name: null,
                xp: 0,
                gems: 0,
                level: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
              
              const userData: User = {
                id: session.user.id,
                email: session.user.email || '',
                role: 'admin',
                school_id: '1',
                created_at: session.user.created_at || '',
                updated_at: session.user.updated_at || ''
              }

              dispatch(setUser(userData))
              dispatch(setProfile(mockProfileData))
            }
          } catch (error) {
            console.error('Profile fetch error:', error)
            // Use mock profile as fallback
            const mockProfileData = {
              id: session.user.id,
              user_id: session.user.id,
              first_name: 'Admin',
              last_name: 'User',
              role: 'admin' as const,
              school_id: '1',
              grade_level: null,
              class_name: null,
              xp: 0,
              gems: 0,
              level: 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            
            const userData: User = {
              id: session.user.id,
              email: session.user.email || '',
              role: 'admin',
              school_id: '1',
              created_at: session.user.created_at || '',
              updated_at: session.user.updated_at || ''
            }

            dispatch(setUser(userData))
            dispatch(setProfile(mockProfileData))
          }
        } else {
          // Profile exists, check role requirements
          if (requiredRole && profile.role !== requiredRole) {
            router.push(`/${profile.role}`)
            return
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthError('Authentication failed')
        router.push(redirectTo)
      } finally {
        setInitializing(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          dispatch(setUser(null))
          dispatch(setProfile(null))
          router.push(redirectTo)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [dispatch, router, redirectTo, requiredRole, profile])

  return {
    user,
    profile,
    isLoading: isLoading || initializing,
    isAuthenticated: !!user && (!requireProfile || !!profile),
    error: authError
  }
}
