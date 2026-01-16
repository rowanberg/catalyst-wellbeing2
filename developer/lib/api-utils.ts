import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Environment helpers
export function getDevSupabaseUrl(): string {
    return process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

export function getMainSupabaseUrl(): string {
    return process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
}

// Create admin clients
export function getDevSupabaseAdmin() {
    const url = getDevSupabaseUrl()
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Dev Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

export function getMainSupabaseAdmin() {
    const url = getMainSupabaseUrl()
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Main Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Token verification
export interface TokenPayload {
    sub: string
    aud: string
    app_id: string
    scopes: string[]
    iss: string
    iat: number
    exp?: number
    grant_type?: string
}

export function verifyAccessToken(request: NextRequest): {
    valid: boolean
    payload?: TokenPayload
    error?: string
} {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing or invalid authorization header' }
    }

    const token = authHeader.substring(7)
    try {
        const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
        const payload = jwt.verify(token, secret) as TokenPayload
        return { valid: true, payload }
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return { valid: false, error: 'Access token has expired' }
        }
        return { valid: false, error: 'Invalid access token' }
    }
}

export function hasScope(payload: TokenPayload | undefined, requiredScope: string): boolean {
    if (!payload) return false
    const scopes = payload.scopes || []
    return scopes.includes(requiredScope) || scopes.includes('*')
}

export function hasAnyScope(payload: TokenPayload | undefined, requiredScopes: string[]): boolean {
    if (!payload) return false
    return requiredScopes.some(scope => hasScope(payload, scope))
}

// Token generation
export function generateAccessToken(payload: any, expiresInSeconds: number = 3600): string {
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
    return jwt.sign(payload, secret, { expiresIn: expiresInSeconds, algorithm: 'HS256' })
}

export function generateRefreshToken(): string {
    return `cw_rt_${crypto.randomBytes(32).toString('hex')}`
}

export function generateAuthCode(): string {
    return `cw_ac_${crypto.randomBytes(32).toString('hex')}`
}

export function generateApiKey(): string {
    return `cw_ak_${crypto.randomBytes(32).toString('hex')}`
}

export function generateClientId(): string {
    return `cw_${crypto.randomBytes(12).toString('hex')}`
}

export function generateClientSecret(): string {
    return `cw_sk_${crypto.randomBytes(32).toString('hex')}`
}

export function generateWebhookSecret(): string {
    return `whsec_${crypto.randomBytes(24).toString('hex')}`
}

// Hashing
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const useSalt = salt || crypto.randomBytes(16).toString('hex')
    const hash = crypto.pbkdf2Sync(password, useSalt, 10000, 64, 'sha512').toString('hex')
    return { hash, salt: useSalt }
}

// PKCE
export function verifyCodeChallenge(verifier: string, challenge: string, method: string): boolean {
    if (method === 'S256') {
        const hash = crypto.createHash('sha256').update(verifier).digest('base64url')
        return hash === challenge
    }
    return verifier === challenge
}

// Rate limiting
export interface RateLimitResult {
    allowed: boolean
    remaining: number
    reset: number
    limit: number
}

export async function checkRateLimit(
    identifier: string,
    limit: number = 100,
    windowSeconds: number = 60
): Promise<RateLimitResult> {
    // In production, use Redis
    // This is a simplified in-memory version
    // TODO: Implement proper rate limiting with Redis
    return {
        allowed: true,
        remaining: limit,
        reset: Math.floor(Date.now() / 1000) + windowSeconds,
        limit
    }
}

// API Response helpers
export function successResponse(data: any, status: number = 200) {
    return Response.json(data, { status })
}

export function errorResponse(
    error: string,
    error_description: string,
    status: number = 400
) {
    return Response.json({ error, error_description }, { status })
}

// Logging
export async function logApiRequest(
    admin: any,
    applicationId: string,
    userId: string,
    endpoint: string,
    method: string,
    status: number,
    responseTimeMs?: number
) {
    try {
        await admin.from('api_request_logs').insert({
            application_id: applicationId,
            user_id: userId,
            endpoint,
            method,
            response_status: status,
            response_time_ms: responseTimeMs
        })
    } catch (error) {
        console.error('Failed to log API request:', error)
    }
}

// Date helpers
export function toISOString(date?: Date): string {
    return (date || new Date()).toISOString()
}

export function addHours(hours: number, date?: Date): Date {
    const d = date ? new Date(date) : new Date()
    d.setHours(d.getHours() + hours)
    return d
}

export function addDays(days: number, date?: Date): Date {
    const d = date ? new Date(date) : new Date()
    d.setDate(d.getDate() + days)
    return d
}

// IP helpers
export function getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
}

// Validation helpers
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}
