'use client'

import React, { useState, useEffect } from 'react'
import { useAnalytics } from '@/utils/analytics'
import { usePerformanceMonitoring } from '@/utils/performanceMonitoring'
import { useOfflineStatus, usePWA } from '@/hooks/useOfflinePWA'
import { useAccessibility } from '@/utils/accessibility'
import { Check, X, AlertCircle } from 'lucide-react'

interface TestResult {
  name: string
  status: 'pass' | 'fail' | 'warning'
  message: string
}

export const IntegrationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  // Test hooks
  const analytics = useAnalytics()
  const performance = usePerformanceMonitoring()
  const { isOnline } = useOfflineStatus()
  const pwa = usePWA()
  const accessibility = useAccessibility()

  const runTests = async () => {
    setIsRunning(true)
    const testResults: TestResult[] = []

    // Test Analytics
    try {
      analytics.track('test_event', { test: true })
      testResults.push({
        name: 'Analytics Tracking',
        status: 'pass',
        message: 'Analytics tracking is working'
      })
    } catch (error) {
      testResults.push({
        name: 'Analytics Tracking',
        status: 'fail',
        message: `Analytics failed: ${error}`
      })
    }

    // Test Performance Monitoring
    try {
      performance.recordCustomTiming('test_timing', 0, 100)
      testResults.push({
        name: 'Performance Monitoring',
        status: 'pass',
        message: 'Performance monitoring is working'
      })
    } catch (error) {
      testResults.push({
        name: 'Performance Monitoring',
        status: 'fail',
        message: `Performance monitoring failed: ${error}`
      })
    }

    // Test Offline Detection
    testResults.push({
      name: 'Offline Detection',
      status: 'pass',
      message: `Network status: ${isOnline ? 'Online' : 'Offline'}`
    })

    // Test PWA Features
    testResults.push({
      name: 'PWA Support',
      status: pwa.serviceWorker.isSupported ? 'pass' : 'warning',
      message: `Service Worker: ${pwa.serviceWorker.isSupported ? 'Supported' : 'Not supported'}`
    })

    testResults.push({
      name: 'PWA Installation',
      status: pwa.install.canInstall ? 'pass' : 'warning',
      message: `Install prompt: ${pwa.install.canInstall ? 'Available' : 'Not available'}`
    })

    // Test Accessibility
    try {
      accessibility.announce('Test announcement')
      testResults.push({
        name: 'Accessibility',
        status: 'pass',
        message: 'Screen reader announcements working'
      })
    } catch (error) {
      testResults.push({
        name: 'Accessibility',
        status: 'fail',
        message: `Accessibility failed: ${error}`
      })
    }

    // Test Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        testResults.push({
          name: 'Service Worker',
          status: registration ? 'pass' : 'warning',
          message: registration ? 'Service Worker registered' : 'Service Worker not registered'
        })
      } catch (error) {
        testResults.push({
          name: 'Service Worker',
          status: 'fail',
          message: `Service Worker check failed: ${error}`
        })
      }
    } else {
      testResults.push({
        name: 'Service Worker',
        status: 'warning',
        message: 'Service Worker not supported'
      })
    }

    // Test Local Storage
    try {
      localStorage.setItem('test', 'value')
      const value = localStorage.getItem('test')
      localStorage.removeItem('test')
      testResults.push({
        name: 'Local Storage',
        status: value === 'value' ? 'pass' : 'fail',
        message: value === 'value' ? 'Local Storage working' : 'Local Storage failed'
      })
    } catch (error) {
      testResults.push({
        name: 'Local Storage',
        status: 'fail',
        message: `Local Storage failed: ${error}`
      })
    }

    // Test Fetch API
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, events: [], errors: [] })
      })
      testResults.push({
        name: 'Analytics API',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'Analytics API responding' : `Analytics API failed: ${response.status}`
      })
    } catch (error) {
      testResults.push({
        name: 'Analytics API',
        status: 'fail',
        message: `Analytics API failed: ${error}`
      })
    }

    setResults(testResults)
    setIsRunning(false)
  }

  useEffect(() => {
    // Auto-run tests on mount
    runTests()
  }, [])

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return <Check className="h-4 w-4 text-green-500" />
      case 'fail':
        return <X className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'pass':
        return 'bg-green-50 border-green-200'
      case 'fail':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
    }
  }

  const passCount = results.filter(r => r.status === 'pass').length
  const failCount = results.filter(r => r.status === 'fail').length
  const warningCount = results.filter(r => r.status === 'warning').length

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Integration Test Results</h2>
          <button
            onClick={runTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-4 text-sm">
              <span className="text-green-600">✓ {passCount} Passed</span>
              <span className="text-red-600">✗ {failCount} Failed</span>
              <span className="text-yellow-600">⚠ {warningCount} Warnings</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{result.name}</h3>
                  <p className="text-sm text-gray-600">{result.message}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-gray-500">
            Click "Run Tests" to check integration status
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegrationTest
