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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Mobile-Optimized Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex flex-col space-y-4 py-4 sm:py-6">
              {/* Top row - Title and Icon */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-pink-500 flex-shrink-0" />
                  <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                      Request Help
                    </h1>
                    <p className="text-xs sm:text-base text-gray-600 mt-0.5 sm:mt-2 truncate">You're brave for reaching out - we're here to support you</p>
                  </div>
                </div>
                <ClientWrapper>
                  <Button onClick={() => router.push('/student')} variant="outline" className="flex-shrink-0 text-xs sm:text-sm py-2 sm:py-3 px-3 sm:px-4">
                    <Home className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Dashboard</span>
                    <span className="sm:hidden">Home</span>
                  </Button>
                </ClientWrapper>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-Optimized Main Content */}
        <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Mobile-Optimized Trust & Safety Banner */}
          <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {submissionError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 flex-shrink-0" />
                    <div className="ml-2 sm:ml-3 min-w-0">
                      <h3 className="text-xs sm:text-sm font-medium text-red-800">Submission Error</h3>
                      <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-700">
                        <p>{submissionError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center text-base sm:text-lg">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-orange-500 flex-shrink-0" />
                <span className="min-w-0">Tell Us How We Can Help</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Share what's on your mind. We're here to listen and support you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {submissionError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-700 text-sm">{submissionError}</p>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="urgency" className="text-base font-medium">How urgent is this?</Label>
                  <Select onValueChange={(value) => setValue('urgency', value as any)}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select how urgent this is for you" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low" className="py-3">
                        <div>
                          <div className="font-medium">Low Priority</div>
                          <div className="text-sm text-gray-500">I can wait for a response</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="py-3">
                        <div>
                          <div className="font-medium">Medium Priority</div>
                          <div className="text-sm text-gray-500">I'd like help soon</div>
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="py-3">
                        <div>
                          <div className="font-medium">High Priority</div>
                          <div className="text-sm text-gray-500">I need help right away</div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.urgency && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.urgency.message}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="message" className="text-base font-medium">Tell us what's going on</Label>
                  <textarea
                    id="message"
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                    placeholder="Share what's happening and how we can help you...\n\nExamples:\n• I'm feeling overwhelmed with schoolwork\n• Someone is bothering me\n• I'm having trouble at home\n• I need someone to talk to\n• I'm worried about a friend"
                    {...register('message')}
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.message.message}
                    </p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  disabled={isLoading} 
                  className="w-full h-12 text-base font-medium" 
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <Heart className="h-5 w-5 mr-2" />
                  You're Not Alone
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-green-700">
                  <p>• Asking for help shows courage and wisdom</p>
                  <p>• Your feelings and concerns matter</p>
                  <p>• Caring adults are here to support you</p>
                  <p>• Every problem has a solution</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Safe & Confidential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-purple-700">
                  <p>• Your identity is protected</p>
                  <p>• Messages are secure and private</p>
                  <p>• Only trained staff will respond</p>
                  <p>• No judgment, only support</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Notice */}
          <Card className="mt-8 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-10 w-10 text-red-600 mx-auto mb-3" />
                <h3 className="text-xl font-semibold text-red-800 mb-3">
                  Emergency Situations
                </h3>
                <p className="text-red-700 max-w-2xl mx-auto">
                  If you're in immediate danger or having thoughts of hurting yourself or others, 
                  please contact emergency services (911) or speak to a trusted adult right away.
                </p>
                <div className="mt-4 p-3 bg-red-100 rounded-lg">
                  <p className="text-red-800 font-medium">Crisis Hotline: 988 (Suicide & Crisis Lifeline)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center text-2xl text-green-600">
              Help Request Sent Successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-base mt-2">
              Your message has been received and a trusted adult will respond soon.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm text-center">
                <Heart className="h-4 w-4 inline mr-1" />
                Remember: Asking for help is a sign of strength, not weakness.
              </p>
            </div>
            <div className="flex flex-col space-y-2">
              <ClientWrapper>
                <Button onClick={handleSuccessDialogClose} className="w-full" size="lg">
                  <Home className="h-4 w-4 mr-2" />
                  Return to Dashboard
                </Button>
              </ClientWrapper>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
