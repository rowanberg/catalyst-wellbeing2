// Toast functionality will be handled by our custom toast component

export interface AppError {
  code: string
  message: string
  details?: any
}

export class AuthError extends Error {
  code: string
  details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.details = details
  }
}

export class ValidationError extends Error {
  code: string
  details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.details = details
  }
}

export class NetworkError extends Error {
  code: string
  details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'NetworkError'
    this.code = code
    this.details = details
  }
}

export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error in ${context || 'unknown context'}:`, error)

  if (error instanceof AuthError || error instanceof ValidationError || error instanceof NetworkError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details
    }
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      details: error
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error
  }
}

export function showErrorToast(error: AppError | string, title?: string) {
  // This will be handled by the toast context
  console.error(title || 'Error:', typeof error === 'string' ? error : error.message)
}

export function showSuccessToast(message: string, title?: string) {
  // This will be handled by the toast context
  console.log(title || 'Success:', message)
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return 'An unexpected error occurred'
}

export function isAuthError(error: unknown): boolean {
  return error instanceof AuthError || 
         (error instanceof Error && error.message.toLowerCase().includes('auth'))
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError ||
         (error instanceof Error && (
           error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('fetch') ||
           error.message.toLowerCase().includes('connection')
         ))
}
