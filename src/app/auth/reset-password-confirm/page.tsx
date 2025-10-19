'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle, RefreshCw, Shield, Key, Sparkles, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type NewPasswordForm = z.infer<typeof newPasswordSchema>

export default function ResetPasswordConfirmPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [isValidToken, setIsValidToken] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<NewPasswordForm>({
    resolver: zodResolver(newPasswordSchema)
  })

  const password = watch('password')

  // Validate the reset token on component mount
  useEffect(() => {
    const validateToken = async () => {
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (!token_hash || type !== 'recovery') {
        setIsValidToken(false)
        setIsValidating(false)
        return
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token_hash,
        })

        if (error) {
          console.error('Token validation error:', error)
          setIsValidToken(false)
        } else {
          setIsValidToken(true)
        }
      } catch (error) {
        console.error('Token validation failed:', error)
        setIsValidToken(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [searchParams])

  const onSubmit = async (data: NewPasswordForm) => {
    setIsLoading(true)
    setSubmitError(null)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password
      })

      if (error) {
        throw error
      }

      setPasswordUpdated(true)
      addToast({
        type: 'success',
        title: 'Password Updated! 🎉',
        description: 'Your password has been successfully changed'
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?message=Password updated successfully! Please sign in with your new password.')
      }, 3000)

    } catch (error: any) {
      console.error('Password update error:', error)
      setSubmitError(error.message || 'Failed to update password. Please try again.')
      addToast({
        type: 'error',
        title: 'Update Failed',
        description: error.message || 'Failed to update password'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' }
    
    let strength = 0
    if (password.length >= 6) strength += 1
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    const levels = [
      { strength: 0, label: '', color: '' },
      { strength: 1, label: 'Weak', color: 'bg-red-500' },
      { strength: 2, label: 'Fair', color: 'bg-orange-500' },
      { strength: 3, label: 'Good', color: 'bg-yellow-500' },
      { strength: 4, label: 'Strong', color: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'bg-emerald-500' },
    ]

    return levels[strength] || levels[0]
  }

  const passwordStrength = getPasswordStrength(password || '')

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 shadow-2xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Validating Reset Link</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we verify your password reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 shadow-2xl max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">Invalid Reset Link</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4">
              <p className="text-red-700 dark:text-red-300 text-sm">
                The reset link may have expired or already been used. Please request a new one.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-600 py-3 rounded-xl">
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 transition-colors duration-300">
      {/* Optimized geometric background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/15 to-indigo-600/15 dark:from-blue-600/20 dark:to-indigo-800/20 rounded-full blur-2xl"></div>
        <div className="absolute top-20 -left-32 w-64 h-64 bg-gradient-to-br from-violet-400/15 to-purple-600/15 dark:from-violet-600/20 dark:to-purple-800/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-1/3 w-48 h-48 bg-gradient-to-br from-cyan-400/15 to-blue-500/15 dark:from-cyan-600/20 dark:to-blue-800/20 rounded-full blur-xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center relative">
                {passwordUpdated ? (
                  <CheckCircle className="w-8 h-8 text-white" />
                ) : (
                  <Key className="w-8 h-8 text-white" />
                )}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {passwordUpdated ? 'Password Updated!' : 'Create New Password'}
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400 text-base">
              {passwordUpdated 
                ? 'Your password has been successfully changed'
                : 'Choose a strong password for your account'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {passwordUpdated ? (
              <div className="text-center space-y-6">
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl p-6">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                  <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Success!</h3>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Redirecting to login page in a few seconds...
                  </p>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Security Notice */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-gray-900 dark:text-white font-medium text-sm mb-1">Secure Password Tips</h4>
                      <p className="text-gray-700 dark:text-gray-300 text-xs">
                        Use a mix of letters, numbers, and symbols for better security
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-white/20 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300 font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 dark:text-red-400 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3">
                    <p className="text-red-600 dark:text-red-400 text-sm">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
