'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import { PageLoader } from '@/components/ui/loading-spinner'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'parent' | 'teacher' | 'admin'
  fallback?: React.ReactNode
}

export function AuthGuard({ children, requiredRole, fallback }: AuthGuardProps) {
  const { isLoading, isAuthenticated, error, user, profile } = useAuth({
    requiredRole,
    requireProfile: true
  })

  if (isLoading) {
    return fallback || <PageLoader text="Verifying authentication..." />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Authentication Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PageLoader text="Redirecting to login..." />
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = `/${profile?.role || 'student'}`} 
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  )
}
