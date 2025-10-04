'use client'

import { useAppSelector } from '@/lib/redux/hooks'
import { PageLoader } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface UnifiedAuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'parent' | 'teacher' | 'admin'
  fallback?: React.ReactNode
}

export function UnifiedAuthGuard({
  children,
  requiredRole,
  fallback
}: UnifiedAuthGuardProps) {
  const { user, profile, isLoading, error } = useAppSelector(state => state.auth)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Ensure hydration consistency
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle role-based redirects
  useEffect(() => {
    if (!mounted) return // Wait for hydration

    if (!isLoading && user && profile) {
      if (requiredRole && profile.role !== requiredRole) {
        router.push(`/${profile.role}`)
      }
    } else if (!isLoading && !user) {
      router.push('/login')
    }
  }, [mounted, user, profile, isLoading, requiredRole, router])

  // Show consistent loading during hydration
  if (!mounted || isLoading) {
    return fallback || <PageLoader text="Verifying authentication..." />
  }

  // Not authenticated
  if (!user || !profile) {
    return <PageLoader text="Redirecting to login..." />
  }

  // Wrong role
  if (requiredRole && profile.role !== requiredRole) {
    return <PageLoader text="Redirecting to dashboard..." />
  }

  // Authenticated and authorized
  return <>{children}</>
}
