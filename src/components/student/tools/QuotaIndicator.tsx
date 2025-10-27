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
      className="relative overflow-hidden bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-2xl hover:shadow-emerald-500/10 transition-all duration-300"
    >
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-purple-500/5 to-pink-500/5 opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${
              allExhausted ? 'bg-red-500/20' : 
              isUsingExtra ? 'bg-amber-500/20' : 
              'bg-emerald-500/20'
            } backdrop-blur-sm`}>
              <Zap className={`w-4 h-4 ${
                allExhausted ? 'text-red-400' : 
                isUsingExtra ? 'text-amber-400' : 
                'text-emerald-400'
              }`} />
            </div>
            <div>
              <span className="text-xs font-semibold text-white tracking-wide">AI Quota</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] text-slate-400 font-medium">Resets in {timeUntilReset}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Remaining - Enhanced */}
        <div className="mb-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-4xl font-bold bg-gradient-to-br from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              {totalRemaining}
            </span>
            <span className="text-sm text-slate-400 font-medium">left</span>
          </div>
          <div className="text-xs text-slate-500 font-medium">AI requests remaining today</div>
        </div>

        {/* Standard Quota - Enhanced */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-lg shadow-emerald-500/50" />
              <span className="text-xs font-semibold text-slate-200">Standard Tier</span>
            </div>
            <span className="text-xs font-bold text-slate-300">{remainingNormal}<span className="text-slate-500 font-normal">/{quotaStatus.normalTotal}</span></span>
          </div>
          <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${100 - normalPercentage}%` }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-semibold text-emerald-400">Luminex Pro</span>
            </div>
            <span className="text-[9px] text-slate-500">Premium AI Model</span>
          </div>
        </div>

        {/* Extra Quota - Enhanced */}
        {(isUsingExtra || quotaStatus.extraUsed > 0) && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-4"
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 shadow-lg shadow-purple-500/50" />
                  <span className="text-xs font-semibold text-slate-200">Extra Tier</span>
                </div>
                <span className="text-xs font-bold text-slate-300">{remainingExtra}<span className="text-slate-500 font-normal">/{quotaStatus.extraTotal}</span></span>
              </div>
              <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - extraPercentage}%` }}
                  transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 shadow-lg shadow-purple-500/50"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                <div className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/20">
                  <span className="text-[10px] font-semibold text-purple-400">Luminex Lite</span>
                </div>
                <span className="text-[9px] text-slate-500">Backup AI Model</span>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Status Badge - Enhanced */}
        {allExhausted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-red-300">Quota exhausted • Resets at midnight</span>
            </div>
          </motion.div>
        )}

        {isUsingExtra && !allExhausted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-300">Using backup models</span>
            </div>
          </motion.div>
        )}

        {!isUsingExtra && !allExhausted && remainingNormal <= 5 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 pt-4 border-t border-slate-700/50"
          >
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-300">{remainingNormal} standard remaining • 500 extra available</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}
