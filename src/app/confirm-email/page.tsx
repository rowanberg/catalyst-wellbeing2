'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { Mail, CheckCircle } from 'lucide-react'

export default function ConfirmEmailPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const { addToast } = useToast()

  const handleConfirmEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      addToast({
        type: 'error',
        title: 'Email Required',
        description: 'Please enter your email address'
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/confirm-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsConfirmed(true)
        addToast({
          type: 'success',
          title: 'Email Confirmed!',
          description: 'Your email has been confirmed. You can now log in.'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Confirmation Failed',
          description: data.message || 'Failed to confirm email'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'An error occurred while confirming your email'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-400" />
            </div>
            <CardTitle className="text-2xl text-white">Email Confirmed!</CardTitle>
            <CardDescription className="text-white/70">
              Your email has been successfully confirmed. You can now log in to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/login'}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Mail className="w-16 h-16 text-blue-400" />
          </div>
          <CardTitle className="text-2xl text-white">Confirm Your Email</CardTitle>
          <CardDescription className="text-white/70">
            Enter your email address to manually confirm it and enable login access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleConfirmEmail} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" text="Confirming..." />
              ) : (
                'Confirm Email'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
