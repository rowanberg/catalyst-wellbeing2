/**
 * PWA Install Prompt Component
 * Shows install banner when PWA can be installed
 */

'use client'

import React, { useState, useEffect } from 'react'
import { X, Download, Smartphone, CheckCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePWA } from '@/hooks/usePWA'

export function PWAInstallPrompt() {
  const { canInstall, isInstalled, install } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)
  
  useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed === 'true') {
      setDismissed(true)
    }
  }, [])
  
  const handleInstall = async () => {
    setInstalling(true)
    await install()
    setInstalling(false)
  }
  
  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }
  
  // Don't show if can't install, already installed, or dismissed
  if (!canInstall || isInstalled || dismissed) {
    return null
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
      >
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Smartphone className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Install Catalyst</h3>
                  <p className="text-white/90 text-sm">Access offline & get notifications</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="space-y-3 mb-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">Work Offline</p>
                  <p className="text-xs text-gray-500">Access your data without internet</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">Fast Loading</p>
                  <p className="text-xs text-gray-500">Instant app launch from home screen</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium">Stay Signed In</p>
                  <p className="text-xs text-gray-500">No need to login for 30 days</p>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                <span>{installing ? 'Installing...' : 'Install Now'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-4 py-2.5 text-gray-500 hover:text-gray-700 transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * PWA Update Banner
 * Shows when a new version is available
 */
export function PWAUpdateBanner() {
  const { updateAvailable, update } = usePWA()
  const [dismissed, setDismissed] = useState(false)
  
  if (!updateAvailable || dismissed) {
    return null
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white/20 rounded">
                <Download className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">
                A new version of Catalyst is available!
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={update}
                className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Update Now
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Offline Indicator
 * Shows when app is offline
 */
export function OfflineIndicator() {
  const { isOnline } = usePWA()
  const [show, setShow] = useState(false)
  
  useEffect(() => {
    if (!isOnline) {
      setShow(true)
      return // No cleanup needed when offline
    } else {
      // Delay hiding to show "Back Online" message
      const timer = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline])
  
  if (!show) {
    return null
  }
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 z-50"
      >
        <div className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 ${
          isOnline ? 'bg-green-500' : 'bg-gray-800'
        } text-white`}>
          <div className={`w-2 h-2 rounded-full ${
            isOnline ? 'bg-white' : 'bg-yellow-400 animate-pulse'
          }`} />
          <span className="text-sm font-medium">
            {isOnline ? 'Back Online' : 'Offline Mode'}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
