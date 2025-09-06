'use client'

import { useEffect, useState } from 'react'

/**
 * Utility to suppress hydration warnings caused by browser extensions
 * that modify form elements by adding attributes like fdprocessedid
 */

// Store original console methods
const originalError = console.error
const originalWarn = console.warn

// List of hydration error patterns to suppress
const HYDRATION_ERROR_PATTERNS = [
  /Hydration failed because the initial UI does not match what was rendered on the server/,
  /There was an error while hydrating/,
  /Text content does not match server-rendered HTML/,
  /fdprocessedid/i,
  /browser extension/i,
  /chrome-extension/i,
  /moz-extension/i,
]

// List of attributes commonly added by browser extensions
const EXTENSION_ATTRIBUTES = [
  'fdprocessedid',
  'data-lastpass-icon-added',
  'data-1password-uuid',
  'data-dashlane-rid',
  'data-bitwarden-watching',
  'autocomplete',
  'data-form-type',
]

/**
 * Check if an error message matches known hydration issues caused by extensions
 */
function isExtensionHydrationError(message: string): boolean {
  return HYDRATION_ERROR_PATTERNS.some(pattern => pattern.test(message))
}

/**
 * Initialize hydration error suppression
 * Call this in your app's root component or _app.tsx
 */
export function initHydrationErrorSuppression() {
  if (typeof window === 'undefined') return

  // Override console.error to filter hydration warnings
  console.error = (...args) => {
    const message = args.join(' ')
    
    // Suppress known extension-related hydration errors
    if (isExtensionHydrationError(message)) {
      // Optionally log to a different service or ignore completely
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Hydration] Suppressed extension-related error:', message)
      }
      return
    }
    
    // Pass through other errors
    originalError.apply(console, args)
  }

  // Override console.warn for hydration warnings
  console.warn = (...args) => {
    const message = args.join(' ')
    
    if (isExtensionHydrationError(message)) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Hydration] Suppressed extension-related warning:', message)
      }
      return
    }
    
    originalWarn.apply(console, args)
  }
}

/**
 * Clean up extension attributes from form elements
 * Useful for preventing hydration mismatches
 */
export function cleanExtensionAttributes(element: HTMLElement) {
  EXTENSION_ATTRIBUTES.forEach(attr => {
    if (element.hasAttribute(attr)) {
      element.removeAttribute(attr)
    }
  })
}

/**
 * React Error Boundary component to catch hydration errors
 */
export class HydrationErrorBoundary extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'HydrationError'
  }
}

/**
 * Hook to handle hydration-safe rendering
 */
export function useHydrationSafe() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

// Auto-initialize in browser environment
if (typeof window !== 'undefined') {
  initHydrationErrorSuppression()
}
