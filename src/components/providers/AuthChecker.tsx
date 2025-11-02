'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAppDispatch } from '@/lib/redux/hooks'
import { checkAuth } from '@/lib/redux/slices/authSlice'

/**
 * Component that checks for existing auth session on app load
 * Skips public routes to prevent unnecessary API calls
 */
export function AuthChecker({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  
  // Public routes that don't need auth checks
  const isPublicRoute = 
    pathname === '/login' ||
    pathname === '/quick-login' ||
    pathname === '/auth/callback' ||
    pathname?.startsWith('/register') ||
    pathname?.startsWith('/reset-password')
  
  useEffect(() => {
    // Skip auth check on public routes
    if (isPublicRoute) {
      console.log('⏭️  [AuthChecker] Skipping auth check on public route:', pathname)
      return
    }
    
    console.log('🔄 [AuthChecker] Checking auth for protected route:', pathname)
    dispatch(checkAuth())
  }, [dispatch, isPublicRoute, pathname])
  
  return <>{children}</>
}
