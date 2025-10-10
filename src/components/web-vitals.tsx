/**
 * Web Vitals Monitoring Component
 * Tracks Core Web Vitals and reports to console in development
 * Optional dependency - install with: npm install web-vitals
 */
'use client'

import React, { useEffect } from 'react'

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

  // Example: analytics.track('web-vital', metric)
}

async function loadWebVitals() {
  try {
    // Use dynamic import instead of eval for security - make web-vitals optional
    const webVitals = await import('web-vitals' as any).catch(() => null)
    if (!webVitals) {
      console.log('web-vitals package not installed')
      return
    }
    const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals
    getCLS(reportWebVitals)
    getFID(reportWebVitals)
    getFCP(reportWebVitals)
    getLCP(reportWebVitals)
    getTTFB(reportWebVitals)
  } catch (err) {
    // Web vitals not available in this environment
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vitals not available:', err)
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
