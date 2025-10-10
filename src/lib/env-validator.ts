/**
 * Environment Variable Validation Service
 * Ensures all required environment variables are present and valid
 * Prevents application startup with missing critical configuration
 */

type EnvironmentType = 'development' | 'test' | 'production'

interface EnvConfig {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY?: string // Only required server-side
  
  // Security Keys
  SUPER_ADMIN_SECRET_KEY?: string // Required for super admin access
  GEMINI_ENCRYPTION_KEY?: string // For AI features
  
  // Application Configuration
  NEXT_PUBLIC_APP_ENV?: EnvironmentType
  NEXT_PUBLIC_SITE_URL?: string
  NODE_ENV?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  environment: EnvironmentType
}

class EnvironmentValidator {
  private errors: string[] = []
  private warnings: string[] = []
  
  /**
   * Validate all environment variables
   */
  public validate(): ValidationResult {
    this.errors = []
    this.warnings = []
    
    const environment = this.getEnvironment()
    
    // Validate required variables
    this.validateSupabaseConfig()
    this.validateSecurityKeys(environment)
    this.validateAppConfig(environment)
    
    // Check for placeholder values
    this.checkForPlaceholders()
    
    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      environment
    }
  }
  
  /**
   * Get current environment type
   */
  private getEnvironment(): EnvironmentType {
    const env = process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'development'
    
    if (env === 'production' || env === 'test' || env === 'development') {
      return env
    }
    
    this.warnings.push(`Unknown environment: ${env}, defaulting to development`)
    return 'development'
  }
  
  /**
   * Validate Supabase configuration
   */
  private validateSupabaseConfig(): void {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
    } else if (!this.isValidUrl(url)) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    } else if (url.includes('your-project-ref')) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_URL contains placeholder value')
    }
    
    if (!anonKey) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
    } else if (anonKey.length < 30) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be invalid')
    } else if (anonKey.includes('your_supabase')) {
      this.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY contains placeholder value')
    }
    
    // Service role key is only required server-side
    if (typeof window === 'undefined') {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      if (!serviceKey) {
        this.warnings.push('SUPABASE_SERVICE_ROLE_KEY not found - admin features may not work')
      } else if (serviceKey.length < 30) {
        this.errors.push('SUPABASE_SERVICE_ROLE_KEY appears to be invalid')
      } else if (serviceKey.includes('your_supabase')) {
        this.errors.push('SUPABASE_SERVICE_ROLE_KEY contains placeholder value')
      }
    }
  }
  
  /**
   * Validate security keys
   */
  private validateSecurityKeys(environment: EnvironmentType): void {
    // Super admin key is critical in production
    const superAdminKey = process.env.SUPER_ADMIN_SECRET_KEY
    
    if (environment === 'production') {
      if (!superAdminKey) {
        this.errors.push('SUPER_ADMIN_SECRET_KEY is required in production')
      } else if (superAdminKey.length < 32) {
        this.errors.push('SUPER_ADMIN_SECRET_KEY must be at least 32 characters')
      }
    } else if (!superAdminKey) {
      this.warnings.push('SUPER_ADMIN_SECRET_KEY not set - using development key')
    }
    
    // Gemini encryption key for AI features
    const geminiKey = process.env.GEMINI_ENCRYPTION_KEY
    
    if (!geminiKey) {
      this.warnings.push('GEMINI_ENCRYPTION_KEY not found - AI features may be limited')
    }
  }
  
  /**
   * Validate application configuration
   */
  private validateAppConfig(environment: EnvironmentType): void {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
    
    if (environment === 'production' && !siteUrl) {
      this.errors.push('NEXT_PUBLIC_SITE_URL is required in production')
    } else if (siteUrl && !this.isValidUrl(siteUrl)) {
      this.errors.push('NEXT_PUBLIC_SITE_URL must be a valid URL')
    }
  }
  
  /**
   * Check for placeholder values
   */
  private checkForPlaceholders(): void {
    const envVars = process.env as Record<string, string>
    const placeholderPatterns = [
      'your_',
      'placeholder',
      'example',
      'TODO',
      'FIXME',
      'xxx',
      'dummy'
    ]
    
    for (const [key, value] of Object.entries(envVars)) {
      if (!value) continue
      
      for (const pattern of placeholderPatterns) {
        if (value.toLowerCase().includes(pattern.toLowerCase())) {
          this.warnings.push(`${key} may contain placeholder value: ${pattern}`)
          break
        }
      }
    }
  }
  
  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  /**
   * Format validation report
   */
  public formatReport(result: ValidationResult): string {
    const lines: string[] = []
    
    lines.push('🔒 Environment Variable Validation Report')
    lines.push('=========================================')
    lines.push(`Environment: ${result.environment}`)
    lines.push(`Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`)
    lines.push('')
    
    if (result.errors.length > 0) {
      lines.push('❌ ERRORS (Must Fix):')
      result.errors.forEach(error => {
        lines.push(`  • ${error}`)
      })
      lines.push('')
    }
    
    if (result.warnings.length > 0) {
      lines.push('⚠️ WARNINGS (Should Review):')
      result.warnings.forEach(warning => {
        lines.push(`  • ${warning}`)
      })
      lines.push('')
    }
    
    if (result.isValid && result.errors.length === 0 && result.warnings.length === 0) {
      lines.push('✅ All environment variables are properly configured!')
    }
    
    return lines.join('\n')
  }
}

// Export singleton instance
export const envValidator = new EnvironmentValidator()

/**
 * Validate environment on module load (server-side only)
 */
if (typeof window === 'undefined') {
  const result = envValidator.validate()
  
  if (!result.isValid) {
    console.error('\n' + envValidator.formatReport(result) + '\n')
    
    // In production, fail fast if environment is invalid
    if (result.environment === 'production') {
      throw new Error('Invalid environment configuration. Please check the errors above.')
    }
  } else if (result.warnings.length > 0) {
    console.warn('\n' + envValidator.formatReport(result) + '\n')
  }
}

/**
 * React hook for environment validation
 */
export function useEnvironmentValidation() {
  if (typeof window === 'undefined') {
    return { isValid: true, errors: [], warnings: [] }
  }
  
  // Client-side validation is limited
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  const errors: string[] = []
  
  if (!url || url.includes('placeholder')) {
    errors.push('Supabase URL not configured')
  }
  
  if (!anonKey || anonKey.includes('placeholder')) {
    errors.push('Supabase Anon Key not configured')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings: []
  }
}
