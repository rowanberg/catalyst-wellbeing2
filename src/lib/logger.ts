/**
 * Environment-aware logging utility
 * Replaces console.log with conditional logging to improve production performance
 * 
 * Usage:
 * import { logger } from '@/lib/logger'
 * logger.debug('Debug message', { context })
 * logger.error('Error occurred', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  component?: string
  function?: string
  userId?: string
  [key: string]: any
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isTest = process.env.NODE_ENV === 'test'

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`
  }

  private shouldLog(level: LogLevel): boolean {
    // Never log in tests
    if (this.isTest) return false
    
    // Always log errors and warnings
    if (level === 'error' || level === 'warn') return true
    
    // Only log debug/info in development
    return this.isDevelopment
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails = error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error
    console.error(this.formatMessage('error', message, { ...context, error: errorDetails }))
  }

  // API-specific logging
  api(method: string, path: string, status: number, duration?: number): void {
    const message = `${method} ${path} - ${status}`
    const context = duration ? { duration: `${duration}ms` } : undefined
    
    if (status >= 500) {
      this.error(message, undefined, context)
    } else if (status >= 400) {
      this.warn(message, context)
    } else {
      this.info(message, context)
    }
  }

  // Performance logging
  perf(label: string, duration: number): void {
    if (duration > 1000) {
      this.warn(`Slow performance: ${label}`, { duration: `${duration}ms` })
    } else {
      this.debug(`Performance: ${label}`, { duration: `${duration}ms` })
    }
  }

  // Database query logging
  query(operation: string, table: string, duration: number, rowCount?: number): void {
    const context: LogContext = { 
      operation, 
      table, 
      duration: `${duration}ms` 
    }
    if (rowCount !== undefined) {
      context.rowCount = rowCount
    }
    
    if (duration > 500) {
      this.warn(`Slow query: ${operation} on ${table}`, context)
    } else {
      this.debug(`Query: ${operation} on ${table}`, context)
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports for direct usage
export const debug = logger.debug.bind(logger)
export const info = logger.info.bind(logger)
export const warn = logger.warn.bind(logger)
export const error = logger.error.bind(logger)
export const apiLog = logger.api.bind(logger)
export const perfLog = logger.perf.bind(logger)
export const queryLog = logger.query.bind(logger)
