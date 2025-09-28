'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CheckCircle, 
  Mail, 
  User, 
  Shield, 
  ArrowRight, 
  RefreshCw,
  ExternalLink,
  Sparkles
} from 'lucide-react'

function RegistrationSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isResendingEmail, setIsResendingEmail] = useState(false)
  const [emailResent, setEmailResent] = useState(false)

  const email = searchParams.get('email')
  const name = searchParams.get('name')
  const role = searchParams.get('role')

  useEffect(() => {
    // Redirect to login if no params
    if (!email || !name || !role) {
      router.push('/login')
    }
  }, [email, name, role, router])

  const resendConfirmationEmail = async () => {
    if (!email) return

    setIsResendingEmail(true)
    try {
      const response = await fetch('/api/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setEmailResent(true)
        setTimeout(() => setEmailResent(false), 3000)
      }
    } catch (error) {
      console.error('Failed to resend email:', error)
    } finally {
      setIsResendingEmail(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return Shield
      case 'teacher':
        return User
      case 'parent':
        return User
      case 'student':
        return User
      default:
        return User
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'from-purple-500 to-indigo-600'
      case 'teacher':
        return 'from-blue-500 to-cyan-600'
      case 'parent':
        return 'from-green-500 to-emerald-600'
      case 'student':
        return 'from-orange-500 to-yellow-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (!email || !name || !role) {
    return null
  }

  const RoleIcon = getRoleIcon(role)
  const roleColor = getRoleColor(role)

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900">
        <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 w-28 h-28 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-pulse animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full mx-4">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="p-4 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full shadow-lg">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">🎉 Registration Successful!</h1>
            <p className="text-white/80 text-lg">Welcome to the Catalyst Well-Being Platform</p>
          </div>

          {/* User Details Card */}
          <div className="bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm mb-8">
            <h2 className="text-white font-semibold text-xl mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Your Account Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 bg-gradient-to-r ${roleColor} rounded-lg`}>
                    <RoleIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{name}</p>
                    <p className="text-white/60 text-sm capitalize">{role}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-lg">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{email}</p>
                    <p className="text-white/60 text-sm">Email Address</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Confirmation Instructions */}
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl p-6 backdrop-blur-sm mb-8">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-blue-500/30 rounded-lg flex-shrink-0">
                <Mail className="w-6 h-6 text-blue-200" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold text-lg mb-2">📧 Confirm Your Email</h3>
                <p className="text-white/80 mb-4">
                  We've sent a confirmation email to <strong>{email}</strong>. 
                  Please check your inbox and click the confirmation link to activate your account.
                </p>
                <div className="bg-white/10 rounded-lg p-3 mb-4">
                  <p className="text-white/70 text-sm">
                    <strong>📍 Check these locations:</strong>
                  </p>
                  <ul className="text-white/60 text-sm mt-2 space-y-1">
                    <li>• Inbox</li>
                    <li>• Spam/Junk folder</li>
                    <li>• Promotions tab (Gmail)</li>
                  </ul>
                </div>
                
                {/* Resend Email Button */}
                <button
                  onClick={resendConfirmationEmail}
                  disabled={isResendingEmail || emailResent}
                  className="flex items-center space-x-2 py-2 px-4 bg-blue-500/30 hover:bg-blue-500/40 disabled:bg-gray-500/30 border border-blue-400/30 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
                >
                  {isResendingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : emailResent ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Email Sent!</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Resend Email</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-white/5 border border-white/20 rounded-2xl p-6 backdrop-blur-sm mb-8">
            <h3 className="text-white font-semibold text-lg mb-4">🚀 What's Next?</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-white/80">
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                <span>Check your email and click the confirmation link</span>
              </div>
              <div className="flex items-center space-x-3 text-white/80">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                <span>Return to the login page and sign in</span>
              </div>
              <div className="flex items-center space-x-3 text-white/80">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                <span>Start your well-being journey on Catalyst!</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Go to Login</span>
            </Link>
            
            <button
              onClick={() => window.location.href = `mailto:${email}`}
              className="flex-1 flex items-center justify-center space-x-2 py-4 px-6 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all duration-200 hover:scale-105 backdrop-blur-sm"
            >
              <Mail className="w-5 h-5" />
              <span>Open Email App</span>
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Having trouble? Contact your school administrator or 
              <Link href="/support" className="text-emerald-400 hover:text-emerald-300 ml-1 underline">
                get support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  )
}
