'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/toast'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const searchParams = useSearchParams()
  const { addToast } = useToast()

  // Get email from URL params if provided
  const urlEmail = searchParams.get('email')

  const handleResendConfirmation = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const targetEmail = email || urlEmail
    if (!targetEmail) {
      addToast({
        type: 'error',
        title: 'Email Required',
        description: 'Please enter your email address'
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      })

      if (response.ok) {
        setEmailSent(true)
        addToast({
          type: 'success',
          title: 'Email Sent!',
          description: 'Please check your inbox for the confirmation link'
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
      console.error('Error sending confirmation email:', error)
      addToast({
        type: 'error',
        title: 'Network Error',
        description: 'Unable to send email. Please check your connection.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 opacity-10" style={{ 
          backgroundImage: `radial-gradient(circle at 25% 25%, #00f5ff 2px, transparent 2px),
                           radial-gradient(circle at 75% 75%, #ff6b6b 2px, transparent 2px)`,
          backgroundSize: '50px 50px',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-md w-full mx-4">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Confirm Your Email
            </CardTitle>
            <CardDescription className="text-white/70 text-base">
              {emailSent 
                ? 'Check your inbox for the confirmation link'
                : 'Resend your email confirmation link'
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <CheckCircle className="w-16 h-16 text-green-400" />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-medium">Email sent successfully!</p>
                  <p className="text-white/70 text-sm">
                    We've sent a confirmation link to <strong>{email || urlEmail}</strong>
                  </p>
                  <p className="text-white/60 text-xs">
                    Don't see it? Check your spam folder or try again in a few minutes.
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={() => setEmailSent(false)}
                    variant="outline"
                    className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Send Again
                  </Button>
                  <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleResendConfirmation} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Email Address</Label>
                  <Input
                    type="email"
                    value={email || urlEmail || ''}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-white/5 border-2 border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400"
                    disabled={!!urlEmail}
                    required
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white py-3 rounded-xl font-medium transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Confirmation Email
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <Link 
                    href="/login"
                    className="inline-flex items-center text-white/70 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
