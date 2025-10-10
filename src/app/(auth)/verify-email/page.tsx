'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { Mail, CheckCircle, RefreshCw, ArrowRight, Clock, Shield, Sparkles, Heart } from 'lucide-react'

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  const email = searchParams.get('email')
  const firstName = searchParams.get('firstName')

  // Countdown timer for resend button
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
      return undefined // Explicitly return undefined for TypeScript
    }
  }, [timeLeft])

  // Check email verification status
  const checkEmailStatus = async () => {
    if (!email) return

    setIsCheckingStatus(true)
    
    try {
      const response = await fetch('/api/check-email-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.verified) {
          addToast({
            type: 'success',
            title: 'Email Verified! 🎉',
            description: 'Your email has been confirmed. Redirecting to login...'
          })
          setTimeout(() => {
            router.push('/login?message=Email verified successfully! You can now sign in.')
          }, 1500)
        } else {
          addToast({
            type: 'info',
            title: 'Not Yet Verified',
            description: 'Please check your email and click the confirmation link'
          })
        }
      }
    } catch (error) {
      console.error('Error checking email status:', error)
    } finally {
      setIsCheckingStatus(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'Email address not found. Please try registering again.'
      })
      return
    }

    setIsResending(true)
    
    try {
      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        setEmailSent(true)
        setTimeLeft(60)
        setCanResend(false)
        addToast({
          type: 'success',
          title: 'Email Sent! 📧',
          description: 'We\'ve sent another confirmation email to your inbox'
        })
      } else {
        const errorData = await response.json()
        addToast({
          type: 'error',
          title: 'Failed to Send Email',
          description: errorData.message || 'Please try again later'
        })
      }
    } catch (error) {
      console.error('Error resending email:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        description: 'Unable to send email. Please check your connection.'
      })
    } finally {
      setIsResending(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
          <Mail className="w-12 h-12" />
        </div>
        <div className="absolute bottom-40 right-1/4 text-white/10 animate-float-delayed">
          <Shield className="w-10 h-10" />
        </div>
        <div className="absolute top-1/2 right-20 text-white/10 animate-bounce">
          <Heart className="w-8 h-8" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse shadow-2xl">
              <Mail className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-yellow-800" />
            </div>
            {/* Success checkmark animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center opacity-0 animate-ping">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Glassmorphism Card */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-3xl font-bold text-white mb-2">
              🎉 Welcome to Catalyst{firstName ? `, ${firstName}` : ''}!
            </CardTitle>
            <CardDescription className="text-white/80 text-lg">
              You're almost ready to start your wellbeing journey
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            {/* Step Indicator */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/80 text-sm">Account Created</span>
              </div>
              <div className="w-12 h-0.5 bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/80 text-sm">Verify Email</span>
              </div>
              <div className="w-12 h-0.5 bg-white/30"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white/60" />
                </div>
                <span className="text-white/60 text-sm">Start Journey</span>
              </div>
            </div>

            {/* Main Message */}
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-400/30 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-white mb-3">
                  📧 Check Your Email
                </h3>
                <p className="text-white/80 mb-4">
                  We've sent a confirmation link to:
                </p>
                <div className="bg-white/10 rounded-xl p-3 border border-white/20">
                  <p className="text-white font-medium text-lg">{email}</p>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-2xl p-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  ✨ What's Next?
                </h4>
                <div className="space-y-3 text-left">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">1</span>
                    </div>
                    <p className="text-white/80">Open your email inbox and look for our message</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">2</span>
                    </div>
                    <p className="text-white/80">Click the "Confirm Email" button in the email</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-white text-xs font-bold">3</span>
                    </div>
                    <p className="text-white/80">Return here and sign in to start your journey!</p>
                  </div>
                </div>
              </div>

              {/* Helpful Tips */}
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 rounded-2xl p-4">
                <p className="text-white/70 text-sm">
                  💡 <strong>Can't find the email?</strong> Check your spam folder or promotions tab
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Check Status Button */}
              <Button
                onClick={checkEmailStatus}
                disabled={isCheckingStatus}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105"
              >
                {isCheckingStatus ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Checking Status...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    I've Confirmed - Check Status
                  </>
                )}
              </Button>

              {/* Resend Email Button */}
              <Button
                onClick={handleResendEmail}
                disabled={isResending || !canResend}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Sending Email...
                  </>
                ) : !canResend ? (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Resend in {formatTime(timeLeft)}
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 mr-2" />
                    Resend Confirmation Email
                  </>
                )}
              </Button>

              {/* Sign In Button */}
              <Link href="/login">
                <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-4 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105">
                  <ArrowRight className="w-5 h-5 mr-2" />
                  I've Confirmed - Sign In Now
                </Button>
              </Link>

              {/* Help Link */}
              <div className="text-center pt-4">
                <Link 
                  href="/help"
                  className="text-white/60 hover:text-white/80 text-sm transition-colors underline"
                >
                  Need help? Contact support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Feature Pills */}
        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-white">Secure & Private</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-sm text-white">Wellbeing Focused</span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-white">Gamified Learning</span>
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
