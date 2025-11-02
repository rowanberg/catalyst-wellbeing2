'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabaseClient'
import { ProfessionalFooter } from '@/components/layout/ProfessionalFooter'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()
  
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const redirectAttempted = useRef(false)

  // Check Supabase session directly on mount (prevents redirect on refresh)
  useEffect(() => {
    let mounted = true
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (session?.user) {
          console.log('✅ [ADMIN LAYOUT] Active Supabase session found')
          // Session exists, fetch profile if we don't have it
          if (!profile && !isLoading) {
            dispatch(fetchProfile(session.user.id))
          }
        } else {
          console.log('❌ [ADMIN LAYOUT] No Supabase session found')
          if (!redirectAttempted.current) {
            redirectAttempted.current = true
            router.replace('/login')
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        if (mounted) {
          setIsCheckingSession(false)
        }
      }
    }
    
    checkSession()
    
    return () => {
      mounted = false
    }
  }, [])

  // Only fetch profile once if user exists but profile doesn't
  useEffect(() => {
    if (user && !profile && !isLoading && !isCheckingSession) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, dispatch, isLoading, isCheckingSession])

  // Handle authorization once we have profile
  useEffect(() => {
    if (hasInitialized || isCheckingSession) return
    
    if (user && profile) {
      setHasInitialized(true)
      
      if (profile.role === 'admin') {
        setIsAuthorized(true)
      } else if (!redirectAttempted.current) {
        redirectAttempted.current = true
        addToast({
          type: 'error',
          title: 'Access Denied',
          description: 'You do not have permission to access the admin area.'
        })
        
        const redirectPath = profile.role === 'student' ? '/student' :
                           profile.role === 'teacher' ? '/teacher' :
                           profile.role === 'parent' ? '/parent' : '/'
        
        router.replace(redirectPath)
      }
    }
  }, [user, profile, isCheckingSession, router, addToast, hasInitialized])

  // Show loading while checking session or waiting for profile
  if (isCheckingSession || !hasInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-slate-600 font-medium">
            Verifying admin access...
          </p>
        </div>
      </div>
    )
  }

  // If not authorized after initialization, show loading (redirect is in progress)
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <PageLoader />
          <p className="mt-4 text-slate-600 font-medium">
            Redirecting...
          </p>
        </div>
      </div>
    )
  }

  // Only render admin content if user is authenticated and has admin role
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {children}
      </div>
      <ProfessionalFooter />
    </div>
  )
}
