'use client'

import React, { useEffect } from 'react'

interface ServiceWorkerProviderProps {
  children: React.ReactNode
}

export const ServiceWorkerProvider: React.FC<ServiceWorkerProviderProps> = ({ children }) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[SW] Service Worker registered successfully:', registration)
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  console.log('[SW] New version available')
                  // You could show a notification here
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error)
        })

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('[SW] Message from service worker:', event.data)
      })
    }
  }, [])

  return <>{children}</>
}

export default ServiceWorkerProvider
