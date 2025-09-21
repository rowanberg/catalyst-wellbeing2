'use client'

import { useEffect } from 'react'

/**
 * Provider component that initializes hydration error suppression
 * to handle browser extension interference with form elements
 */
export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress hydration warnings caused by browser extensions
    const originalError = console.error
    const originalWarn = console.warn

    // Patterns that indicate browser extension interference
    const extensionPatterns = [
      /Hydration failed because the initial UI does not match/,
      /There was an error while hydrating/,
      /Text content does not match server-rendered HTML/,
      /A tree hydrated but some attributes of the server rendered HTML didn't match/,
      /bis_register/i,
      /fdprocessedid/i,
      /__processed_[a-f0-9-]+__/i,
      /chrome-extension/i,
      /moz-extension/i,
      /browser extension/i,
      /data-windsurf-page-id/i,
      /data-windsurf-extension-id/i,
      /data-lastpass/i,
      /data-1p-/i,
      /grammarly/i,
    ]

    const isExtensionError = (message: string) => {
      return extensionPatterns.some(pattern => pattern.test(message))
    }

    console.error = (...args) => {
      const message = args.join(' ')
      if (isExtensionError(message)) {
        // Suppress extension-related hydration errors
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Hydration] Suppressed extension error:', message)
        }
        return
      }
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args.join(' ')
      if (isExtensionError(message)) {
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Hydration] Suppressed extension warning:', message)
        }
        return
      }
      originalWarn.apply(console, args)
    }

    // Cleanup function to restore original console methods
    return () => {
      console.error = originalError
      console.warn = originalWarn
    }
  }, [])

  return <>{children}</>
}
