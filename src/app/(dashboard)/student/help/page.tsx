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
import { Home, AlertCircle, CheckCircle } from 'lucide-react'
import { useAppSelector } from '@/lib/redux/hooks'
import { supabase } from '@/lib/supabaseClient'

const helpRequestSchema = z.object({
  urgency: z.enum(['low', 'medium', 'high']),
  message: z.string().min(10, 'Please provide more details about how we can help'),
})

type HelpRequestForm = z.infer<typeof helpRequestSchema>

export default function RequestHelpPage() {
  const router = useRouter()
  const { user } = useAppSelector((state) => state.auth)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

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
    try {
      const { error } = await supabase
        .from('help_requests')
        .insert({
          student_id: user.id,
          message: data.message,
          urgency: data.urgency,
          status: 'pending',
        })

      if (!error) {
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error('Error submitting help request:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Help Request Sent</CardTitle>
            <CardDescription>Your request has been received and will be reviewed promptly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              A trusted adult will reach out to you soon. Remember, asking for help is a sign of strength.
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/student')} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Request Help</h1>
              <p className="text-gray-600">Reach out when you need support - we're here for you</p>
            </div>
            <Button onClick={() => router.push('/student')} variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-blue-600" />
              How can we help you?
            </CardTitle>
            <CardDescription>
              Your message will be sent to trusted adults who care about your well-being. 
              This is a safe space to ask for support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="urgency">How urgent is this?</Label>
                <Select onValueChange={(value) => setValue('urgency', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - I can wait for a response</SelectItem>
                    <SelectItem value="medium">Medium - I'd like help soon</SelectItem>
                    <SelectItem value="high">High - I need help right away</SelectItem>
                  </SelectContent>
                </Select>
                {errors.urgency && (
                  <p className="text-sm text-red-600">{errors.urgency.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Tell us what's going on</Label>
                <textarea
                  id="message"
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Share what's happening and how we can help you..."
                  {...register('message')}
                />
                {errors.message && (
                  <p className="text-sm text-red-600">{errors.message.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isLoading} className="w-full" size="lg">
                {isLoading ? 'Sending...' : 'Send Help Request'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Support Resources */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800">Remember</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-700">
              <p>• Asking for help is brave and shows maturity</p>
              <p>• Your feelings and concerns are valid and important</p>
              <p>• There are adults who care about you and want to help</p>
              <p>• You don't have to face challenges alone</p>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Notice */}
        <Card className="mt-6 bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                In Case of Emergency
              </h3>
              <p className="text-red-700 text-sm">
                If you're in immediate danger or having thoughts of hurting yourself or others, 
                please contact emergency services (911) or speak to a trusted adult right away.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
