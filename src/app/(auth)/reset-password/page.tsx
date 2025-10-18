'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Shield, Key, Sparkles, Heart } from 'lucide-react'

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const router = useRouter()
  const { addToast } = useToast()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const email = watch('email')

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)
    setSubmitError(null)
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email })
      })

      if (response.ok) {
        setEmailSent(true)
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
      setIsLoading(false)
    }
  }

  const handleTryAgain = () => {
    setEmailSent(false)
    setSubmitError(null)
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
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-red-400/20 rounded-full mix-blend-multiply filter blur-xl animate-bounce"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full mix-blend-multiply filter blur-xl animate-ping"></div>
        
        {/* Floating Icons */}
        <div className="absolute top-32 left-1/4 text-white/10 animate-float">
          <Key className="w-12 h-12" />
        </div>
        <div className="absolute bottom-40 right-1/4 text-white/10 animate-float-delayed">
          <Shield className="w-10 h-10" />
        </div>
        <div className="absolute top-1/2 right-20 text-white/10 animate-bounce">
          <Heart className="w-8 h-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href="/login"
            className="inline-flex items-center text-white/70 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </Link>
        </div>

        {/* Enhanced Glassmorphism Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center relative">
                <Key className="w-8 h-8 text-white" />
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-yellow-800" />
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              {emailSent ? 'Check Your Email' : 'Reset Your Password'}
            </CardTitle>
            <CardDescription className="text-white/70 text-base">
              {emailSent 
                ? 'We\'ve sent you a secure reset link'
                : 'Enter your email to receive reset instructions'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-400 animate-pulse" />
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4">
                    <p className="text-white font-medium mb-2">📧 Email sent successfully!</p>
                    <p className="text-white/80 text-sm">
                      We've sent password reset instructions to:
                    </p>
                    <div className="bg-white/10 rounded-lg p-2 mt-2">
                      <p className="text-white font-medium">{email}</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-xl p-4">
                    <h4 className="text-white font-medium mb-2">🔍 What's Next?</h4>
                    <div className="space-y-2 text-left text-sm text-white/80">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-0.5">1.</span>
                        <span>Check your email inbox (and spam folder)</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-0.5">2.</span>
                        <span>Click the "Reset Password" link in the email</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-400 mt-0.5">3.</span>
                        <span>Create your new secure password</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-xl p-3">
                    <p className="text-white/70 text-sm">
                      💡 <strong>Didn't receive it?</strong> Check your spam folder or wait a few minutes
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleTryAgain}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Send Another Email
                  </Button>
                  
                  <Link href="/login">
                    <Button className="w-full bg-white/10 border border-white/20 text-white hover:bg-white/20 py-3 rounded-xl font-medium transition-all duration-300">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Security Notice */}
                <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-xl p-4">
                  <div className="flex items-start space-x-3">
                    <Shield className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-white font-medium text-sm mb-1">Secure Reset Process</h4>
                      <p className="text-white/80 text-xs">
                        We'll send you a secure link that expires in 1 hour for your safety
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label className="text-white font-medium">Email Address</Label>
                  <div className="relative">
                    <Input
                      {...register('email')}
                      type="email"
                      className="w-full pl-12 pr-4 py-4 bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm transition-all duration-300"
                      placeholder="Enter your email address"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                  </div>
                  {errors.email && (
                    <p className="text-red-300 text-sm">{errors.email.message}</p>
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
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Sending Reset Email...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Send Reset Instructions
                    </>
                  )}
                </Button>

                {/* Help Section */}
                <div className="text-center pt-4 border-t border-white/20">
                  <p className="text-white/60 text-sm mb-2">
                    Remember your password?
                  </p>
                  <Link 
                    href="/login"
                    className="text-blue-300 hover:text-blue-200 text-sm font-medium transition-colors"
                  >
                    Sign in instead
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Bottom Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white">Secure Reset</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Key className="w-4 h-4 text-green-400" />
            <span className="text-sm text-white">1-Hour Expiry</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-sm text-white">We're Here to Help</span>
          </div>
        </div>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-15px) rotate(-1deg); }
          66% { transform: translateY(-25px) rotate(1deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
