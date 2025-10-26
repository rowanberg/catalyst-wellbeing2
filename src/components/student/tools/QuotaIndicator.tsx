'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, AlertCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface QuotaStatus {
  normalUsed: number
  normalTotal: number
  extraUsed: number
  extraTotal: number
  totalUsedToday: number
  nextResetTime: Date
}

export function QuotaIndicator() {
  const [quotaStatus, setQuotaStatus] = useState<QuotaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeUntilReset, setTimeUntilReset] = useState('')

  useEffect(() => {
    fetchQuotaStatus()
    const interval = setInterval(fetchQuotaStatus, 30000) // Refresh every 30 seconds
    
    // Listen for custom event to refresh immediately after sending a message
    const handleRefresh = () => {
      console.log('[QuotaIndicator] Manual refresh triggered')
      fetchQuotaStatus()
    }
    window.addEventListener('refresh-quota', handleRefresh)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('refresh-quota', handleRefresh)
    }
  }, [])

  useEffect(() => {
    if (quotaStatus?.nextResetTime) {
      const updateTimer = () => {
        const now = new Date()
        const reset = new Date(quotaStatus.nextResetTime)
        const diff = reset.getTime() - now.getTime()
        
        if (diff <= 0) {
          setTimeUntilReset('Resetting...')
          fetchQuotaStatus()
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeUntilReset(`${hours}h ${minutes}m`)
        }
      }
      
      updateTimer()
      const timer = setInterval(updateTimer, 60000) // Update every minute
      return () => clearInterval(timer)
    }
    return undefined
  }, [quotaStatus?.nextResetTime])

  const fetchQuotaStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('[QuotaIndicator] No session found')
        setError('No session')
        setLoading(false)
        return
      }

      console.log('[QuotaIndicator] Fetching quota status...')
      const response = await fetch('/api/chat/gemini-extended', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('[QuotaIndicator] Quota status received:', data)
        setQuotaStatus({
          ...data,
          nextResetTime: new Date(data.nextResetTime)
        })
        setError(null)
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('[QuotaIndicator] Failed to fetch:', response.status, errorData)
        setError(`Failed to load (${response.status})`)
      }
    } catch (error) {
      console.error('[QuotaIndicator] Error fetching quota status:', error)
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-xl p-4 border border-purple-300/30">
        <div className="flex items-center gap-2 text-purple-300">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-400 border-t-transparent" />
          <span className="text-sm">Loading quota...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="bg-red-500/20 backdrop-blur-xl rounded-xl p-4 border border-red-500/30">
        <div className="flex items-center gap-2 text-red-300">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    )
  }

  // No quota data
  if (!quotaStatus) {
    console.log('[QuotaIndicator] No quota status available')
    return null
  }

  const normalPercentage = (quotaStatus.normalUsed / quotaStatus.normalTotal) * 100
  const extraPercentage = (quotaStatus.extraUsed / quotaStatus.extraTotal) * 100
  const isUsingExtra = quotaStatus.normalUsed >= quotaStatus.normalTotal
  const allExhausted = quotaStatus.normalUsed >= quotaStatus.normalTotal && 
                       quotaStatus.extraUsed >= quotaStatus.extraTotal

  const remainingNormal = quotaStatus.normalTotal - quotaStatus.normalUsed
  const remainingExtra = quotaStatus.extraTotal - quotaStatus.extraUsed
  const totalRemaining = remainingNormal + remainingExtra

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.02] backdrop-blur-sm rounded-xl p-4 border border-white/[0.05] hover:border-white/[0.08] transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className={`w-4 h-4 ${
            allExhausted ? 'text-red-400' : 
            isUsingExtra ? 'text-amber-400' : 
            'text-emerald-400'
          }`} />
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">AI Quota</span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500">
          <Clock className="w-3 h-3" />
          <span>{timeUntilReset}</span>
        </div>
      </div>

      {/* Total Remaining */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-white mb-1">{totalRemaining}</div>
        <div className="text-[11px] text-gray-400">requests remaining today</div>
      </div>

      {/* Standard Quota */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-gray-300">Standard</span>
          </div>
          <span className="text-[11px] text-gray-400">{remainingNormal} / {quotaStatus.normalTotal}</span>
        </div>
        <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${100 - normalPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-emerald-500/80"
          />
        </div>
        <div className="text-[10px] text-gray-500 mt-1">Gemini 2.0 Flash</div>
      </div>

      {/* Extra Quota - Only show if standard is exhausted or extra is being used */}
      {(isUsingExtra || quotaStatus.extraUsed > 0) && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                <span className="text-[11px] font-medium text-gray-300">Extra</span>
              </div>
              <span className="text-[11px] text-gray-400">{remainingExtra} / {quotaStatus.extraTotal}</span>
            </div>
            <div className="h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${100 - extraPercentage}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-purple-500/80"
              />
            </div>
            <div className="text-[10px] text-gray-500 mt-1">Gemma-3 Models</div>
          </motion.div>
        </AnimatePresence>
      )}

      {/* Status Badge */}
      {allExhausted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-white/[0.05]"
        >
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">Quota exhausted • Resets at midnight</span>
          </div>
        </motion.div>
      )}

      {isUsingExtra && !allExhausted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-white/[0.05]"
        >
          <div className="flex items-center gap-2 text-purple-400">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[11px]">Using backup models</span>
          </div>
        </motion.div>
      )}

      {!isUsingExtra && !allExhausted && remainingNormal <= 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-white/[0.05]"
        >
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">{remainingNormal} standard remaining • 500 extra available</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
