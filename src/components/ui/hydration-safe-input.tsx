'use client'

import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface HydrationSafeInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  suppressExtensionWarnings?: boolean
}

/**
 * Input component that handles hydration mismatches caused by browser extensions
 * like password managers and form fillers that add attributes like fdprocessedid
 */
export const HydrationSafeInput = forwardRef<HTMLInputElement, HydrationSafeInputProps>(
  ({ className, suppressExtensionWarnings = true, ...props }, ref) => {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
      setIsClient(true)
    }, [])

    return (
      <input
        ref={ref}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        suppressHydrationWarning={suppressExtensionWarnings}
        key={isClient ? `client-${props.name || 'input'}` : `server-${props.name || 'input'}`}
        {...props}
      />
    )
  }
)

HydrationSafeInput.displayName = "HydrationSafeInput"
