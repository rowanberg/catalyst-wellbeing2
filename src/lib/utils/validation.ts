/**
 * Input validation utilities for security and data integrity
 * Prevents XSS, injection attacks, and malformed data
 */

/**
 * Sanitize HTML input by removing script tags and dangerous HTML
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .trim()
}

/**
 * Remove all HTML tags from input
 */
export function stripHtml(input: string): string {
  if (!input || typeof input !== 'string') return ''
  return input.replace(/<[^>]*>/g, '').trim()
}

/**
 * Validate email format (RFC 5322 simplified)
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validate phone number (international format)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false
  
  // Accepts: +1234567890, (123) 456-7890, 123-456-7890, etc.
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') return ''
  
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
    .replace(/\.\.+/g, '.') // Remove directory traversal
    .replace(/^\.+/, '') // Remove leading dots
    .slice(0, 255) // Limit length
}

/**
 * Validate numeric input with optional range
 */
export function validateNumber(
  value: any,
  options?: { min?: number; max?: number; integer?: boolean }
): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(num) || !isFinite(num)) return false
  
  if (options?.integer && !Number.isInteger(num)) return false
  if (options?.min !== undefined && num < options.min) return false
  if (options?.max !== undefined && num > options.max) return false
  
  return true
}

/**
 * Sanitize JSON input - parse safely
 */
export function sanitizeJson<T = any>(input: string): T | null {
  if (!input || typeof input !== 'string') return null
  
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  options: { min?: number; max?: number }
): boolean {
  if (!value || typeof value !== 'string') return false
  
  const length = value.length
  if (options.min !== undefined && length < options.min) return false
  if (options.max !== undefined && length > options.max) return false
  
  return true
}

/**
 * Sanitize SQL-like input (basic protection)
 */
export function sanitizeSqlInput(input: string): string {
  if (!input || typeof input !== 'string') return ''
  
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comments
    .trim()
}

/**
 * Validate UUID format
 */
export function validateUuid(uuid: string): boolean {
  if (!uuid || typeof uuid !== 'string') return false
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = {} as T
  const dangerousKeys = ['__proto__', 'constructor', 'prototype']
  
  for (const [key, value] of Object.entries(obj)) {
    if (!dangerousKeys.includes(key)) {
      sanitized[key as keyof T] = value
    }
  }
  
  return sanitized
}

/**
 * Validate date string (ISO 8601 format)
 */
export function validateDate(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false
  
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

/**
 * Rate limit helper - check if action is within limit
 */
export function isWithinRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  storage: Map<string, { count: number; resetAt: number }> = new Map()
): boolean {
  const now = Date.now()
  const record = storage.get(key)
  
  if (!record || now > record.resetAt) {
    storage.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  
  if (record.count >= maxAttempts) {
    return false
  }
  
  record.count++
  return true
}
