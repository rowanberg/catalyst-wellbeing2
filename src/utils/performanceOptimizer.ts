'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Performance optimization utilities
class PerformanceOptimizer {
  private static instance: PerformanceOptimizer
  private observers: IntersectionObserver[] = []
  private rafCallbacks: Set<() => void> = new Set()
  private idleCallbacks: Set<() => void> = new Set()

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer()
    }
    return PerformanceOptimizer.instance
  }

  // Optimize images with lazy loading
  optimizeImages() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            if (img.dataset.src) {
              img.src = img.dataset.src
              img.removeAttribute('data-src')
              imageObserver.unobserve(img)
            }
          }
        })
      }, { rootMargin: '50px' })

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img)
      })

      this.observers.push(imageObserver)
    }
  }

  // Batch DOM operations
  batchDOMOperations(callback: () => void) {
    if (!this.rafCallbacks.has(callback)) {
      this.rafCallbacks.add(callback)
      requestAnimationFrame(() => {
        callback()
        this.rafCallbacks.delete(callback)
      })
    }
  }

  // Schedule low-priority tasks
  scheduleIdleTask(callback: () => void) {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        callback()
        this.idleCallbacks.delete(callback)
      })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        callback()
        this.idleCallbacks.delete(callback)
      }, 0)
    }
    this.idleCallbacks.add(callback)
  }

  // Preload critical resources
  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'fetch') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
      case 'fetch':
        link.as = 'fetch'
        link.crossOrigin = 'anonymous'
        break
    }
    
    document.head.appendChild(link)
  }

  // Optimize event listeners
  optimizeEventListeners() {
    // Passive event listeners for better scroll performance
    const passiveEvents = ['touchstart', 'touchmove', 'wheel', 'scroll']
    
    passiveEvents.forEach(eventType => {
      const originalAddEventListener = EventTarget.prototype.addEventListener
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (passiveEvents.includes(type) && typeof options !== 'object') {
          options = { passive: true }
        } else if (typeof options === 'object' && options !== null) {
          options.passive = true
        }
        return originalAddEventListener.call(this, type, listener, options)
      }
    })
  }

  // Memory cleanup
  cleanup() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
    this.rafCallbacks.clear()
    this.idleCallbacks.clear()
  }
}

// React hooks for performance optimization
export const usePerformanceOptimization = () => {
  const optimizer = useRef(PerformanceOptimizer.getInstance())

  useEffect(() => {
    const instance = optimizer.current
    
    // Initialize optimizations
    instance.optimizeImages()
    instance.optimizeEventListeners()
    
    return () => {
      instance.cleanup()
    }
  }, [])

  const batchDOMOperations = useCallback((callback: () => void) => {
    optimizer.current.batchDOMOperations(callback)
  }, [])

  const scheduleIdleTask = useCallback((callback: () => void) => {
    optimizer.current.scheduleIdleTask(callback)
  }, [])

  const preloadResource = useCallback((url: string, type: 'script' | 'style' | 'image' | 'fetch') => {
    optimizer.current.preloadResource(url, type)
  }, [])

  return {
    batchDOMOperations,
    scheduleIdleTask,
    preloadResource
  }
}

// Debounce hook for performance
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay]) as T
}

// Throttle hook for performance
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastRun = useRef(Date.now())

  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args)
      lastRun.current = Date.now()
    }
  }, [callback, delay]) as T
}

// Virtual scrolling for large lists
export const useVirtualScrolling = (
  items: any[],
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  )
  
  const visibleItems = items.slice(startIndex, endIndex)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll
  }
}

// Memoization with size limit
export const useMemoizedCache = <T>(maxSize: number = 100) => {
  const cache = useRef(new Map<string, T>())

  const get = useCallback((key: string): T | undefined => {
    return cache.current.get(key)
  }, [])

  const set = useCallback((key: string, value: T) => {
    if (cache.current.size >= maxSize) {
      // Remove oldest entry
      const firstKey = cache.current.keys().next().value
      if (firstKey !== undefined) {
        cache.current.delete(firstKey)
      }
    }
    cache.current.set(key, value)
  }, [maxSize])

  const clear = useCallback(() => {
    cache.current.clear()
  }, [])

  const has = useCallback((key: string): boolean => {
    return cache.current.has(key)
  }, [])

  return { get, set, clear, has }
}

// Bundle size optimization
export const useDynamicImport = <T>(
  importFunction: () => Promise<{ default: T }>,
  fallback?: T
) => {
  const [component, setComponent] = useState<T | undefined>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    importFunction()
      .then((module) => {
        if (!cancelled) {
          setComponent(module.default)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [importFunction])

  return { component, loading, error }
}

export default PerformanceOptimizer
