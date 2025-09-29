'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if Supabase is configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.warn('Supabase not configured, redirecting to login')
          router.push('/login')
          return
        }

        const { supabase } = await import('@/lib/supabaseClient')
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is authenticated, get their profile to determine role
          try {
            const response = await fetch('/api/get-profile', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: session.user.id }),
            })
            
            if (response.ok) {
              const profile = await response.json()
              router.push(`/${profile.role}`)
            } else {
              // Check if this is a Google OAuth user without a profile
              const errorData = await response.json().catch(() => ({}))
              
              if (response.status === 404 && errorData.code === 'PROFILE_NOT_FOUND') {
                // Check if user has Google provider
                const { data: { user } } = await supabase.auth.getUser()
                
                if (user && user.app_metadata?.provider === 'google') {
                  console.log('🔄 Google OAuth user without profile, redirecting to registration...')
                  
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
              
              // For all other cases, redirect to login
              router.push('/login')
            }
          } catch (error) {
            router.push('/login')
          }
        } else {
          // User is not authenticated, redirect to login
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
