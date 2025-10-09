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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Validating Reset Link</h2>
            <p className="text-white/70">Please wait while we verify your password reset link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">Invalid Reset Link</CardTitle>
            <CardDescription className="text-white/70">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
              <p className="text-red-300 text-sm">
                The reset link may have expired or already been used. Please request a new one.
              </p>
            </div>
            <div className="space-y-3">
              <Link href="/reset-password">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl">
                  Request New Reset Link
                </Button>
              </Link>
              <Link href="/login">
                <Button className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 py-3 rounded-xl">
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `radial-gradient(circle at 25% 25%, #00f5ff 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #ff6b6b 2px, transparent 2px)`,
          backgroundSize: '60px 60px',
          animation: 'float 25s ease-in-out infinite'
        }}></div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full mix-blend-multiply filter blur-xl animate-ping"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
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
            <CardTitle className="text-2xl font-bold text-white">
              {passwordUpdated ? 'Password Updated!' : 'Create New Password'}
            </CardTitle>
            <CardDescription className="text-white/70 text-base">
              {passwordUpdated 
                ? 'Your password has been successfully changed'
                : 'Choose a strong password for your account'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {passwordUpdated ? (
              <div className="text-center space-y-6">
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                  <h3 className="text-white font-semibold mb-2">Success!</h3>
                  <p className="text-white/80 text-sm">
                    Your password has been updated successfully. You can now sign in with your new password.
                  </p>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4">
                  <p className="text-white/70 text-sm">
                    Redirecting to login page in a few seconds...
                  </p>
                </div>

                <Link href="/login">
                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-3 rounded-xl font-medium">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Continue to Login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Security Notice */}
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Secure Password Tips</h4>
                      <p className="text-white/80 text-xs">
                        Use a mix of letters, numbers, and symbols for better security
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Password Field */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">New Password</Label>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300"
                      placeholder="Enter new password"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                        <span className="text-xs text-white/70">{passwordStrength.label}</span>
                      </div>
                    </div>
                  )}
                  
                  {errors.password && (
                    <p className="text-red-300 text-sm">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      {...register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full pl-12 pr-12 py-4 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-green-400 backdrop-blur-sm transition-all duration-300"
                      placeholder="Confirm new password"
                    />
                    <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/80"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-300 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Error Message */}
                {submitError && (
                  <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-3">
                    <p className="text-red-300 text-sm">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
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

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
      `}</style>
    </div>
  )
}
