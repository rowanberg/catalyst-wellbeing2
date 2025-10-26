/**
 * Performance Utilities for Catalyst Wells
 * 
 * Helpers for:
 * - Memoization patterns
 * - Lazy loading
 * - Component optimization
 * - 60 FPS rendering
 */

import { memo, useMemo, useCallback, lazy, Suspense, ComponentType } from 'react'
import type { ReactNode } from 'react'

/**
 * Memoized list renderer
 * Prevents unnecessary re-renders for large lists
 */
export function useMemoizedList<T>(
  items: T[],
  dependencies: any[] = []
): T[] {
  return useMemo(() => items, [items, ...dependencies])
}

/**
 * Memoized filter function
 * For search/filter operations on lists
 */
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  dependencies: any[] = []
): T[] {
  return useMemo(
    () => items.filter(filterFn),
    [items, filterFn, ...dependencies]
  )
}

/**
 * Debounced callback
 * For search inputs and expensive operations
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  return useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout
      return (...args: Parameters<T>) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => callback(...args), delay)
      }
    })() as T,
    [callback, delay]
  )
}

/**
 * Lazy component loader with loading state
 */
interface LazyLoadOptions {
  fallback?: ReactNode
  delay?: number
}

export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {}
) {
  const { fallback = <LoadingSpinner />, delay = 0 } = options
  
  const LazyComponent = lazy(() => {
    if (delay > 0) {
      return new Promise<{ default: T }>((resolve) => {
        setTimeout(() => {
          importFn().then(module => resolve(module))
        }, delay)
      })
    }
    return importFn()
  })
  
  return function LazyWrapper(props: any) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

/**
 * Default loading spinner
 */
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-4 border-slate-200 rounded-full" />
        <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin" />
      </div>
    </div>
  )
}

/**
 * Memoized component wrapper
 * Automatic shallow comparison
 */
export function memoComponent<P extends object>(
  Component: ComponentType<P>,
  displayName?: string
) {
  const MemoizedComponent = memo(Component)
  if (displayName) {
    MemoizedComponent.displayName = displayName
  }
  return MemoizedComponent
}

/**
 * Virtual scroll utility (for large lists)
 * Returns visible items based on scroll position
 */
interface VirtualScrollOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export function useVirtualScroll<T>(
  items: T[],
  scrollTop: number,
  options: VirtualScrollOptions
) {
  const { itemHeight, containerHeight, overscan = 3 } = options
  
  return useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )
    
    return {
      visibleItems: items.slice(startIndex, endIndex + 1),
      startIndex,
      endIndex,
      offsetTop: startIndex * itemHeight,
      totalHeight: items.length * itemHeight,
    }
  }, [items, scrollTop, itemHeight, containerHeight, overscan])
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  return useCallback(
    (node: HTMLElement | null) => {
      if (!node) return
      
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            callback()
          }
        },
        { threshold: 0.1, ...options }
      )
      
      observer.observe(node)
      
      return () => observer.disconnect()
    },
    [callback, options]
  )
}

/**
 * Request Animation Frame helper
 * For smooth 60fps animations
 */
export function useRAF(callback: () => void) {
  return useCallback(() => {
    requestAnimationFrame(callback)
  }, [callback])
}

/**
 * Prefetch utility for data loading
 */
export async function prefetchData<T>(
  fetchFn: () => Promise<T>,
  cacheKey: string,
  cache: Map<string, T>
): Promise<T> {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!
  }
  
  const data = await fetchFn()
  cache.set(cacheKey, data)
  return data
}

/**
 * Batch updates helper
 * Reduces layout thrashing
 */
export function batchUpdates(updates: Array<() => void>) {
  requestAnimationFrame(() => {
    updates.forEach(update => update())
  })
}

/**
 * Image preloader
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Component skeleton loader
 */
interface SkeletonProps {
  width?: string
  height?: string
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem',
  className,
  variant = 'rectangular'
}: SkeletonProps) {
  const variants = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  }
  
  return (
    <div
      className={`bg-slate-200 animate-pulse ${variants[variant]} ${className}`}
      style={{ width, height }}
    />
  )
}

/**
 * Loading state wrapper
 */
interface LoadingStateProps {
  loading: boolean
  error?: string | null
  children: ReactNode
  skeleton?: ReactNode
}

export function LoadingState({ 
  loading, 
  error, 
  children,
  skeleton = <LoadingSpinner />
}: LoadingStateProps) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-slate-600 text-sm">{error}</p>
      </div>
    )
  }
  
  if (loading) {
    return <>{skeleton}</>
  }
  
  return <>{children}</>
}
