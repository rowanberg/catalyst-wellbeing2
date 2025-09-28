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
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { addToast } = useToast()

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const handleAuthCallback = async () => {
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
          
          // If no profile exists, create one for Google OAuth users
          if (!profile) {
            console.log('📝 Creating new profile for Google user...')
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: data.session.user.id,
                email: data.session.user.email,
                first_name: data.session.user.user_metadata?.full_name?.split(' ')[0] || '',
                last_name: data.session.user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                role: 'student', // Default role, can be changed later
                avatar_url: data.session.user.user_metadata?.avatar_url || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .select()
              .single()

            if (createError) {
              console.error('❌ Profile creation error:', createError)
              throw createError
            }

            userProfile = newProfile
            console.log('✅ Profile created successfully')
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

          addToast({
            type: 'success',
            title: 'Welcome to Catalyst!',
            description: `Successfully signed in with Google. Redirecting to your ${userRole} dashboard...`
          })

          // Redirect to appropriate dashboard
          setTimeout(() => {
            router.push(dashboardPath)
          }, 1000)

        } else {
          throw new Error('No session found after authentication')
        }

      } catch (error: any) {
        console.error('Auth callback error:', error)
        setError(error.message || 'Authentication failed')
        
        addToast({
          type: 'error',
          title: 'Authentication Failed',
          description: error.message || 'Failed to complete sign-in. Please try again.'
        })

        // Redirect back to login after error
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } finally {
        setIsLoading(false)
      }
    }

    handleAuthCallback()
  }, [router, dispatch, addToast, supabase])

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
            <div className="space-y-4">
              <LoadingSpinner size="lg" text="Completing sign-in..." />
              <p className="text-white/80 text-sm">
                Please wait while we set up your account...
              </p>
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
              <div className="text-green-400 text-lg font-medium">
                Success!
              </div>
              <p className="text-white/80 text-sm">
                Redirecting to your dashboard...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
