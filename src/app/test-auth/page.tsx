'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TestAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session:', session, 'Error:', sessionError)

        // Check user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        console.log('User:', user, 'Error:', userError)

        // Test API call
        const apiResponse = await fetch('/api/debug/auth')
        const apiData = await apiResponse.json()
        console.log('API Response:', apiData)

        setAuthState({
          session: !!session,
          user: !!user,
          userId: user?.id,
          email: user?.email,
          sessionError: sessionError?.message,
          userError: userError?.message,
          apiData
        })
      } catch (error) {
        console.error('Auth check error:', error)
        setAuthState({ error: error instanceof Error ? error.message : 'Unknown error' })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) return <div className="p-8">Loading auth state...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(authState, null, 2)}
      </pre>
      
      <div className="mt-4 space-x-4">
        <button 
          onClick={() => supabase.auth.signOut()}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Sign Out
        </button>
        <button 
          onClick={() => window.location.href = '/login'}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
