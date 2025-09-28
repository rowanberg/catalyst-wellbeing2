'use client'

import { ReactNode } from 'react'

interface ClientWrapperProps {
  children: ReactNode
}

/**
 * A wrapper component that ensures all children are rendered on the client side.
 * This helps resolve "Event handlers cannot be passed to Client Component props" errors.
 */
export function ClientWrapper({ children }: ClientWrapperProps) {
  return <>{children}</>
}
