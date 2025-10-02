'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { signIn } from '@/lib/redux/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { handleError, showErrorToast, AuthError } from '@/lib/utils/errorHandling'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, GraduationCap, Mail, Lock, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { user, profile, isLoading: authLoading, error: authError } = useAppSelector((state) => state.auth)
  const { addToast } = useToast()

  // Ensure client-side rendering to avoid hydration issues with browser extensions
  useEffect(() => {
    setIsClient(true)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setSubmitError(null)
    
    try {
      const result = await dispatch(signIn({
        email: data.email,
        password: data.password
      }))
      
      if (signIn.fulfilled.match(result)) {
        // Successful login
        const userRole = result.payload.profile?.role || result.payload.user?.role
        console.log('Login successful, user role:', userRole, 'payload:', result.payload)
        
        // Route to correct dashboard path
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
        
        console.log('Redirecting to:', dashboardPath)
        
        // Use Next.js router to redirect immediately
        router.push(dashboardPath)
      } else if (signIn.rejected.match(result)) {
        // Handle login error
        const errorMessage = result.payload as string || 'Login failed'
        setSubmitError(errorMessage)
        addToast({
          type: 'error',
          title: 'Login Failed',
          description: errorMessage
        })
      }
    } catch (error) {
      const appError = handleError(error, 'login')
      setSubmitError(appError.message)
      addToast({
        type: 'error',
        title: 'Login Error',
        description: appError.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setSubmitError(null)
    
    try {
      console.log('🔄 Starting Google Sign-In...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('❌ Google Sign-In error:', error)
        throw error
      }

      console.log('✅ Google Sign-In initiated successfully')
      
      addToast({
        type: 'success',
        title: 'Redirecting to Google...',
        description: 'Please complete sign-in with Google'
      })
      
    } catch (error: any) {
      console.error('Google Sign-In error:', error)
      setSubmitError(error.message || 'Google Sign-In failed')
      addToast({
        type: 'error',
        title: 'Google Sign-In Failed',
        description: error.message || 'Failed to sign in with Google'
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

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
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Catalyst Platform</h1>
            <p className="text-white/90 text-lg font-medium mb-2">School Well-being Management</p>
            <p className="text-white/70 text-sm">Sign in to access your dashboard</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium block">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your email"
                  suppressHydrationWarning={true}
                  key={isClient ? 'client-email' : 'server-email'}
                />
              </div>
              {(authError || submitError) && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{authError || submitError}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-white/90 text-sm font-medium block">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                  placeholder="Enter your password"
                  suppressHydrationWarning={true}
                  key={isClient ? 'client-password' : 'server-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/60 hover:text-white/80 transition-colors"
                  suppressHydrationWarning={true}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Sign-In Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Email Sign-In Button */}
              <button
                type="submit"
                disabled={!isClient || isLoading || authLoading || isGoogleLoading}
                className="py-3 px-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center space-x-2"
              >
                {isClient && (isLoading || authLoading) ? (
                  <LoadingSpinner size="sm" text="Signing in..." />
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Email Sign In</span>
                  </>
                )}
              </button>

              {/* Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={!isClient || isLoading || authLoading || isGoogleLoading}
                className="py-3 px-4 bg-white hover:bg-gray-50 disabled:bg-gray-300 text-gray-700 disabled:text-gray-500 font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent flex items-center justify-center space-x-2 border border-gray-200"
              >
                {isClient && isGoogleLoading ? (
                  <LoadingSpinner size="sm" text="Connecting..." />
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span>Google</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Navigation Links */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-white/80">New to Catalyst?</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Link
                href="/register"
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm group"
              >
                <GraduationCap className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                <span>Join Your School</span>
              </Link>
              
              <Link
                href="/register/wizard"
                className="flex items-center justify-center space-x-2 py-3 px-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/30 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm group"
              >
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-200" />
                <span>Register New School</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
