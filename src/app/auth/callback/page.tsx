'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setUser, setProfile } from '@/lib/redux/slices/authSlice'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { GraduationCap } from 'lucide-react'

export default function AuthCallback() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [hasBeenCalled, setHasBeenCalled] = useState(false)
  const [hasProcessed, setHasProcessed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const welcomeShownKey = 'catalyst_welcome_shown'

  useEffect(() => {
    // Clear welcome flag when component mounts (new session)
    return () => {
      // Cleanup on unmount
      sessionStorage.removeItem(welcomeShownKey)
    }
  }, [])

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Prevent multiple executions with multiple checks
      if (hasProcessed) {
        console.log('⏭️ Auth callback already processed, skipping...')
        return
      }

      // Check if we've already shown welcome message in this session
      const welcomeAlreadyShown = sessionStorage.getItem(welcomeShownKey)
      if (welcomeAlreadyShown) {
        console.log('⏭️ Welcome message already shown in this session, redirecting directly...')
        // Just redirect without showing message again
        const savedDashboardPath = sessionStorage.getItem('catalyst_dashboard_path') || '/student'
        router.push(savedDashboardPath)
        return
      }
      
      setHasProcessed(true)
      
      // Mark that we're processing to prevent any other instances
      sessionStorage.setItem('catalyst_auth_processing', 'true')
      
      try {
        console.log('🔄 Processing auth callback...')
        
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ Auth callback error:', error)
          throw error
        }

        if (data.session) {
          console.log('✅ Session found:', data.session.user.email)
          
          // Set user in Redux store
          dispatch(setUser(data.session.user as any))
          
          // Fetch or create user profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('❌ Profile fetch error:', profileError)
            throw profileError
          }

          let userProfile = profile
          
          // If no profile exists, redirect to registration with Google data
          if (!profile) {
            console.log('👤 No profile found for Google user, redirecting to registration...')
            
            // Store Google OAuth data in sessionStorage for registration page
            const googleUserData = {
              email: data.session.user.email,
              firstName: data.session.user.user_metadata?.full_name?.split(' ')[0] || '',
              lastName: data.session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
              avatarUrl: data.session.user.user_metadata?.avatar_url || null,
              userId: data.session.user.id,
              provider: 'google'
            }
            
            sessionStorage.setItem('google_oauth_data', JSON.stringify(googleUserData))
            
            // Clear processing flags
            sessionStorage.removeItem('catalyst_auth_processing')
            
            // Show informative message
            console.log('👋 Welcome to Catalyst! Please complete your registration to continue.')
            
            // Redirect to registration page
            router.push('/register')
            return
          }

          // Set profile in Redux store
          if (userProfile) {
            dispatch(setProfile(userProfile))
          }

          // Determine dashboard path based on role
          const userRole = userProfile?.role || 'student'
          let dashboardPath = '/student' // default
          
          switch (userRole) {
            case 'admin':
              dashboardPath = '/admin'
              break
            case 'teacher':
              dashboardPath = '/teacher'
              break
            case 'parent':
              dashboardPath = '/parent'
              break
            case 'student':
              dashboardPath = '/student'
              break
            default:
              dashboardPath = '/student'
          }

          console.log('🚀 Redirecting to:', dashboardPath)

          // Save dashboard path for potential future redirects
          sessionStorage.setItem('catalyst_dashboard_path', dashboardPath)

          // Show enhanced welcome message only once
          console.log(`🎉 Welcome to Catalyst! You're now signed in as ${userRole}. Taking you to your dashboard...`)

          // Mark that welcome message has been shown
          sessionStorage.setItem(welcomeShownKey, 'true')
          
          // Clear the processing flag
          sessionStorage.removeItem('catalyst_auth_processing')

          // Redirect to appropriate dashboard
          setTimeout(() => {
            router.push(dashboardPath)
          }, 1500)

        } else {
          throw new Error('No session found after authentication')
        }

      } catch (error: any) {
        console.error('Auth callback error:', error)
        setError(error.message || 'Authentication failed')
        
        console.error('❌ Authentication Failed:', error.message || 'Failed to complete sign-in. Please try again.')

        // Clear any processing flags on error
        sessionStorage.removeItem('catalyst_auth_processing')
        sessionStorage.removeItem(welcomeShownKey)

        // Redirect back to login after error
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, []) // Empty dependency array to run only once

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      {/* Clean, minimal background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50"></div>
      
      {/* Subtle geometric elements */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-200 rounded-full opacity-40"></div>
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-indigo-200 rounded-full opacity-30"></div>
      <div className="absolute bottom-1/4 right-1/4 w-1.5 h-1.5 bg-blue-300 rounded-full opacity-35"></div>

      {/* Main Content */}
      <div className="relative z-10 max-w-sm w-full mx-4">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 text-center">
          
          {isLoading ? (
            <div className="space-y-6">
              {/* Google + Catalyst Connection Visual */}
              <div className="flex items-center justify-center space-x-4 mb-6">
                {/* Google Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                
                {/* Connection Animation */}
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-0.5 bg-blue-300 rounded-full animate-pulse"></div>
                  <div className="w-2 h-0.5 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-0.5 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                </div>
                
                {/* Catalyst Icon */}
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Status Text */}
              <div className="space-y-3">
                <h2 className="text-xl font-semibold text-gray-900">
                  Connecting with Google
                </h2>
                <p className="text-gray-600 text-sm">
                  Setting up your secure access to Catalyst
                </p>
              </div>

              {/* Loading Indicator */}
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600"></div>
              </div>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Connection Failed
              </h2>
              <p className="text-gray-600 text-sm">
                {error}
              </p>
              <p className="text-gray-500 text-xs">
                Redirecting back to login...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                Welcome to Catalyst
              </h2>
              <p className="text-gray-600 text-sm">
                Taking you to your dashboard...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-200 border-t-green-600"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
