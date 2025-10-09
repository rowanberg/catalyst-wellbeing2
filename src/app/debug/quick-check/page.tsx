'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Bug } from 'lucide-react'

export default function QuickCheckPage() {
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runQuickCheck = async () => {
    setIsLoading(true)
    setResults(null)

    try {
      const response = await fetch('/api/debug/simple-test')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Quick check error:', error)
      setResults({
        success: false,
        message: 'Failed to run quick check',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runQuickCheck()
  }, [])

  const getStatusIcon = (status: string) => {
    if (status.includes('✅') || status.includes('Working')) {
      return <CheckCircle className="w-5 h-5 text-green-400" />
    } else if (status.includes('❌')) {
      return <XCircle className="w-5 h-5 text-red-400" />
    } else {
      return <AlertCircle className="w-5 h-5 text-yellow-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Bug className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Quick System Check</h1>
          <p className="text-white/70">Diagnose email and system configuration issues</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Test Button */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">System Diagnostics</CardTitle>
              <CardDescription className="text-white/70">
                Check environment variables and Supabase connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={runQuickCheck}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Running Diagnostics...
                  </>
                ) : (
                  <>
                    <Bug className="w-4 h-4 mr-2" />
                    Run Quick Check
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card className="bg-white/10 backdrop-blur-xl border border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Diagnostic Results</CardTitle>
              <CardDescription className="text-white/70">
                System status and configuration check
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!results ? (
                <div className="text-center py-8">
                  <Bug className="w-12 h-12 text-white/40 mx-auto mb-4" />
                  <p className="text-white/60">Click "Run Quick Check" to start diagnostics</p>
                </div>
              ) : (
                <div className="space-y-4">
                  
                  {/* Overall Status */}
                  <div className={`p-4 rounded-lg border ${
                    results.success 
                      ? 'bg-green-500/20 border-green-400/30' 
                      : 'bg-red-500/20 border-red-400/30'
                  }`}>
                    <div className="flex items-center gap-2">
                      {results.success ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                      <span className={`font-medium ${
                        results.success ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {results.success ? 'System Check Passed' : 'Issues Detected'}
                      </span>
                    </div>
                    <p className={`text-sm mt-1 ${
                      results.success ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {results.message}
                    </p>
                  </div>

                  {/* Environment Variables */}
                  {results.environment && (
                    <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4">
                      <h4 className="text-blue-300 font-medium mb-2">🔧 Environment Variables</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-blue-200 text-sm">Supabase URL</span>
                          {results.environment.supabaseUrl ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-200 text-sm">Supabase Anon Key</span>
                          {results.environment.supabaseAnonKey ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-200 text-sm">Supabase Service Key</span>
                          {results.environment.supabaseServiceKey ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-blue-200 text-sm">Site URL</span>
                          <span className="text-blue-200 text-xs">{results.environment.siteUrl}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Supabase Status */}
                  {results.supabase && (
                    <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg p-4">
                      <h4 className="text-purple-300 font-medium mb-2">🗄️ Supabase Connection</h4>
                      <div className="flex items-start gap-2">
                        {getStatusIcon(results.supabase.status)}
                        <div>
                          <p className="text-purple-200 text-sm">{results.supabase.status}</p>
                          {results.supabase.error && (
                            <p className="text-red-300 text-xs mt-1">{results.supabase.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {results.recommendations && (
                    <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4">
                      <h4 className="text-yellow-300 font-medium mb-2">💡 Recommendations</h4>
                      <ul className="space-y-1">
                        {results.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2 text-yellow-200 text-sm">
                            {getStatusIcon(rec)}
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <Card className="bg-white/10 backdrop-blur-xl border border-white/20 mt-8">
          <CardHeader>
            <CardTitle className="text-white">🚀 Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-green-500/20 border border-green-400/30 rounded-lg p-4 text-center">
                <h5 className="text-green-300 font-medium mb-2">✅ If All Green</h5>
                <p className="text-green-200 text-sm mb-3">Your system is configured correctly</p>
                <a 
                  href="/debug/email-test" 
                  className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Test Email Sending
                </a>
              </div>

              <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-lg p-4 text-center">
                <h5 className="text-yellow-300 font-medium mb-2">⚠️ If Issues Found</h5>
                <p className="text-yellow-200 text-sm mb-3">Check environment variables</p>
                <a 
                  href="/TROUBLESHOOTING-EMAIL-ISSUES.md" 
                  className="inline-block bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  View Guide
                </a>
              </div>

              <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 text-center">
                <h5 className="text-blue-300 font-medium mb-2">🔧 Need Help?</h5>
                <p className="text-blue-200 text-sm mb-3">Get detailed troubleshooting</p>
                <button 
                  onClick={runQuickCheck}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Re-run Check
                </button>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
