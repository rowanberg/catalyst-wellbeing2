'use client'

// Advanced Performance Monitoring with Core Web Vitals
interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
  connectionType?: string
}

interface ErrorReport {
  message: string
  stack?: string
  filename?: string
  lineno?: number
  colno?: number
  timestamp: number
  url: string
  userAgent: string
  userId?: string
  sessionId?: string
  componentStack?: string
  errorBoundary?: boolean
}

interface ResourceTiming {
  name: string
  duration: number
  size?: number
  type: 'script' | 'stylesheet' | 'image' | 'fetch' | 'other'
  timestamp: number
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private errors: ErrorReport[] = []
  private resourceTimings: ResourceTiming[] = []
  private observers: PerformanceObserver[] = []
  private sessionId: string
  private userId?: string

  constructor() {
    this.sessionId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    this.setupCoreWebVitals()
    this.setupResourceTiming()
    this.setupNavigationTiming()
    this.setupErrorTracking()
    this.setupMemoryMonitoring()
    this.setupNetworkMonitoring()
    this.startPeriodicReporting()
  }

  private setupCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        
        this.recordMetric({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: this.getLCPRating(lastEntry.startTime),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connectionType: this.getConnectionType()
        })
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (e) {
        console.warn('[Performance] LCP observation not supported')
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidValue = (entry as any).processingStart - entry.startTime
          
          this.recordMetric({
            name: 'FID',
            value: fidValue,
            rating: this.getFIDRating(fidValue),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType()
          })
        }
      })

      try {
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)
      } catch (e) {
        console.warn('[Performance] FID observation not supported')
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0
      let clsEntries: any[] = []

      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            clsEntries.push(entry)
          }
        }
      })

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        this.observers.push(clsObserver)

        // Report CLS on page unload
        window.addEventListener('beforeunload', () => {
          this.recordMetric({
            name: 'CLS',
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType()
          })
        })
      } catch (e) {
        console.warn('[Performance] CLS observation not supported')
      }

      // First Contentful Paint (FCP)
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric({
            name: 'FCP',
            value: entry.startTime,
            rating: this.getFCPRating(entry.startTime),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType()
          })
        }
      })

      try {
        fcpObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(fcpObserver)
      } catch (e) {
        console.warn('[Performance] FCP observation not supported')
      }

      // Time to First Byte (TTFB)
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navEntry = entry as PerformanceNavigationTiming
          const ttfb = navEntry.responseStart - navEntry.requestStart

          this.recordMetric({
            name: 'TTFB',
            value: ttfb,
            rating: this.getTTFBRating(ttfb),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType()
          })
        }
      })

      try {
        navigationObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navigationObserver)
      } catch (e) {
        console.warn('[Performance] Navigation timing not supported')
      }
    }
  }

  private setupResourceTiming() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          this.resourceTimings.push({
            name: resource.name,
            duration: resource.duration,
            size: resource.transferSize || resource.encodedBodySize,
            type: this.getResourceType(resource.name),
            timestamp: Date.now()
          })
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.push(resourceObserver)
      } catch (e) {
        console.warn('[Performance] Resource timing not supported')
      }
    }
  }

  private setupNavigationTiming() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      if (navigation) {
        // DNS Lookup Time
        this.recordMetric({
          name: 'DNS',
          value: navigation.domainLookupEnd - navigation.domainLookupStart,
          rating: 'good', // DNS is typically fast
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })

        // TCP Connection Time
        this.recordMetric({
          name: 'TCP',
          value: navigation.connectEnd - navigation.connectStart,
          rating: 'good',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })

        // DOM Content Loaded
        this.recordMetric({
          name: 'DCL',
          value: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          rating: this.getDCLRating(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })

        // Page Load Complete
        this.recordMetric({
          name: 'Load',
          value: navigation.loadEventEnd - navigation.fetchStart,
          rating: this.getLoadRating(navigation.loadEventEnd - navigation.fetchStart),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        })
      }
    })
  }

  private setupErrorTracking() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId
      })
    })

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId
      })
    })

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        const target = event.target as HTMLElement
        this.recordError({
          message: `Resource failed to load: ${target.tagName}`,
          filename: (target as any).src || (target as any).href,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          userId: this.userId,
          sessionId: this.sessionId
        })
      }
    }, true)
  }

  private setupMemoryMonitoring() {
    // Memory monitoring disabled for better performance
  }

  private setupNetworkMonitoring() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      this.recordMetric({
        name: 'Network',
        value: connection.downlink || 0,
        rating: this.getNetworkRating(connection.downlink || 0),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: connection.effectiveType
      })

      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.recordMetric({
          name: 'NetworkChange',
          value: connection.downlink || 0,
          rating: this.getNetworkRating(connection.downlink || 0),
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connectionType: connection.effectiveType
        })
      })
    }
  }

  private startPeriodicReporting() {
    // Performance reporting disabled for better performance
    // Only send on page unload if needed
    window.addEventListener('beforeunload', () => {
      if (this.metrics.length > 0) {
        this.sendMetrics(true)
      }
    })
  }

  // Rating functions
  private getLCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
  }

  private getFIDRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor'
  }

  private getCLSRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor'
  }

  private getFCPRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 1800 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
  }

  private getTTFBRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor'
  }

  private getDCLRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 1500 ? 'good' : value <= 3000 ? 'needs-improvement' : 'poor'
  }

  private getLoadRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 2000 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor'
  }

  private getMemoryRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value <= 50 ? 'good' : value <= 100 ? 'needs-improvement' : 'poor'
  }

  private getNetworkRating(value: number): 'good' | 'needs-improvement' | 'poor' {
    return value >= 1.5 ? 'good' : value >= 0.5 ? 'needs-improvement' : 'poor'
  }

  private getConnectionType(): string {
    if ('connection' in navigator) {
      return (navigator as any).connection?.effectiveType || 'unknown'
    }
    return 'unknown'
  }

  private getResourceType(url: string): 'script' | 'stylesheet' | 'image' | 'fetch' | 'other' {
    if (url.includes('.js')) return 'script'
    if (url.includes('.css')) return 'stylesheet'
    if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image'
    if (url.includes('/api/')) return 'fetch'
    return 'other'
  }

  // Public methods
  setUser(userId: string) {
    this.userId = userId
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    
    // Log poor performance
    if (metric.rating === 'poor') {
      console.warn(`[Performance] Poor ${metric.name}: ${metric.value}ms`)
    }
  }

  recordError(error: ErrorReport) {
    this.errors.push(error)
    console.error('[Performance] Error recorded:', error)
  }

  recordCustomTiming(name: string, startTime: number, endTime?: number) {
    const duration = (endTime || performance.now()) - startTime
    
    this.recordMetric({
      name: `Custom_${name}`,
      value: duration,
      rating: duration <= 100 ? 'good' : duration <= 500 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  getMetricsSummary() {
    const summary: Record<string, any> = {}
    
    for (const metric of this.metrics) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          count: 0,
          total: 0,
          min: Infinity,
          max: -Infinity,
          good: 0,
          needsImprovement: 0,
          poor: 0
        }
      }
      
      const s = summary[metric.name]
      s.count++
      s.total += metric.value
      s.min = Math.min(s.min, metric.value)
      s.max = Math.max(s.max, metric.value)
      
      if (metric.rating === 'good') s.good++
      else if (metric.rating === 'needs-improvement') s.needsImprovement++
      else s.poor++
    }
    
    // Calculate averages
    for (const key in summary) {
      summary[key].average = summary[key].total / summary[key].count
    }
    
    return summary
  }

  private async sendMetrics(synchronous = false) {
    if (this.metrics.length === 0 && this.errors.length === 0) return

    const payload = {
      sessionId: this.sessionId,
      userId: this.userId,
      metrics: [...this.metrics],
      errors: [...this.errors],
      resourceTimings: [...this.resourceTimings],
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    // Clear sent data
    this.metrics = []
    this.errors = []
    this.resourceTimings = []

    try {
      if (synchronous && 'sendBeacon' in navigator) {
        navigator.sendBeacon('/api/performance', JSON.stringify(payload))
      } else {
        await fetch('/api/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
    } catch (error) {
      console.error('[Performance] Failed to send metrics:', error)
      // Re-queue metrics on failure
      this.metrics.unshift(...payload.metrics)
      this.errors.unshift(...payload.errors)
    }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.sendMetrics(true)
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  if (typeof window !== 'undefined' && !performanceMonitor) {
    performanceMonitor = new PerformanceMonitor()
  }
  return performanceMonitor
}

// React hook for performance monitoring
export const usePerformanceMonitoring = () => {
  if (!performanceMonitor) {
    performanceMonitor = initializePerformanceMonitoring()
  }

  return {
    recordCustomTiming: (name: string, startTime: number, endTime?: number) => {
      performanceMonitor?.recordCustomTiming(name, startTime, endTime)
    },
    
    recordError: (error: Error, context?: any) => {
      performanceMonitor?.recordError({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        componentStack: context?.componentStack,
        errorBoundary: context?.errorBoundary
      })
    },
    
    setUser: (userId: string) => {
      performanceMonitor?.setUser(userId)
    },
    
    getMetricsSummary: () => {
      return performanceMonitor?.getMetricsSummary() || {}
    }
  }
}

// Performance timing decorator
export const withPerformanceTiming = <T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T => {
  return ((...args: any[]) => {
    const startTime = performance.now()
    const result = fn(...args)
    
    if (result instanceof Promise) {
      return result.finally(() => {
        performanceMonitor?.recordCustomTiming(name, startTime)
      })
    } else {
      performanceMonitor?.recordCustomTiming(name, startTime)
      return result
    }
  }) as T
}

// Component performance tracking HOC
export const withPerformanceTracking = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  const WrappedComponent = (props: P) => {
    const React = require('react')
    const startTime = React.useRef(performance.now())
    
    React.useEffect(() => {
      // Track component mount time
      performanceMonitor?.recordCustomTiming(`${componentName}_mount`, startTime.current)
      
      return () => {
        // Track component unmount
        performanceMonitor?.recordCustomTiming(`${componentName}_unmount`, performance.now())
      }
    }, [])
    
    return React.createElement(Component, props)
  }
  
  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`
  return WrappedComponent
}

export default {
  initializePerformanceMonitoring,
  usePerformanceMonitoring,
  withPerformanceTiming,
  withPerformanceTracking
}
