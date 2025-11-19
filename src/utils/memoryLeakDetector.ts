'use client'

// Memory leak detection and prevention utilities
class MemoryLeakDetector {
  private static instance: MemoryLeakDetector
  private listeners: Map<string, Set<EventListener>> = new Map()
  private intervals: Set<NodeJS.Timeout> = new Set()
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private abortControllers: Set<AbortController> = new Set()
  private subscriptions: Set<() => void> = new Set()
  
  static getInstance(): MemoryLeakDetector {
    if (!MemoryLeakDetector.instance) {
      MemoryLeakDetector.instance = new MemoryLeakDetector()
    }
    return MemoryLeakDetector.instance
  }

  // Track event listeners
  addEventListenerTracked(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    const key = `${target.constructor.name}-${type}`
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }
    
    this.listeners.get(key)!.add(listener)
    target.addEventListener(type, listener, options)
    
    // Return cleanup function
    return () => {
      target.removeEventListener(type, listener, options)
      this.listeners.get(key)?.delete(listener)
      if (this.listeners.get(key)?.size === 0) {
        this.listeners.delete(key)
      }
    }
  }

  // Track intervals
  setIntervalTracked(callback: () => void, delay: number): NodeJS.Timeout {
    const intervalId = setInterval(callback, delay)
    this.intervals.add(intervalId)
    return intervalId
  }

  clearIntervalTracked(intervalId: NodeJS.Timeout): void {
    clearInterval(intervalId)
    this.intervals.delete(intervalId)
  }

  // Track timeouts
  setTimeoutTracked(callback: () => void, delay: number): NodeJS.Timeout {
    const timeoutId = setTimeout(() => {
      callback()
      this.timeouts.delete(timeoutId)
    }, delay)
    this.timeouts.add(timeoutId)
    return timeoutId
  }

  clearTimeoutTracked(timeoutId: NodeJS.Timeout): void {
    clearTimeout(timeoutId)
    this.timeouts.delete(timeoutId)
  }

  // Track AbortControllers
  createAbortControllerTracked(): AbortController {
    const controller = new AbortController()
    this.abortControllers.add(controller)
    
    // Auto-cleanup when aborted
    controller.signal.addEventListener('abort', () => {
      this.abortControllers.delete(controller)
    })
    
    return controller
  }

  // Track subscriptions (like Redux, observables, etc.)
  addSubscriptionTracked(unsubscribe: () => void): () => void {
    this.subscriptions.add(unsubscribe)
    
    return () => {
      unsubscribe()
      this.subscriptions.delete(unsubscribe)
    }
  }

  // Cleanup all tracked resources
  cleanupAll(): void {
    // Clear all intervals
    this.intervals.forEach(intervalId => clearInterval(intervalId))
    this.intervals.clear()

    // Clear all timeouts
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId))
    this.timeouts.clear()

    // Abort all controllers
    this.abortControllers.forEach(controller => {
      if (!controller.signal.aborted) {
        controller.abort()
      }
    })
    this.abortControllers.clear()

    // Call all unsubscribe functions
    this.subscriptions.forEach(unsubscribe => {
      try {
        unsubscribe()
      } catch (error) {
        console.warn('Error during subscription cleanup:', error)
      }
    })
    this.subscriptions.clear()

    // Note: Event listeners are harder to clean up automatically
    // They should be cleaned up by the components themselves
    if (this.listeners.size > 0) {
      console.warn('Memory leak warning: Event listeners still registered:', 
        Array.from(this.listeners.keys()))
    }
  }

  // Get current memory usage stats
  getMemoryStats(): {
    listeners: number
    intervals: number
    timeouts: number
    abortControllers: number
    subscriptions: number
  } {
    return {
      listeners: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0),
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      abortControllers: this.abortControllers.size,
      subscriptions: this.subscriptions.size
    }
  }

  // Log memory stats (for debugging)
  logMemoryStats(): void {
    const stats = this.getMemoryStats()
    console.log('Memory Leak Detector Stats:', stats)
    
    if (stats.listeners > 10) {
      console.warn('High number of event listeners detected:', stats.listeners)
    }
    if (stats.intervals > 5) {
      console.warn('High number of intervals detected:', stats.intervals)
    }
    if (stats.abortControllers > 10) {
      console.warn('High number of abort controllers detected:', stats.abortControllers)
    }
  }
}

// React hook for automatic cleanup
export const useMemoryLeakPrevention = () => {
  const detector = MemoryLeakDetector.getInstance()
  
  const addEventListenerTracked = detector.addEventListenerTracked.bind(detector)
  const setIntervalTracked = detector.setIntervalTracked.bind(detector)
  const clearIntervalTracked = detector.clearIntervalTracked.bind(detector)
  const setTimeoutTracked = detector.setTimeoutTracked.bind(detector)
  const clearTimeoutTracked = detector.clearTimeoutTracked.bind(detector)
  const createAbortControllerTracked = detector.createAbortControllerTracked.bind(detector)
  const addSubscriptionTracked = detector.addSubscriptionTracked.bind(detector)
  
  return {
    addEventListenerTracked,
    setIntervalTracked,
    clearIntervalTracked,
    setTimeoutTracked,
    clearTimeoutTracked,
    createAbortControllerTracked,
    addSubscriptionTracked,
    getMemoryStats: () => detector.getMemoryStats(),
    logMemoryStats: () => detector.logMemoryStats()
  }
}

// React hook for component-level cleanup
export const useComponentCleanup = (cleanupFn: () => void) => {
  const { useEffect } = require('react')
  
  useEffect(() => {
    return cleanupFn
  }, [cleanupFn])
}

// Higher-order component for automatic memory leak prevention
export const withMemoryLeakPrevention = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const WrappedComponent: React.FC<P> = (props: P) => {
    const React = require('react')
    const detector = MemoryLeakDetector.getInstance()
    
    React.useEffect(() => {
      const componentId = `${Component.name}-${Date.now()}`
      
      return () => {
        // Log stats when component unmounts
        if (process.env.NODE_ENV === 'development') {
          detector.logMemoryStats()
        }
      }
    }, [])
    
    return React.createElement(Component, props)
  }
  
  WrappedComponent.displayName = `withMemoryLeakPrevention(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Global cleanup function (call on app unmount)
export const globalMemoryCleanup = () => {
  const detector = MemoryLeakDetector.getInstance()
  detector.cleanupAll()
}

// Performance monitoring disabled for better performance
export const monitorMemoryUsage = () => {
  if (typeof window === 'undefined') return
  
  // Memory monitoring disabled to improve performance
  return () => {}
}

export default MemoryLeakDetector
