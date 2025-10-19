'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks'
import { signIn } from '@/lib/redux/slices/authSlice'
import { useToast } from '@/components/ui/toast'
import { handleError } from '@/lib/utils/errorHandling'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, GraduationCap, Mail, Lock, Moon, Sun, AlertTriangle, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type LoginForm = z.infer<typeof loginSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [rememberMe, setRememberMe] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)
  const [isResetLoading, setIsResetLoading] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  const { error: authError} = useAppSelector((state) => state.auth)
  const { addToast } = useToast()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const {
    register: registerReset,
    handleSubmit: handleSubmitReset,
    watch: watchReset,
    formState: { errors: resetErrors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const emailValue = watch('email')

  // Auto-focus on email field using query selector
  useEffect(() => {
    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
    if (emailInput) {
      emailInput.focus()
    }
  }, [])

  // Dark mode initialization and persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDarkMode(shouldBeDark)
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  // Remember me - load saved email
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail')
    if (savedEmail) {
      setValue('email', savedEmail)
      setRememberMe(true)
    }
  }, [setValue])

  // Email autocomplete suggestions
  useEffect(() => {
    if (emailValue && emailValue.includes('@') && !emailValue.includes('@', emailValue.indexOf('@') + 1)) {
      const [localPart] = emailValue.split('@')
      const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'school.edu']
      const suggestions = domains.map(domain => `${localPart}@${domain}`)
        .filter(email => email !== emailValue)
      setEmailSuggestions(suggestions.slice(0, 3))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [emailValue])

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Detect caps lock
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
  }

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setSubmitError(null)
    
    // Handle remember me
    if (rememberMe) {
      localStorage.setItem('rememberedEmail', data.email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    
    try {
      const result = await dispatch(signIn({
        email: data.email,
        password: data.password
      }))
      
      if (signIn.fulfilled.match(result)) {
        // Successful login
        const userRole = result.payload.profile?.role || result.payload.user?.role
        console.log('Login successful, user role:', userRole, 'payload:', result.payload)
        
        // Show success message
        addToast({
          type: 'success',
          title: 'Login Successful',
          description: 'Redirecting to your dashboard...'
        })
        
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
        
        // Use window.location for a hard redirect
        window.location.href = dashboardPath
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

  // Password reset handler
  const onResetSubmit = async (data: ResetPasswordForm) => {
    setIsResetLoading(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      })

      if (response.ok) {
        setResetEmailSent(true)
        addToast({
          type: 'success',
          title: 'Reset Email Sent! 📧',
          description: 'Check your inbox for password reset instructions'
        })
      } else {
        const errorData = await response.json()
        setSubmitError(errorData.message || 'Failed to send reset email')
        addToast({
          type: 'error',
          title: 'Failed to Send Email',
          description: errorData.message || 'Please try again later'
        })
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setSubmitError('Network error. Please check your connection.')
      addToast({
        type: 'error',
        title: 'Network Error',
        description: 'Unable to send reset email. Please check your connection.'
      })
    } finally {
      setIsResetLoading(false)
    }
  }

  // Toggle to reset form
  const handleShowResetForm = () => {
    setShowResetForm(true)
    setResetEmailSent(false)
    setSubmitError(null)
  }

  // Back to login
  const handleBackToLogin = () => {
    setShowResetForm(false)
    setResetEmailSent(false)
    setSubmitError(null)
  }

  // Google Sign-In handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setSubmitError(null)
    
    try {
      console.log('🔄 Starting Google Sign-In...')
      
      const { error } = await supabase.auth.signInWithOAuth({
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 relative transition-colors duration-300">
      {/* Optimized geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/15 to-indigo-600/15 dark:from-blue-600/20 dark:to-indigo-800/20 rounded-full blur-2xl"></div>
        <div className="absolute top-20 -left-32 w-64 h-64 bg-gradient-to-br from-violet-400/15 to-purple-600/15 dark:from-violet-600/20 dark:to-purple-800/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 dark:from-cyan-600/20 dark:to-blue-800/20 rounded-full blur-xl"></div>
      </div>

      {/* Dark Mode Toggle */}
      <button
        onClick={toggleDarkMode}
        className="fixed top-4 right-4 z-50 p-2.5 bg-white/90 dark:bg-slate-800/90 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 backdrop-blur-sm"
        aria-label="Toggle dark mode"
      >
        {isDarkMode ? (
          <Sun className="w-5 h-5 text-yellow-500" />
        ) : (
          <Moon className="w-5 h-5 text-slate-700" />
        )}
      </button>

      {/* Main Content Container */}
      <div className="w-full lg:flex lg:flex-row">
        {/* Left Section - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-6 sm:py-8 lg:py-0 relative z-10 min-h-[60vh] lg:min-h-full">
          <div className="w-full max-w-md space-y-4 sm:space-y-6 lg:space-y-8">
          {/* Brand Header */}
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {showResetForm ? 'Reset Password' : 'Welcome to Catalyst'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {showResetForm 
                ? 'Enter your email to receive reset instructions'
                : "Your school's well-being platform"
              }
            </p>
          </div>

          {/* Optimized Login/Reset Form */}
          <div className="bg-white/95 dark:bg-slate-800/95 rounded-2xl p-4 sm:p-6 shadow-xl border border-white/30 dark:border-slate-700/30 backdrop-blur-sm">
            {!showResetForm ? (
              /* Login Form */
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    {...register('email')}
                    type="email"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    onFocus={() => emailValue && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    suppressHydrationWarning={true}
                  />
                  {/* Email Suggestions Dropdown */}
                  {showSuggestions && emailSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg">
                      {emailSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setValue('email', suggestion)
                            setShowSuggestions(false)
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 first:rounded-t-xl last:rounded-b-xl transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    onKeyUp={handleKeyPress}
                    onKeyDown={handleKeyPress}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    suppressHydrationWarning={true}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {/* Caps Lock Warning */}
                {capsLockOn && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Caps Lock is on</span>
                  </div>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleShowResetForm}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Messages */}
              {(authError || submitError) && (
                <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span className="leading-tight">{authError || submitError}</span>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 touch-manipulation"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>

              {/* Google Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200 flex items-center justify-center gap-2 touch-manipulation disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </form>
            ) : (
              /* Password Reset Form */
              <div className="space-y-4 sm:space-y-5">
                {!resetEmailSent ? (
                  <form onSubmit={handleSubmitReset(onResetSubmit)} className="space-y-4 sm:space-y-5">
                    {/* Email Field */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <input
                          {...registerReset('email')}
                          type="email"
                          autoComplete="email"
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter your email"
                        />
                      </div>
                      {resetErrors.email && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{resetErrors.email.message}</p>
                      )}
                    </div>

                    {/* Error Messages */}
                    {submitError && (
                      <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/30">
                        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{submitError}</span>
                      </div>
                    )}

                    {/* Send Reset Link Button */}
                    <button
                      type="submit"
                      disabled={isResetLoading}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    >
                      {isResetLoading ? (
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Sending...</span>
                        </div>
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>

                    {/* Back to Login */}
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-slate-600 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </button>
                  </form>
                ) : (
                  /* Success Message */
                  <div className="space-y-4 text-center py-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Check Your Email</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      We've sent password reset instructions to your email address. Please check your inbox and spam folder.
                    </p>
                    <button
                      onClick={handleBackToLogin}
                      className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Back to Sign In
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Links */}
            <div className="mt-4 sm:mt-6 space-y-3">
              <div className="flex gap-2">
                <Link href="/register/wizard" className="flex-1 py-2.5 px-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-center rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors text-sm font-medium touch-manipulation">
                  New School
                </Link>
                <Link href="/register" className="flex-1 py-2.5 px-4 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 text-center rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm font-medium touch-manipulation">
                  Join School
                </Link>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Right Section - Features */}
        <div className="flex flex-col lg:flex-1 items-center justify-center px-4 sm:px-6 py-6 sm:py-8 lg:p-6 xl:p-8 relative z-10 bg-gradient-to-b from-transparent via-white/15 to-white/25 dark:via-slate-800/15 dark:to-slate-800/25 lg:bg-transparent">
          <div className="w-full max-w-md lg:max-w-lg space-y-4 sm:space-y-6 xl:space-y-8">
            {/* Mobile separator */}
            <div className="lg:hidden w-full max-w-xs mx-auto h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent mb-6"></div>
            
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3 xl:mb-4">Advanced AI Education Platform</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base xl:text-lg px-2 sm:px-0">Empowering schools with comprehensive well-being management</p>
            </div>

            <div className="grid gap-2 sm:gap-3 xl:gap-4">
              <div className="bg-white/85 dark:bg-slate-800/85 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Student Well-being</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Mental health tracking & support</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/85 dark:bg-slate-800/85 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">AI Analytics</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Predictive insights & interventions</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/85 dark:bg-slate-800/85 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">Collaboration</h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Study groups & peer tutoring</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section - Optimized */}
            <div className="bg-white/70 dark:bg-slate-800/70 lg:bg-transparent rounded-xl p-4 sm:p-5">
              <div className="text-center grid grid-cols-3 gap-3 sm:gap-4 xl:gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-2 sm:p-3 lg:bg-transparent lg:p-0">
                  <div className="text-lg sm:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">500+</div>
                  <div className="text-xs xl:text-sm text-gray-600 dark:text-gray-400">Schools</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-2 sm:p-3 lg:bg-transparent lg:p-0">
                  <div className="text-lg sm:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">50K+</div>
                  <div className="text-xs xl:text-sm text-gray-600 dark:text-gray-400">Students</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-2 sm:p-3 lg:bg-transparent lg:p-0">
                  <div className="text-lg sm:text-xl xl:text-2xl font-bold text-gray-900 dark:text-white">99.9%</div>
                  <div className="text-xs xl:text-sm text-gray-600 dark:text-gray-400">Uptime</div>
                </div>
              </div>
            </div>

            {/* Mobile Trust Badges */}
            <div className="lg:hidden bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>SSL Secured</span>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>FERPA Compliant</span>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>SOC 2 Certified</span>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Trusted by educational institutions worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
