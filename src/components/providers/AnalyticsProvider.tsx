'use client'

import React, { useEffect } from 'react'
import { initializeAnalytics, trackPageLoad } from '@/utils/analytics'
import { initializePerformanceMonitoring } from '@/utils/performanceMonitoring'

interface AnalyticsProviderProps {
  children: React.ReactNode
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  useEffect(() => {
    // Initialize analytics and performance monitoring
    if (typeof window !== 'undefined') {
      // Initialize analytics
      initializeAnalytics()
      
      // Initialize performance monitoring
      initializePerformanceMonitoring()
      
      // Track page load performance
      trackPageLoad()
      
      console.log('[Analytics] Analytics and performance monitoring initialized')
    }
  }, [])

  return <>{children}</>
}

export default AnalyticsProvider
