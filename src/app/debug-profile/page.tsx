'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useToast } from '@/components/ui/toast'
import { Search, User, Database } from 'lucide-react'

export default function DebugProfilePage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { addToast } = useToast()

  const handleDebugProfile = async (e: React.FormEvent) => {
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
    setResults(null)

    try {
      const response = await fetch('/api/debug-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      setResults(data)

      if (response.ok) {
        addToast({
          type: 'success',
          title: 'Debug Complete',
          description: 'Profile debug information retrieved'
        })
      } else {
        addToast({
          type: 'error',
          title: 'Debug Failed',
          description: data.message || 'Failed to debug profile'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        description: 'An error occurred while debugging profile'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-4xl space-y-6">
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Database className="w-16 h-16 text-blue-400" />
            </div>
            <CardTitle className="text-2xl text-white">Profile Debug Tool</CardTitle>
            <CardDescription className="text-white/70">
              Debug user profile and authentication issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDebugProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to debug"
                  className="bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-2 focus:ring-blue-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" text="Debugging..." />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Debug Profile
                    </>
                  )}
                </Button>
                <Button 
                  type="button"
                  onClick={async () => {
                    if (!email) return;
                    setIsLoading(true);
                    try {
                      const response = await fetch('/api/fix-profile', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email }),
                      });
                      const data = await response.json();
                      setResults(data);
                      addToast({
                        type: response.ok ? 'success' : 'error',
                        title: response.ok ? 'Profile Fixed' : 'Fix Failed',
                        description: data.message
                      });
                    } catch (error) {
                      addToast({
                        type: 'error',
                        title: 'Error',
                        description: 'Failed to fix profile'
                      });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading || !email}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <User className="w-4 h-4 mr-2" />
                  Fix Profile
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {results && (
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-xl text-white">Debug Results</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-white/80 text-sm bg-black/20 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
