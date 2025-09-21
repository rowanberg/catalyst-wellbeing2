'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const dispatch = useAppDispatch()
  const { user, profile, isLoading } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()

  useEffect(() => {
    if (user && !profile) {
      dispatch(fetchProfile(user.id))
    }
  }, [user, profile, dispatch])

  useEffect(() => {
    // If no user is authenticated, redirect to login
    if (!isLoading && !user) {
      router.push('/login')
      return
    }

    // If user is authenticated but profile is loaded and not admin, redirect
    if (!isLoading && user && profile && profile.role !== 'admin') {
      addToast({
        type: 'error',
        title: 'Access Denied',
        description: 'You do not have permission to access the admin area.'
      })
      
      // Redirect based on user role
      switch (profile.role) {
        case 'student':
          router.push('/student')
          break
        case 'teacher':
          router.push('/teacher')
          break
        case 'parent':
          router.push('/parent')
          break
        default:
          router.push('/')
      }
      return
    }
  }, [user, profile, isLoading, router, addToast])

  // Show loading while checking authentication and authorization
  if (isLoading || !user || !profile) {
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

  // Show loading if profile exists but role check is still pending
  if (profile.role !== 'admin') {
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
