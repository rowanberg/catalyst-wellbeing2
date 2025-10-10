/**
 * Authentication and Role Validation Middleware
 * Provides secure role-based access control for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Types
export type UserRole = 'student' | 'parent' | 'teacher' | 'admin' | 'super_admin'

interface AuthContext {
  user: {
    id: string
    email: string
  }
  profile: {
    id: string
    role: UserRole
    school_id: string
    first_name: string
    last_name: string
  }
}

interface AuthMiddlewareConfig {
  requiredRole?: UserRole | UserRole[]
  requireSchoolMatch?: boolean
  allowSelfOnly?: boolean
  customValidator?: (context: AuthContext) => Promise<boolean>
}

// Error responses
const errorResponses = {
  unauthorized: () => NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  ),
  forbidden: () => NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  ),
  invalidToken: () => NextResponse.json(
    { error: 'Invalid or expired token' },
    { status: 401 }
  ),
  profileNotFound: () => NextResponse.json(
    { error: 'User profile not found' },
    { status: 404 }
  )
}

/**
 * Create authenticated Supabase client
 */
async function createAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

/**
 * Get authenticated user context
 */
async function getAuthContext(): Promise<AuthContext | null> {
  try {
    const supabase = await createAuthClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) return null
    
    // Get user profile with role and school info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()
    
    if (profileError || !profile) return null
    
    return {
      user: {
        id: user.id,
        email: user.email || ''
      },
      profile: {
        id: profile.id,
        role: profile.role as UserRole,
        school_id: profile.school_id,
        first_name: profile.first_name,
        last_name: profile.last_name
      }
    }
  } catch (error) {
    console.error('Auth context error:', error)
    return null
  }
}

/**
 * Validate user has required role(s)
 */
function hasRequiredRole(userRole: UserRole, requiredRoles: UserRole | UserRole[]): boolean {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles]
  return roles.includes(userRole)
}

/**
 * Main authentication middleware
 */
export async function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
  config: AuthMiddlewareConfig = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get authentication context
    const context = await getAuthContext()
    
    // Check if user is authenticated
    if (!context) {
      return errorResponses.unauthorized()
    }
    
    // Validate required role
    if (config.requiredRole) {
      if (!hasRequiredRole(context.profile.role, config.requiredRole)) {
        return errorResponses.forbidden()
      }
    }
    
    // Check school match if required
    if (config.requireSchoolMatch) {
      const targetSchoolId = request.nextUrl.searchParams.get('school_id')
      if (targetSchoolId && targetSchoolId !== context.profile.school_id) {
        return errorResponses.forbidden()
      }
    }
    
    // Check self-only access
    if (config.allowSelfOnly) {
      const targetUserId = request.nextUrl.searchParams.get('user_id') || 
                          request.nextUrl.pathname.split('/').pop()
      if (targetUserId && targetUserId !== context.user.id) {
        return errorResponses.forbidden()
      }
    }
    
    // Run custom validator if provided
    if (config.customValidator) {
      const isValid = await config.customValidator(context)
      if (!isValid) {
        return errorResponses.forbidden()
      }
    }
    
    // Add security headers
    const response = await handler(request, context)
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    return response
  }
}

/**
 * Role-specific middleware factories
 */
export const withStudentAuth = (
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) => withAuth(handler, { requiredRole: 'student' })

export const withParentAuth = (
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) => withAuth(handler, { requiredRole: 'parent' })

export const withTeacherAuth = (
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) => withAuth(handler, { requiredRole: 'teacher' })

export const withAdminAuth = (
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) => withAuth(handler, { requiredRole: 'admin' })

export const withSchoolStaffAuth = (
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) => withAuth(handler, { requiredRole: ['teacher', 'admin'] })

/**
 * CSRF token validation
 */
export async function validateCSRFToken(request: NextRequest): Promise<boolean> {
  const token = request.headers.get('X-CSRF-Token')
  const cookieToken = request.cookies.get('csrf_token')?.value
  
  if (!token || !cookieToken) return false
  
  // Use timing-safe comparison
  const encoder = new TextEncoder()
  const tokenBuffer = encoder.encode(token)
  const cookieBuffer = encoder.encode(cookieToken)
  
  if (tokenBuffer.length !== cookieBuffer.length) return false
  
  let result = 0
  for (let i = 0; i < tokenBuffer.length; i++) {
    result |= tokenBuffer[i] ^ cookieBuffer[i]
  }
  
  return result === 0
}

/**
 * Rate limiting tracker
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 60,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(identifier)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    })
    return true
  }
  
  if (record.count >= maxRequests) {
    return false
  }
  
  record.count++
  return true
}

/**
 * Input sanitization helper
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove any potential SQL injection attempts
    return input
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/xp_/g, '')
      .replace(/sp_/g, '')
      .trim()
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {}
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key])
    }
    return sanitized
  }
  
  return input
}
