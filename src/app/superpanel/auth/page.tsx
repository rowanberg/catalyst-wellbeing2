'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SuperAdminAuth() {
  const [accessKey, setAccessKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Check if already authenticated via server-side session
    checkAuthentication()
  }, [])

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/superpanel/verify-key')
      const data = await response.json()
      
      if (data.valid) {
        router.push('/superpanel/dashboard')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Send key to server for verification (key never stored client-side)
      const response = await fetch('/api/superpanel/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ accessKey })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Server set secure HTTP-only cookie, redirect to dashboard
        router.push('/superpanel/dashboard')
      } else {
        // Invalid key
        setAttempts(prev => prev + 1)
        
        if (attempts >= 2) {
          alert('Multiple failed attempts detected. Access may be temporarily locked.')
        }
        
        setAccessKey('')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      alert('Authentication failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-purple-400/20 rounded-full"
            animate={{
              x: [0, Math.random() * 100, 0],
              y: [0, Math.random() * 100, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Neumorphic container */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/50">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <Shield className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Super Admin Access
            </h1>
            <p className="text-slate-400 text-sm">
              Enter the hexadecimal access key to continue
            </p>
          </div>

          {/* Warning */}
          {attempts > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-6"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">
                Invalid access key. {3 - attempts} attempts remaining.
              </span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Access Key (Hexadecimal)
              </label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  value={accessKey}
                  onChange={(e) => setAccessKey(e.target.value.toUpperCase())}
                  placeholder="Enter 42-character hex key..."
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 pr-12 font-mono text-sm"
                  maxLength={42}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Key format: 42 hexadecimal characters (0-9, A-F)
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || accessKey.length !== 42}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Authenticate
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500">
              Unauthorized access is strictly prohibited and monitored.
            </p>
          </div>
        </div>

        {/* Security notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-slate-400 text-xs">
            All access attempts are logged with IP address and timestamp.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
