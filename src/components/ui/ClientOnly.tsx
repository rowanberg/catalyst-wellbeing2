'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

interface ClientOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function ClientOnlyComponent({ children, fallback = null }: ClientOnlyProps) {
  return <>{children}</>
}

export const ClientOnly = dynamic(() => Promise.resolve(ClientOnlyComponent), {
  ssr: false,
  loading: () => null
})

// Higher-order component for wrapping components that have hydration issues
export function withClientOnly<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ReactNode
) {
  return function ClientOnlyWrapper(props: P) {
    const DynamicComponent = dynamic(() => Promise.resolve(Component), {
      ssr: false,
      loading: () => <>{fallback}</>
    })
    
    return <DynamicComponent {...props} />
  }
}
