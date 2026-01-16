/**
 * ============================================================================
 * OAuth API Authentication Library
 * ============================================================================
 * Secure third-party app authentication with role-based permissions
 * 
 * Supports:
 * - OAuth 2.0 Bearer Tokens
 * - API Keys for server-to-server
 * - Role-based scope enforcement
 * - Rate limiting
 * - Request logging
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// ============================================================================
// Types
// ============================================================================

export type UserRole = 'student' | 'teacher' | 'admin' | 'parent' | 'super_admin'

export interface OAuthCredentials {
    type: 'bearer_token' | 'api_key'
    tokenOrKey: string
    applicationId: string
    applicationName: string
    scopes: string[]
    userId?: string
    profileId?: string
    userRole?: UserRole
    schoolId?: string
    rateLimit: {
        perMinute: number
        perDay: number
    }
}

export interface OAuthError {
    error: string
    error_description: string
    status: number
}

// ============================================================================
// Scope Definitions with Role Requirements
// ============================================================================

export const SCOPE_DEFINITIONS: Record<string, {
    description: string
    roles: UserRole[]
    readWrite: 'read' | 'write' | 'admin'
}> = {
    // Profile scopes
    'profile.read': { description: 'Read user profile info', roles: ['student', 'teacher', 'admin', 'parent', 'super_admin'], readWrite: 'read' },
    'profile.email': { description: 'Read user email', roles: ['student', 'teacher', 'admin', 'parent', 'super_admin'], readWrite: 'read' },
    'profile.write': { description: 'Update user profile', roles: ['student', 'teacher', 'admin', 'parent', 'super_admin'], readWrite: 'write' },

    // Student scopes
    'student.classes.read': { description: 'Read student enrolled classes', roles: ['student'], readWrite: 'read' },
    'student.grades.read': { description: 'Read student grades', roles: ['student'], readWrite: 'read' },
    'student.assignments.read': { description: 'Read student assignments', roles: ['student'], readWrite: 'read' },
    'student.assignments.write': { description: 'Submit assignments', roles: ['student'], readWrite: 'write' },
    'student.attendance.read': { description: 'Read student attendance', roles: ['student'], readWrite: 'read' },
    'student.wellbeing.read': { description: 'Read student wellbeing data', roles: ['student'], readWrite: 'read' },
    'student.wellbeing.write': { description: 'Submit wellbeing surveys', roles: ['student'], readWrite: 'write' },
    'student.achievements.read': { description: 'Read student achievements', roles: ['student'], readWrite: 'read' },

    // Teacher scopes
    'teacher.students.read': { description: 'Read teacher\'s student list', roles: ['teacher'], readWrite: 'read' },
    'teacher.grades.read': { description: 'Read grades for teacher\'s students', roles: ['teacher'], readWrite: 'read' },
    'teacher.grades.write': { description: 'Update student grades', roles: ['teacher'], readWrite: 'write' },
    'teacher.attendance.read': { description: 'Read attendance records', roles: ['teacher'], readWrite: 'read' },
    'teacher.attendance.write': { description: 'Mark student attendance', roles: ['teacher'], readWrite: 'write' },
    'teacher.assignments.read': { description: 'Read assignments', roles: ['teacher'], readWrite: 'read' },
    'teacher.assignments.write': { description: 'Create/update assignments', roles: ['teacher'], readWrite: 'write' },
    'teacher.communications.read': { description: 'Read communications', roles: ['teacher'], readWrite: 'read' },
    'teacher.communications.write': { description: 'Send communications', roles: ['teacher'], readWrite: 'write' },
    'teacher.analytics.read': { description: 'View class analytics', roles: ['teacher'], readWrite: 'read' },

    // Parent scopes
    'parent.children.read': { description: 'View children profiles', roles: ['parent'], readWrite: 'read' },
    'parent.grades.read': { description: 'View children grades', roles: ['parent'], readWrite: 'read' },
    'parent.attendance.read': { description: 'View children attendance', roles: ['parent'], readWrite: 'read' },
    'parent.communications.read': { description: 'Read school communications', roles: ['parent'], readWrite: 'read' },
    'parent.meetings.read': { description: 'View scheduled meetings', roles: ['parent'], readWrite: 'read' },
    'parent.meetings.write': { description: 'Schedule meetings', roles: ['parent'], readWrite: 'write' },

    // Admin scopes
    'admin.users.read': { description: 'View all users', roles: ['admin', 'super_admin'], readWrite: 'read' },
    'admin.users.write': { description: 'Manage users', roles: ['admin', 'super_admin'], readWrite: 'write' },
    'admin.school.read': { description: 'View school settings', roles: ['admin', 'super_admin'], readWrite: 'read' },
    'admin.school.write': { description: 'Manage school settings', roles: ['admin', 'super_admin'], readWrite: 'write' },
    'admin.reports.read': { description: 'View admin reports', roles: ['admin', 'super_admin'], readWrite: 'read' },
    'admin.aegisx.read': { description: 'View AegisX data', roles: ['admin', 'super_admin'], readWrite: 'read' },
    'admin.aegisx.write': { description: 'Manage AegisX', roles: ['admin', 'super_admin'], readWrite: 'write' },

    // General scopes
    'calendar.read': { description: 'Read calendar events', roles: ['student', 'teacher', 'admin', 'parent', 'super_admin'], readWrite: 'read' },
    'calendar.write': { description: 'Create calendar events', roles: ['teacher', 'admin', 'super_admin'], readWrite: 'write' },
    'notifications.read': { description: 'Read notifications', roles: ['student', 'teacher', 'admin', 'parent', 'super_admin'], readWrite: 'read' },
    'notifications.write': { description: 'Send notifications', roles: ['teacher', 'admin', 'super_admin'], readWrite: 'write' },
    'school.read': { description: 'View school info', roles: ['student', 'teacher', 'admin', 'parent', 'super_admin'], readWrite: 'read' },
}

// ============================================================================
// Supabase Admin Client
// ============================================================================

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

// ============================================================================
// Hashing Functions
// ============================================================================

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

function generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex')
}

// ============================================================================
// Rate Limiting
// ============================================================================

async function checkRateLimit(
    supabase: ReturnType<typeof getSupabaseAdmin>,
    identifier: string,
    identifierType: 'api_key' | 'access_token' | 'ip',
    limitPerMinute: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const windowStart = new Date()
    windowStart.setSeconds(0, 0) // Start of current minute

    // Upsert rate limit record
    const { data, error } = await supabase
        .from('api_rate_limits')
        .upsert({
            identifier,
            identifier_type: identifierType,
            window_start: windowStart.toISOString(),
            request_count: 1
        }, {
            onConflict: 'identifier,window_start'
        })
        .select('request_count')
        .single()

    if (error) {
        // If upsert failed, try to increment
        const { data: updated } = await supabase
            .rpc('increment_rate_limit', {
                p_identifier: identifier,
                p_window_start: windowStart.toISOString()
            })

        const count = updated || 1
        const allowed = count <= limitPerMinute

        return {
            allowed,
            remaining: Math.max(0, limitPerMinute - count),
            resetAt: new Date(windowStart.getTime() + 60 * 1000)
        }
    }

    const count = data?.request_count || 1
    const allowed = count <= limitPerMinute

    return {
        allowed,
        remaining: Math.max(0, limitPerMinute - count),
        resetAt: new Date(windowStart.getTime() + 60 * 1000)
    }
}

// ============================================================================
// Token Validation
// ============================================================================

async function validateBearerToken(token: string): Promise<OAuthCredentials | OAuthError> {
    const supabase = getSupabaseAdmin()
    const tokenHash = hashToken(token)

    const { data: tokenData, error } = await supabase
        .from('oauth_access_tokens')
        .select(`
      id,
      scopes,
      expires_at,
      revoked,
      user_id,
      profile_id,
      application:oauth_applications (
        id,
        name,
        client_id,
        is_active,
        rate_limit_per_minute,
        rate_limit_per_day
      )
    `)
        .eq('token_hash', tokenHash)
        .single()

    if (error || !tokenData) {
        return {
            error: 'invalid_token',
            error_description: 'The access token is invalid or has been revoked',
            status: 401
        }
    }

    // Check if token is revoked
    if (tokenData.revoked) {
        return {
            error: 'invalid_token',
            error_description: 'The access token has been revoked',
            status: 401
        }
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
        return {
            error: 'invalid_token',
            error_description: 'The access token has expired',
            status: 401
        }
    }

    // Check if app is active
    const app = tokenData.application as any
    if (!app?.is_active) {
        return {
            error: 'invalid_client',
            error_description: 'The application has been disabled',
            status: 401
        }
    }

    // Get user profile for role
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, role, school_id, first_name, last_name, email')
        .eq('id', tokenData.profile_id)
        .single()

    // Update last used
    await supabase
        .from('oauth_access_tokens')
        .update({
            last_used_at: new Date().toISOString(),
            use_count: (tokenData as any).use_count + 1
        })
        .eq('id', tokenData.id)

    return {
        type: 'bearer_token',
        tokenOrKey: token,
        applicationId: app.id,
        applicationName: app.name,
        scopes: tokenData.scopes,
        userId: tokenData.user_id,
        profileId: tokenData.profile_id,
        userRole: profile?.role as UserRole,
        schoolId: profile?.school_id,
        rateLimit: {
            perMinute: app.rate_limit_per_minute,
            perDay: app.rate_limit_per_day
        }
    }
}

async function validateApiKey(apiKey: string): Promise<OAuthCredentials | OAuthError> {
    const supabase = getSupabaseAdmin()
    const keyHash = hashToken(apiKey)

    const { data: keyData, error } = await supabase
        .from('api_keys')
        .select(`
      id,
      scopes,
      expires_at,
      revoked,
      is_active,
      ip_whitelist,
      rate_limit_per_minute,
      rate_limit_per_day,
      application:oauth_applications (
        id,
        name,
        client_id,
        is_active
      )
    `)
        .eq('key_hash', keyHash)
        .single()

    if (error || !keyData) {
        return {
            error: 'invalid_api_key',
            error_description: 'The API key is invalid',
            status: 401
        }
    }

    // Check if key is revoked or inactive
    if (keyData.revoked || !keyData.is_active) {
        return {
            error: 'invalid_api_key',
            error_description: 'The API key has been revoked or disabled',
            status: 401
        }
    }

    // Check expiration
    if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
        return {
            error: 'invalid_api_key',
            error_description: 'The API key has expired',
            status: 401
        }
    }

    const app = keyData.application as any
    if (!app?.is_active) {
        return {
            error: 'invalid_client',
            error_description: 'The application has been disabled',
            status: 401
        }
    }

    // Update last used
    await supabase
        .from('api_keys')
        .update({
            last_used_at: new Date().toISOString(),
            use_count: (keyData as any).use_count + 1
        })
        .eq('id', keyData.id)

    return {
        type: 'api_key',
        tokenOrKey: apiKey,
        applicationId: app.id,
        applicationName: app.name,
        scopes: keyData.scopes,
        rateLimit: {
            perMinute: keyData.rate_limit_per_minute,
            perDay: keyData.rate_limit_per_day
        }
    }
}

// ============================================================================
// Main Authentication Function
// ============================================================================

export async function authenticateOAuthRequest(
    request: NextRequest,
    requiredScopes: string[] = []
): Promise<OAuthCredentials | OAuthError> {
    const authHeader = request.headers.get('authorization')
    const apiKeyHeader = request.headers.get('x-api-key')

    let credentials: OAuthCredentials | OAuthError

    // Check for Bearer token
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7)
        credentials = await validateBearerToken(token)
    }
    // Check for API key
    else if (apiKeyHeader) {
        credentials = await validateApiKey(apiKeyHeader)
    }
    // No authentication provided
    else {
        return {
            error: 'invalid_request',
            error_description: 'No authentication credentials provided. Use Bearer token or X-API-Key header.',
            status: 401
        }
    }

    // If validation failed, return error
    if ('error' in credentials) {
        return credentials
    }

    // Check rate limit
    const supabase = getSupabaseAdmin()
    const identifier = hashToken(credentials.tokenOrKey)
    const rateCheck = await checkRateLimit(
        supabase,
        identifier,
        credentials.type === 'bearer_token' ? 'access_token' : 'api_key',
        credentials.rateLimit.perMinute
    )

    if (!rateCheck.allowed) {
        return {
            error: 'rate_limit_exceeded',
            error_description: `Rate limit exceeded. Try again at ${rateCheck.resetAt.toISOString()}`,
            status: 429
        }
    }

    // Check required scopes
    if (requiredScopes.length > 0) {
        const hasAllScopes = requiredScopes.every(scope =>
            credentials.scopes.includes(scope)
        )

        if (!hasAllScopes) {
            const missingScopes = requiredScopes.filter(s => !credentials.scopes.includes(s))
            return {
                error: 'insufficient_scope',
                error_description: `Missing required scopes: ${missingScopes.join(', ')}`,
                status: 403
            }
        }
    }

    // Check if scopes are valid for user's role (only for bearer tokens)
    if (credentials.type === 'bearer_token' && credentials.userRole) {
        for (const scope of credentials.scopes) {
            const scopeDef = SCOPE_DEFINITIONS[scope]
            if (scopeDef && !scopeDef.roles.includes(credentials.userRole)) {
                return {
                    error: 'invalid_scope',
                    error_description: `Scope "${scope}" is not valid for role "${credentials.userRole}"`,
                    status: 403
                }
            }
        }
    }

    return credentials
}

// ============================================================================
// Scope Checking Helpers
// ============================================================================

export function hasScope(credentials: OAuthCredentials, scope: string): boolean {
    return credentials.scopes.includes(scope)
}

export function hasAnyScope(credentials: OAuthCredentials, scopes: string[]): boolean {
    return scopes.some(scope => credentials.scopes.includes(scope))
}

export function hasAllScopes(credentials: OAuthCredentials, scopes: string[]): boolean {
    return scopes.every(scope => credentials.scopes.includes(scope))
}

// ============================================================================
// Response Helpers
// ============================================================================

export function oauthErrorResponse(error: OAuthError): NextResponse {
    return NextResponse.json(
        {
            error: error.error,
            error_description: error.error_description
        },
        {
            status: error.status,
            headers: {
                'WWW-Authenticate': `Bearer error="${error.error}", error_description="${error.error_description}"`
            }
        }
    )
}

export function addRateLimitHeaders(
    response: NextResponse,
    limit: number,
    remaining: number,
    resetAt: Date
): NextResponse {
    response.headers.set('X-RateLimit-Limit', String(limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(Math.floor(resetAt.getTime() / 1000)))
    return response
}

// ============================================================================
// Token Generation
// ============================================================================

export async function generateAccessToken(
    applicationId: string,
    userId: string,
    profileId: string,
    scopes: string[],
    expiresInSeconds: number = 3600
): Promise<{ accessToken: string; expiresAt: Date }> {
    const supabase = getSupabaseAdmin()

    const accessToken = `cw_at_${generateSecureToken(32)}`
    const tokenHash = hashToken(accessToken)
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000)

    await supabase.from('oauth_access_tokens').insert({
        token_hash: tokenHash,
        application_id: applicationId,
        user_id: userId,
        profile_id: profileId,
        scopes,
        expires_at: expiresAt.toISOString()
    })

    return { accessToken, expiresAt }
}

export async function generateRefreshToken(
    accessTokenId: string,
    applicationId: string,
    userId: string,
    profileId: string,
    scopes: string[],
    expiresInDays: number = 30
): Promise<{ refreshToken: string; expiresAt: Date }> {
    const supabase = getSupabaseAdmin()

    const refreshToken = `cw_rt_${generateSecureToken(32)}`
    const tokenHash = hashToken(refreshToken)
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    await supabase.from('oauth_refresh_tokens').insert({
        token_hash: tokenHash,
        access_token_id: accessTokenId,
        application_id: applicationId,
        user_id: userId,
        profile_id: profileId,
        scopes,
        expires_at: expiresAt.toISOString()
    })

    return { refreshToken, expiresAt }
}

export async function generateApiKey(
    applicationId: string,
    name: string,
    scopes: string[],
    ipWhitelist?: string[],
    expiresAt?: Date
): Promise<{ apiKey: string; keyPrefix: string }> {
    const supabase = getSupabaseAdmin()

    const apiKey = `cw_live_${generateSecureToken(40)}`
    const keyHash = hashToken(apiKey)
    const keyPrefix = apiKey.slice(0, 12)

    await supabase.from('api_keys').insert({
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        application_id: applicationId,
        scopes,
        ip_whitelist: ipWhitelist,
        expires_at: expiresAt?.toISOString()
    })

    return { apiKey, keyPrefix }
}

// ============================================================================
// Token Revocation
// ============================================================================

export async function revokeAccessToken(tokenHash: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
        .from('oauth_access_tokens')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('token_hash', tokenHash)

    return !error
}

export async function revokeAllUserTokens(userId: string, applicationId?: string): Promise<number> {
    const supabase = getSupabaseAdmin()

    // First count the tokens to revoke
    let countQuery = supabase
        .from('oauth_access_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('revoked', false)

    if (applicationId) {
        countQuery = countQuery.eq('application_id', applicationId)
    }

    const { count } = await countQuery

    // Then revoke them
    let updateQuery = supabase
        .from('oauth_access_tokens')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('revoked', false)

    if (applicationId) {
        updateQuery = updateQuery.eq('application_id', applicationId)
    }

    await updateQuery

    return count || 0
}

export async function revokeApiKey(keyHash: string, reason?: string): Promise<boolean> {
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
        .from('api_keys')
        .update({
            revoked: true,
            revoked_at: new Date().toISOString(),
            revoked_reason: reason
        })
        .eq('key_hash', keyHash)

    return !error
}
