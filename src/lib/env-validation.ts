/**
 * Environment Variable Validation
 * Ensures all required environment variables are present and valid
 */

interface EnvConfig {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  NEXT_PUBLIC_APP_ENV: 'development' | 'production' | 'test'
  GEMINI_ENCRYPTION_KEY?: string
  ANALYZE?: 'true' | 'false'
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config: Partial<EnvConfig>
}

export function validateEnvironmentVariables(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const config: Partial<EnvConfig> = {}

  // Required variables
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }

  // Check required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`)
    } else if (value.includes('placeholder') || value.includes('your-') || value.includes('INSERT_')) {
      errors.push(`Environment variable ${key} appears to contain placeholder value`)
    } else {
      // Type assertion to handle the string assignment
      (config as any)[key] = value
    }
  }

  // Validate Supabase URL format
  if (config.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const url = new URL(config.NEXT_PUBLIC_SUPABASE_URL)
      if (!url.hostname.includes('supabase.co') && !url.hostname.includes('localhost')) {
        warnings.push('Supabase URL does not appear to be a standard Supabase URL')
      }
    } catch {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not a valid URL')
    }
  }

  // Validate environment
  const appEnv = process.env.NEXT_PUBLIC_APP_ENV as EnvConfig['NEXT_PUBLIC_APP_ENV']
  if (appEnv && ['development', 'production', 'test'].includes(appEnv)) {
    config.NEXT_PUBLIC_APP_ENV = appEnv
  } else {
    warnings.push('NEXT_PUBLIC_APP_ENV not set or invalid, defaulting to development')
    config.NEXT_PUBLIC_APP_ENV = 'development'
  }

  // Optional variables
  if (process.env.GEMINI_ENCRYPTION_KEY) {
    if (process.env.GEMINI_ENCRYPTION_KEY.length < 32) {
      warnings.push('GEMINI_ENCRYPTION_KEY should be at least 32 characters long')
    }
    config.GEMINI_ENCRYPTION_KEY = process.env.GEMINI_ENCRYPTION_KEY
  }

  if (process.env.ANALYZE) {
    config.ANALYZE = process.env.ANALYZE as 'true' | 'false'
  }

  // Production-specific validations
  if (config.NEXT_PUBLIC_APP_ENV === 'production') {
    if (!process.env.GEMINI_ENCRYPTION_KEY) {
      warnings.push('GEMINI_ENCRYPTION_KEY not set in production environment')
    }
    
    if (config.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      errors.push('Cannot use localhost Supabase URL in production')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  }
}

export function logEnvironmentStatus(): void {
  const validation = validateEnvironmentVariables()
  
  if (!validation.isValid) {
    console.error('❌ Environment validation failed:')
    validation.errors.forEach(error => console.error(`  - ${error}`))
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed in production')
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Environment warnings:')
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }

  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Environment variables validated successfully')
  }
}

// Auto-validate on import in development
if (process.env.NODE_ENV === 'development') {
  logEnvironmentStatus()
}
