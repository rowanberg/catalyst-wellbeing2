'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { useAppDispatch } from '@/lib/redux/hooks'
import { setUser, setProfile } from '@/lib/redux/slices/authSlice'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { GraduationCap } from 'lucide-react'

export default function AuthCallback() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasProcessed, setHasProcessed] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { addToast } = useToast()

  // Check if welcome message was already shown in this session
  const welcomeShownKey = 'catalyst_welcome_shown'

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    // Clear welcome flag when component mounts (new session)
    return () => {
      // Cleanup on unmount
      sessionStorage.removeItem('catalyst_auth_processing')
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
            addToast({
              type: 'info',
              title: '👋 Welcome to Catalyst!',
              description: 'Please complete your registration to continue. We\'ve pre-filled some information from Google.'
            })
            
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
          addToast({
            type: 'success',
            title: '🎉 Welcome to Catalyst!',
            description: `Welcome ${userProfile?.first_name || 'back'}! You're now signed in as ${userRole}. Taking you to your dashboard...`
          })

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
        
        addToast({
          type: 'error',
          title: '❌ Authentication Failed',
          description: error.message || 'Failed to complete sign-in. Please try again.'
        })

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Professional Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        {/* Subtle Professional Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full filter blur-xl opacity-40"></div>
        <div className="absolute bottom-40 right-20 w-24 h-24 bg-gradient-to-r from-indigo-500/20 to-blue-600/20 rounded-full filter blur-xl opacity-40"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Catalyst Platform</h1>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <LoadingSpinner size="lg" text="Completing sign-in..." />
              <div className="space-y-2">
                <p className="text-white/90 text-base font-medium">
                  🎉 Welcome to Catalyst!
                </p>
                <p className="text-white/70 text-sm">
                  Setting up your personalized dashboard...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="text-red-400 text-lg font-medium">
                Authentication Failed
              </div>
              <p className="text-white/80 text-sm">
                {error}
              </p>
              <p className="text-white/60 text-xs">
                Redirecting back to login...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-green-400 text-xl font-bold">
                ✅ Welcome Aboard!
              </div>
              <p className="text-white/90 text-base">
                Taking you to your dashboard...
              </p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
