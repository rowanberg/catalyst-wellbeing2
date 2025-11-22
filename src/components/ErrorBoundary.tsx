'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
  level?: 'page' | 'component' | 'critical'
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })

    // Log error details
    console.error('ErrorBoundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo)
  }

  private reportError = (error: Error, errorInfo: ErrorInfo) => {
    try {
      // Send error to monitoring service
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        errorId: this.state.errorId,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        level: this.props.level || 'component'
      }

      // Example: Send to your error tracking service
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // })

      console.warn('Error report generated:', errorReport)
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: ''
      })
    } else {
      // Max retries reached, redirect or show different message
      this.handleReload()
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/parent'
  }

  private renderErrorDetails = () => {
    if (!this.props.showDetails || !this.state.error) return null

    return (
      <details className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Technical Details
        </summary>
        <div className="space-y-2 text-xs font-mono">
          <div>
            <strong>Error ID:</strong> {this.state.errorId}
          </div>
          <div>
            <strong>Message:</strong> {this.state.error.message}
          </div>
          {this.state.error.stack && (
            <div>
              <strong>Stack Trace:</strong>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto max-h-32">
                {this.state.error.stack}
              </pre>
            </div>
          )}
        </div>
      </details>
    )
  }

  private renderComponentError = () => (
    <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-red-900 dark:text-red-100 text-lg">Component Error</CardTitle>
            <CardDescription className="text-red-700 dark:text-red-300">
              This section encountered an unexpected error
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-red-800 dark:text-red-200">
          We're sorry, but this component failed to load properly. You can try refreshing this section or continue using other parts of the application.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={this.handleRetry}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again ({this.maxRetries - this.retryCount} left)
          </Button>
        </div>

        {this.renderErrorDetails()}
      </CardContent>
    </Card>
  )

  private renderPageError = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 dark:border-red-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto p-3 bg-red-100 dark:bg-red-900/30 rounded-full w-fit mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100 text-xl">Page Error</CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            Something went wrong loading this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            We encountered an unexpected error. Please try refreshing the page or return to the home screen.
          </p>

          <div className="flex flex-col gap-2">
            <Button
              onClick={this.handleRetry}
              className="w-full"
              disabled={this.retryCount >= this.maxRetries}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {this.retryCount >= this.maxRetries ? 'Max Retries Reached' : `Try Again (${this.maxRetries - this.retryCount} left)`}
            </Button>

            <Button
              onClick={this.handleGoHome}
              variant="outline"
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home
            </Button>

            <Button
              onClick={this.handleReload}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
          </div>

          {this.renderErrorDetails()}
        </CardContent>
      </Card>
    </div>
  )

  private renderCriticalError = () => (
    <div className="min-h-screen bg-red-50 dark:bg-red-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg border-red-300 dark:border-red-700">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto p-4 bg-red-200 dark:bg-red-900/50 rounded-full w-fit mb-4">
            <Bug className="h-10 w-10 text-red-700 dark:text-red-300" />
          </div>
          <CardTitle className="text-red-900 dark:text-red-100 text-2xl">Critical Error</CardTitle>
          <CardDescription className="text-red-800 dark:text-red-200">
            The application encountered a critical error
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-red-700 dark:text-red-300 mb-2">
              We're sorry, but the application has encountered a critical error and needs to be restarted.
            </p>
            <p className="text-xs text-red-600 dark:text-red-400">
              Error ID: {this.state.errorId}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={this.handleReload}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Restart Application
            </Button>

            <Button
              onClick={this.handleGoHome}
              variant="outline"
              className="w-full border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Home Page
            </Button>
          </div>

          {this.renderErrorDetails()}
        </CardContent>
      </Card>
    </div>
  )

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Render based on error level
      switch (this.props.level) {
        case 'critical':
          return this.renderCriticalError()
        case 'page':
          return this.renderPageError()
        case 'component':
        default:
          return this.renderComponentError()
      }
    }

    return this.props.children
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Specialized error boundaries for different use cases
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="component" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary level="critical" showDetails={process.env.NODE_ENV === 'development'}>
      {children}
    </ErrorBoundary>
  )
}

export default ErrorBoundary
