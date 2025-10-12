'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Home, AlertCircle, CheckCircle, Heart, Shield, Users } from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { ClientWrapper } from '@/components/providers/ClientWrapper'

const helpRequestSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high']),
  message: z.string().min(10, 'Please provide more details about how we can help'),
})

type HelpRequestForm = z.infer<typeof helpRequestSchema>

export default function RequestHelpPage() {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [submissionError, setSubmissionError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<HelpRequestForm>({
    resolver: zodResolver(helpRequestSchema),
  })

  const onSubmit = async (data: HelpRequestForm) => {
    if (!user) return

    setIsLoading(true)
    setSubmissionError(null)
    
    try {
      const response = await fetch('/api/student/submit-help-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: data.message,
          urgency: data.urgency,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setShowSuccessDialog(true)
      } else {
        setSubmissionError(result.error || 'Failed to submit help request')
      }
    } catch (error: any) {
      console.error('Error submitting help request:', error)
      setSubmissionError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false)
    router.push('/student')
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Optimized Header */}
        <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-blue-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between py-4 sm:py-6">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl shadow-lg">
                  <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Request Help
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">We're here to support you</p>
                </div>
              </div>
              <ClientWrapper>
                <Button onClick={() => router.push('/student')} variant="outline" size="sm" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Home</span>
                </Button>
              </ClientWrapper>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {submissionError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-800">Unable to send request</h3>
                  <p className="text-sm text-red-700 mt-1">{submissionError}</p>
                </div>
              </div>
            </div>
          )}

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader className="p-6 pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Tell Us How We Can Help
              </CardTitle>
              <CardDescription className="text-gray-600">
                Share what's on your mind. We're here to listen and support you.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="space-y-3">
                  <Label htmlFor="urgency" className="text-sm font-medium text-gray-700">How urgent is this?</Label>
                  <Select onValueChange={(value) => setValue('urgency', value as any)}>
                    <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Select priority level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="py-2">
                        <div>
                          <div className="font-medium">Low Priority</div>
                          <div className="text-xs text-gray-500">I can wait for a response</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="py-2">
                        <div>
                          <div className="font-medium">Medium Priority</div>
                          <div className="text-xs text-gray-500">I'd like help soon</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="py-2">
                        <div>
                          <div className="font-medium">High Priority</div>
                          <div className="text-xs text-gray-500">I need help right away</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.urgency && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.urgency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-sm font-medium text-gray-700">Tell us what's going on</Label>
                  <textarea
                    id="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                    placeholder="Share what's happening and how we can help you...\n\nExamples:\n• I'm feeling overwhelmed with schoolwork\n• Someone is bothering me\n• I'm having trouble at home\n• I need someone to talk to\n• I'm worried about a friend"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Sending your message...
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4 mr-2" />
                      Send Help Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support Resources */}
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Heart className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-green-800">You're Not Alone</h3>
                </div>
                <div className="space-y-2 text-sm text-green-700">
                  <p>• Asking for help shows courage</p>
                  <p>• Your feelings matter</p>
                  <p>• Caring adults are here to support you</p>
                  <p>• Every problem has a solution</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Shield className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-purple-800">Safe & Confidential</h3>
                </div>
                <div className="space-y-2 text-sm text-purple-700">
                  <p>• Your identity is protected</p>
                  <p>• Messages are secure and private</p>
                  <p>• Only trained staff will respond</p>
                  <p>• No judgment, only support</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Notice */}
          <Card className="mt-6 bg-gradient-to-r from-red-50 to-orange-50 border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="text-center">
                <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-3">
                  Emergency Situations
                </h3>
                <p className="text-red-700 text-sm mb-4">
                  If you're in immediate danger or having thoughts of hurting yourself or others, 
                  please contact emergency services (911) or speak to a trusted adult right away.
                </p>
                <div className="p-3 bg-red-100 rounded-lg">
                  <p className="text-red-800 font-medium text-sm">Crisis Hotline: 988 (Suicide & Crisis Lifeline)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-xl text-green-600">
              Help Request Sent!
            </DialogTitle>
            <DialogDescription className="text-center mt-2">
              Your message has been received and a trusted adult will respond soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm text-center flex items-center justify-center gap-2">
                <Heart className="h-4 w-4" />
                Asking for help is a sign of strength.
              </p>
            </div>
            <ClientWrapper>
              <Button onClick={handleSuccessDialogClose} className="w-full" size="lg">
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
            </ClientWrapper>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
