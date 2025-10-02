'use client'

import { useEffect } from 'react'
import { useAppDispatch } from '@/lib/redux/hooks'
import { checkAuth } from '@/lib/redux/slices/authSlice'

/**
 * Component that checks for existing auth session on app load
 * Must be inside Redux Provider
 */
export function AuthChecker({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()
  
  // Check for existing auth session on mount
  useEffect(() => {
    console.log('🔄 [AuthChecker] Checking for existing session...')
    dispatch(checkAuth())
  }, [dispatch])
  
  return <>{children}</>
}
