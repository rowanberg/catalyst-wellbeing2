'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { Mail, RefreshCw, CheckCircle, AlertCircle, Bug, ExternalLink } from 'lucide-react'

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [emailType, setEmailType] = useState('signup')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { addToast } = useToast()

  const testEmail = async () => {
    if (!email) {
      addToast({
        type: 'error',
        title: 'Email Required',
        description: 'Please enter an email address to test'
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/debug/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: emailType })
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        addToast({
          type: 'success',
          title: 'Email Sent! 📧',
          description: `${data.emailType} email sent to ${email}`
        })
      } else {
        addToast({
          type: 'error',
          title: 'Email Failed',
          description: data.message || 'Failed to send email'
        })
      }
    } catch (error) {
      console.error('Email test error:', error)
      setResult({
        success: false,
        message: 'Network error - check console for details',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      addToast({
        type: 'error',
        title: 'Network Error',
        description: 'Failed to connect to email service'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Bug className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Email Delivery Debug Tool</h1>
          <p className="text-white/70">Test and troubleshoot email sending functionality</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Test Form */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Test Email Sending
              </CardTitle>
              <CardDescription className="text-white/70">
                Send test emails to debug delivery issues
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Email Input */}
              <div className="space-y-2">
                <Label className="text-white">Email Address</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@gmail.com"
                  className="bg-white/5 border-white/20 text-white placeholder-white/50"
                />
              </div>

              {/* Email Type */}
              <div className="space-y-2">
                <Label className="text-white">Email Type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="signup">Signup Confirmation</SelectItem>
                    <SelectItem value="recovery">Password Reset</SelectItem>
                    <SelectItem value="magiclink">Magic Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Test Button */}
              <Button
                onClick={testEmail}
                disabled={isLoading || !email}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending Test Email...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </>
                )}
              </Button>

              {/* Quick Tips */}
              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                <h4 className="text-white font-medium mb-2">💡 Quick Tips</h4>
                <ul className="text-white/80 text-sm space-y-1">
                  <li>• Check spam/junk folder first</li>
                  <li>• Try different email providers (Gmail, Yahoo)</li>
                  <li>• Wait up to 5 minutes for delivery</li>
                  <li>• Check Supabase Auth logs for errors</li>
                </ul>
              </div>

            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                {result?.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : result && !result.success ? (
                  <AlertCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Mail className="w-5 h-5" />
                )}
                Test Results
              </CardTitle>
              <CardDescription className="text-white/70">
                Email delivery status and debugging information
              </CardDescription>
            </CardHeader>
            <CardContent>
              
              {!result ? (
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">No test results yet. Send a test email to see results here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Status */}
                  <div className={`p-4 rounded-lg border ${
                    result.success 
                      ? 'bg-green-500/20 border-green-400/30' 
                      : 'bg-red-500/20 border-red-400/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {result.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={`font-medium ${
                        result.success ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {result.success ? 'Success!' : 'Failed'}
                      </span>
                    </div>
                    <p className={`text-sm ${
                      result.success ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {result.message}
                    </p>
                  </div>

                  {/* Development Link */}
                  {result.success && result.data?.devLink && (
                    <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                      <h4 className="text-yellow-300 font-medium mb-2">🔗 Development Link</h4>
                      <p className="text-yellow-200 text-sm mb-2">
                        For testing purposes, you can use this direct link:
                      </p>
                      <a 
                        href={result.data.devLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-yellow-300 hover:text-yellow-200 text-sm underline"
                      >
                        Open Confirmation Link
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Instructions */}
                  {result.instructions && (
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                      <h4 className="text-blue-300 font-medium mb-2">📋 Next Steps</h4>
                      <ul className="text-blue-200 text-sm space-y-1">
                        {result.instructions.map((instruction: string, index: number) => (
                          <li key={index}>• {instruction}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Troubleshooting */}
                  {result.troubleshooting && (
                    <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-4">
                      <h4 className="text-orange-300 font-medium mb-2">🔧 Troubleshooting</h4>
                      
                      {result.troubleshooting.commonCauses && (
                        <div className="mb-3">
                          <p className="text-orange-200 text-sm font-medium mb-1">Common Causes:</p>
                          <ul className="text-orange-200 text-sm space-y-1">
                            {result.troubleshooting.commonCauses.map((cause: string, index: number) => (
                              <li key={index}>• {cause}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {result.troubleshooting.solutions && (
                        <div>
                          <p className="text-orange-200 text-sm font-medium mb-1">Solutions:</p>
                          <ul className="text-orange-200 text-sm space-y-1">
                            {result.troubleshooting.solutions.map((solution: string, index: number) => (
                              <li key={index}>• {solution}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Raw Data */}
                  {result.error && (
                    <details className="bg-gray-500/20 border border-gray-400/30 rounded-lg p-4">
                      <summary className="text-gray-300 font-medium cursor-pointer">
                        🔍 Technical Details
                      </summary>
                      <pre className="text-gray-200 text-xs mt-2 overflow-auto">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </details>
                  )}

                </div>
              )}

            </CardContent>
          </Card>

        </div>

        {/* Common Issues */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 mt-8">
          <CardHeader>
            <CardTitle className="text-white">🚨 Common Email Issues & Solutions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <h4 className="text-white font-medium">Most Common Issues:</h4>
                <div className="space-y-3">
                  <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3">
                    <h5 className="text-red-300 font-medium text-sm">Emails in Spam Folder</h5>
                    <p className="text-red-200 text-xs">Check spam, junk, and promotions folders</p>
                  </div>
                  <div className="bg-orange-500/20 border border-orange-400/30 rounded-lg p-3">
                    <h5 className="text-orange-300 font-medium text-sm">Supabase Rate Limiting</h5>
                    <p className="text-orange-200 text-xs">Free tier: 3 emails/hour limit</p>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-3">
                    <h5 className="text-yellow-300 font-medium text-sm">SMTP Not Configured</h5>
                    <p className="text-yellow-200 text-xs">Default Supabase email has limitations</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-medium">Quick Solutions:</h4>
                <div className="space-y-3">
                  <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-3">
                    <h5 className="text-green-300 font-medium text-sm">Try Different Email</h5>
                    <p className="text-green-200 text-xs">Test with Gmail, Yahoo, or personal email</p>
                  </div>
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                    <h5 className="text-blue-300 font-medium text-sm">Configure Custom SMTP</h5>
                    <p className="text-blue-200 text-xs">Use Gmail, SendGrid, or Resend for reliability</p>
                  </div>
                  <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-3">
                    <h5 className="text-purple-300 font-medium text-sm">Check Supabase Logs</h5>
                    <p className="text-purple-200 text-xs">Auth logs show email delivery status</p>
                  </div>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
