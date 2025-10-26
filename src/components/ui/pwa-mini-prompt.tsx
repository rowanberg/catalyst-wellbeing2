'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWA } from '@/hooks/usePWA'

export function PWAMiniPrompt() {
  const { canInstall, isInstalled, install } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  
  useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = sessionStorage.getItem('pwa-mini-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
      return undefined
    }
    
    // Show prompt after a short delay
    if (canInstall && !isInstalled) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
    
    return undefined
  }, [canInstall, isInstalled])
  
  const handleInstall = async () => {
    await install()
    setShowPrompt(false)
  }
  
  const handleDismiss = () => {
    setDismissed(true)
    setShowPrompt(false)
    sessionStorage.setItem('pwa-mini-dismissed', 'true')
  }
  
  if (!canInstall || isInstalled || dismissed || !showPrompt) {
    return null
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto z-50 sm:w-[calc(100%-3rem)] sm:max-w-md"
        style={{ bottom: 'max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))' }}
      >
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm">
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate">Install Catalyst</p>
            <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate">Quick access & offline</p>
          </div>
          
          {/* Actions */}
          <button
            onClick={handleInstall}
            className="flex-shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-[11px] sm:text-xs font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 whitespace-nowrap"
          >
            Install
          </button>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
