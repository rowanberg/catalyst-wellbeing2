'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAppSelector, useAppDispatch } from '@/lib/redux/hooks'
import { fetchProfile } from '@/lib/redux/slices/authSlice'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'

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
  
  // Track if we've already performed initial auth check
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const redirectAttempted = useRef(false)

  // Only fetch profile once if user exists but profile doesn't
  useEffect(() => {
    if (user && !profile && !isLoading) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, dispatch, isLoading])

  // Handle authorization check - only run once per session
  useEffect(() => {
    // Skip if already initialized
    if (hasInitialized) return

    // Force initialization after a short delay to prevent infinite loading
    const initTimer = setTimeout(() => {
      if (!hasInitialized) {
        setHasInitialized(true)
        
        // If we have user and profile, check admin role
        if (user && profile) {
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
        } else if (!user && !redirectAttempted.current) {
          redirectAttempted.current = true
          router.replace('/login')
        }
      }
    }, 1000) // 1 second timeout

    // Immediate check for existing auth
    if (user && profile) {
      clearTimeout(initTimer)
      if (profile.role === 'admin') {
        setIsAuthorized(true)
        setHasInitialized(true)
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
    } else if (!user && !isLoading && !redirectAttempted.current) {
      clearTimeout(initTimer)
      redirectAttempted.current = true
      setHasInitialized(true)
      router.replace('/login')
    }

    return () => clearTimeout(initTimer)
  }, [user, profile, isLoading, router, addToast, hasInitialized])

  // Show loading only if we haven't initialized yet
  if (!hasInitialized) {
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
  return <>{children}</>
}
