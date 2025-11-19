'use client'

// Advanced Analytics and User Tracking System
interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  sessionId?: string
  userId?: string
  userRole?: string
}

interface UserSession {
  sessionId: string
  userId?: string
  userRole?: string
  startTime: number
  lastActivity: number
  pageViews: number
  events: AnalyticsEvent[]
  deviceInfo: {
    userAgent: string
    platform: string
    language: string
    timezone: string
    screenResolution: string
    viewport: string
  }
  performanceMetrics: {
    connectionType?: string
    memoryUsage?: number
    loadTime?: number
    renderTime?: number
  }
}

class AnalyticsManager {
  private session: UserSession | null = null
  private eventQueue: AnalyticsEvent[] = []
  private isOnline = true
  private flushInterval: NodeJS.Timeout | null = null
  private performanceObserver: PerformanceObserver | null = null

  constructor() {
    this.initializeSession()
    this.setupPerformanceTracking()
    this.setupOnlineOfflineTracking()
    this.startAutoFlush()
  }

  private initializeSession() {
    const sessionId = this.generateSessionId()
    
    this.session = {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: [],
      deviceInfo: this.getDeviceInfo(),
      performanceMetrics: {}
    }

    // Track session start
    this.track('session_start', {
      sessionId,
      deviceInfo: this.session.deviceInfo
    })
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
    }
  }

  private setupPerformanceTracking() {
    // Performance tracking disabled for better performance
    // All monitoring removed to reduce overhead
  }

  private setupOnlineOfflineTracking() {
    const handleOnline = () => {
      this.isOnline = true
      this.track('connectivity_change', { status: 'online' })
      this.flushEvents() // Flush queued events when back online
    }

    const handleOffline = () => {
      this.isOnline = false
      this.track('connectivity_change', { status: 'offline' })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
  }

  private startAutoFlush() {
    // Reduced flush frequency for better performance
    this.flushInterval = setInterval(() => {
      this.flushEvents()
    }, 120000) // Every 2 minutes instead of 30 seconds

    // Flush on page unload only
    window.addEventListener('beforeunload', () => {
      this.flushEvents(true) // Synchronous flush
    })
  }

  // Public methods
  setUser(userId: string, userRole: string, properties?: Record<string, any>) {
    if (this.session) {
      this.session.userId = userId
      this.session.userRole = userRole
    }

    this.track('user_identified', {
      userId,
      userRole,
      ...properties
    })
  }

  track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      sessionId: this.session?.sessionId,
      userId: this.session?.userId,
      userRole: this.session?.userRole
    }

    this.eventQueue.push(event)
    
    if (this.session) {
      this.session.events.push(event)
      this.session.lastActivity = Date.now()
    }

    // Auto-flush if queue gets too large (increased threshold)
    if (this.eventQueue.length >= 20) {
      this.flushEvents()
    }
  }

  page(pageName?: string, properties?: Record<string, any>) {
    if (this.session) {
      this.session.pageViews++
    }

    this.track('page_view', {
      page: pageName || document.title,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      ...properties
    })
  }

  timing(name: string, duration: number, properties?: Record<string, any>) {
    this.track('timing', {
      name,
      duration,
      ...properties
    })
  }

  error(error: Error, context?: Record<string, any>) {
    this.track('error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      url: window.location.href
    })
  }

  private async flushEvents(synchronous = false) {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    const payload = {
      events,
      session: this.session,
      timestamp: Date.now()
    }

    try {
      if (synchronous) {
        // Use sendBeacon for synchronous sending (on page unload)
        if ('sendBeacon' in navigator) {
          navigator.sendBeacon('/api/analytics', JSON.stringify(payload))
        }
      } else {
        // Regular async request
        if (this.isOnline) {
          await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
        } else {
          // Store in localStorage for later when back online
          const stored = localStorage.getItem('catalyst-analytics-queue')
          const queue = stored ? JSON.parse(stored) : []
          queue.push(payload)
          localStorage.setItem('catalyst-analytics-queue', JSON.stringify(queue))
        }
      }
    } catch (error) {
      console.error('[Analytics] Failed to send events:', error)
      // Re-queue events on failure
      this.eventQueue.unshift(...events)
    }
  }

  // Cleanup method
  destroy() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    this.flushEvents(true)
  }
}

// Global analytics instance
let analytics: AnalyticsManager | null = null

// Initialize analytics
export const initializeAnalytics = () => {
  if (typeof window !== 'undefined' && !analytics) {
    analytics = new AnalyticsManager()
  }
  return analytics
}

// Analytics hooks and utilities
export const useAnalytics = () => {
  if (!analytics) {
    analytics = initializeAnalytics()
  }

  return {
    track: (eventName: string, properties?: Record<string, any>) => {
      analytics?.track(eventName, properties)
    },
    
    page: (pageName?: string, properties?: Record<string, any>) => {
      analytics?.page(pageName, properties)
    },
    
    timing: (name: string, duration: number, properties?: Record<string, any>) => {
      analytics?.timing(name, duration, properties)
    },
    
    error: (error: Error, context?: Record<string, any>) => {
      analytics?.error(error, context)
    },
    
    setUser: (userId: string, userRole: string, properties?: Record<string, any>) => {
      analytics?.setUser(userId, userRole, properties)
    }
  }
}

// Performance tracking utilities
export const trackPageLoad = () => {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      analytics?.timing('page_load', navigation.loadEventEnd - navigation.fetchStart, {
        dns_time: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp_time: navigation.connectEnd - navigation.connectStart,
        request_time: navigation.responseStart - navigation.requestStart,
        response_time: navigation.responseEnd - navigation.responseStart,
        dom_processing: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        load_complete: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
      })
    })
  }
}

// User interaction tracking
export const trackUserInteraction = (element: HTMLElement, action: string) => {
  const rect = element.getBoundingClientRect()
  
  analytics?.track('user_interaction', {
    action,
    element: element.tagName.toLowerCase(),
    className: element.className,
    id: element.id,
    text: element.textContent?.slice(0, 100),
    position: {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    }
  })
}

// Form tracking
export const trackFormInteraction = (formElement: HTMLFormElement, action: 'start' | 'submit' | 'abandon') => {
  const formData = new FormData(formElement)
  const fields = Array.from(formData.keys())
  
  analytics?.track('form_interaction', {
    action,
    formId: formElement.id,
    formName: formElement.name,
    fieldCount: fields.length,
    fields: fields.slice(0, 10) // Limit for privacy
  })
}

// Error boundary integration
export const trackErrorBoundary = (error: Error, errorInfo: any) => {
  analytics?.track('error_boundary', {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    errorBoundary: true
  })
}

export default {
  initializeAnalytics,
  useAnalytics,
  trackPageLoad,
  trackUserInteraction,
  trackFormInteraction,
  trackErrorBoundary
}
