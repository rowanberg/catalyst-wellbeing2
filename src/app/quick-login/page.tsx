'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

function CreateProfileForm({ onProfileCreated }: { onProfileCreated: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const response = await fetch('/api/create-admin-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, schoolName })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create profile')
        return
      }

      console.log('Profile created:', data)
      onProfileCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
      <h3 className="font-medium text-yellow-800 mb-2">Profile Missing</h3>
      <p className="text-sm text-yellow-700 mb-3">You're authenticated but don't have a profile. Create one now:</p>
      
      <form onSubmit={handleCreateProfile} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            required
          />
          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded text-sm"
            required
          />
        </div>
        <input
          type="text"
          placeholder="School Name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          required
        />
        
        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
        )}
        
        <button
          type="submit"
          disabled={creating}
          className="w-full py-2 px-4 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
        >
          {creating ? 'Creating Profile...' : 'Create Admin Profile'}
        </button>
      </form>
    </div>
  )
}

export default function QuickLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [authState, setAuthState] = useState<any>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError(error.message)
        return
      }

      console.log('Login successful:', data)
      
      // Test API call immediately after login
      const apiResponse = await fetch('/api/debug/auth')
      const apiData = await apiResponse.json()
      setAuthState(apiData)
      
      if (apiData.authenticated && apiData.profile?.role === 'admin') {
        router.push('/admin')
      } else {
        setError(`Login successful but role is: ${apiData.profile?.role || 'unknown'}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const checkCurrentAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const { data: { user } } = await supabase.auth.getUser()
      
      const apiResponse = await fetch('/api/debug/auth')
      const apiData = await apiResponse.json()
      
      setAuthState({
        session: !!session,
        user: !!user,
        userId: user?.id,
        email: user?.email,
        apiData
      })
    } catch (error) {
      console.error('Auth check error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-center">Quick Admin Login</h2>
          <p className="text-center text-gray-600 mt-2">Login to fix 401 errors</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {authState?.apiData?.authenticated && !authState?.apiData?.profile && (
          <CreateProfileForm onProfileCreated={() => checkCurrentAuth()} />
        )}
        
        <div className="space-y-4">
          <button
            onClick={checkCurrentAuth}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Check Current Auth State
          </button>
          
          <div className="text-center space-x-4">
            <a href="/register" className="text-blue-600 hover:text-blue-500">Register</a>
            <a href="/login" className="text-blue-600 hover:text-blue-500">Regular Login</a>
          </div>
        </div>
        
        {authState && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">Current Auth State:</h3>
            <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-64">
              {JSON.stringify(authState, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
