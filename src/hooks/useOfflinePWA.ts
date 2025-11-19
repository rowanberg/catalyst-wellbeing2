'use client'

import { useState, useEffect, useCallback } from 'react'

// PWA and offline detection hooks
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(true)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        // Trigger data sync when coming back online
        window.dispatchEvent(new CustomEvent('app:online'))
      }
      setWasOffline(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
      window.dispatchEvent(new CustomEvent('app:offline'))
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  return { isOnline, wasOffline }
}

// Service Worker registration and management
export const useServiceWorker = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      setRegistration(reg)
      setIsRegistered(true)

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setUpdateAvailable(true)
            }
          })
        }
      })

      console.log('[PWA] Service worker registered successfully')
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error)
    }
  }

  const updateServiceWorker = useCallback(async () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      window.location.reload()
    }
  }, [registration])

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    updateServiceWorker
  }
}

// PWA installation prompt
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false)
  const [installPrompt, setInstallPrompt] = useState<any>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setCanInstall(false)
      setInstallPrompt(null)
      console.log('[PWA] App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installPWA = useCallback(async () => {
    if (!installPrompt) return false

    try {
      const result = await installPrompt.prompt()
      console.log('[PWA] Install prompt result:', result.outcome)
      
      if (result.outcome === 'accepted') {
        setCanInstall(false)
        setInstallPrompt(null)
        return true
      }
    } catch (error) {
      console.error('[PWA] Install failed:', error)
    }
    
    return false
  }, [installPrompt])

  return {
    canInstall,
    installPWA
  }
}

// Background sync for offline actions
export const useBackgroundSync = () => {
  const [pendingActions, setPendingActions] = useState<any[]>([])

  const addPendingAction = useCallback((action: any) => {
    setPendingActions(prev => [...prev, { ...action, id: Date.now() }])
    
    // Store in localStorage for persistence
    const stored = localStorage.getItem('catalyst-pending-actions')
    const actions = stored ? JSON.parse(stored) : []
    actions.push({ ...action, id: Date.now() })
    localStorage.setItem('catalyst-pending-actions', JSON.stringify(actions))
    
    // Register background sync if supported
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        const syncManager = (registration as any).sync
        if (syncManager) {
          syncManager.register('background-sync')
        }
      }).catch(console.error)
    }
  }, [])

  const clearPendingActions = useCallback(() => {
    setPendingActions([])
    localStorage.removeItem('catalyst-pending-actions')
  }, [])

  useEffect(() => {
    // Load pending actions from localStorage
    const stored = localStorage.getItem('catalyst-pending-actions')
    if (stored) {
      setPendingActions(JSON.parse(stored))
    }

    // Listen for online event to process pending actions
    const handleOnline = () => {
      const stored = localStorage.getItem('catalyst-pending-actions')
      if (stored) {
        const actions = JSON.parse(stored)
        // Process pending actions
        actions.forEach((action: any) => {
          // Dispatch custom event for each pending action
          window.dispatchEvent(new CustomEvent('app:process-pending-action', { detail: action }))
        })
        clearPendingActions()
      }
    }

    window.addEventListener('app:online', handleOnline)
    return () => window.removeEventListener('app:online', handleOnline)
  }, [clearPendingActions])

  return {
    pendingActions,
    addPendingAction,
    clearPendingActions
  }
}

// Cache management
export const useCacheManagement = () => {
  const [cacheSize, setCacheSize] = useState(0)
  const [isClearing, setIsClearing] = useState(false)

  const getCacheSize = useCallback(async () => {
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys()
        let totalSize = 0
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          
          for (const request of requests) {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.blob()
              totalSize += blob.size
            }
          }
        }
        
        setCacheSize(totalSize)
        return totalSize
      } catch (error) {
        console.error('[PWA] Failed to calculate cache size:', error)
        return 0
      }
    }
    return 0
  }, [])

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      setIsClearing(true)
      try {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
        setCacheSize(0)
        console.log('[PWA] Cache cleared successfully')
        return true
      } catch (error) {
        console.error('[PWA] Failed to clear cache:', error)
        return false
      } finally {
        setIsClearing(false)
      }
    }
    return false
  }, [])

  useEffect(() => {
    getCacheSize()
  }, [getCacheSize])

  return {
    cacheSize,
    isClearing,
    getCacheSize,
    clearCache,
    formatSize: (bytes: number) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      if (bytes === 0) return '0 Bytes'
      const i = Math.floor(Math.log(bytes) / Math.log(1024))
      return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
    }
  }
}

// Push notifications
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = useCallback(async () => {
    if (!isSupported) return false

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      return permission === 'granted'
    } catch (error) {
      console.error('[PWA] Failed to request notification permission:', error)
      return false
    }
  }, [isSupported])

  const subscribeToPush = useCallback(async () => {
    if (!isSupported || permission !== 'granted') return null

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY
      })
      
      setSubscription(subscription)
      
      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })
      
      return subscription
    } catch (error) {
      console.error('[PWA] Failed to subscribe to push notifications:', error)
      return null
    }
  }, [isSupported, permission])

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    subscribeToPush
  }
}

// Complete PWA hook that combines all functionality
export const usePWA = () => {
  const offline = useOfflineStatus()
  const serviceWorker = useServiceWorker()
  const install = usePWAInstall()
  const backgroundSync = useBackgroundSync()
  const cache = useCacheManagement()
  const notifications = usePushNotifications()

  return {
    offline,
    serviceWorker,
    install,
    backgroundSync,
    cache,
    notifications,
    
    // Convenience methods
    isFullyOffline: !offline.isOnline,
    isPWAReady: serviceWorker.isRegistered && install.canInstall,
    hasOfflineCapabilities: serviceWorker.isSupported && serviceWorker.isRegistered
  }
}
