/**
 * Web Vitals Monitoring Component
 * Tracks Core Web Vitals and reports to console in development
 * Optional dependency - install with: npm install web-vitals
 */
'use client'

import { useEffect } from 'react'

interface WebVitalsMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

function reportWebVitals(metric: WebVitalsMetric) {
  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Web Vital: ${metric.name}`, {
      value: Math.round(metric.value),
      rating: metric.rating,
      delta: Math.round(metric.delta)
    })
  }

  // In production, you could send to analytics service
  // Example: analytics.track('web-vital', metric)
}

async function loadWebVitals() {
  try {
    // Use eval to avoid TypeScript checking the import at compile time
    const webVitals = await eval('import("web-vitals")')
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals
    getCLS(reportWebVitals)
    getFID(reportWebVitals)
    getFCP(reportWebVitals)
    getLCP(reportWebVitals)
    getTTFB(reportWebVitals)
  } catch {
    // web-vitals package not installed or available, skip silently
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals package not available (install with: npm install web-vitals)')
    }
  }
}

export default function WebVitals() {
  useEffect(() => {
    // Only load web-vitals in client environment
    if (typeof window !== 'undefined') {
      loadWebVitals()
    }
  }, [])

  return null // This component doesn't render anything
}
