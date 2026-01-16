import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Generate tokens
function generateAccessToken(payload: any, expiresInSeconds: number = 3600): string {
    const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
    return jwt.sign(payload, secret, { expiresIn: expiresInSeconds, algorithm: 'HS256' })
}

function generateRefreshToken(): string {
    return `cw_rt_${crypto.randomBytes(32).toString('hex')}`
}

// Hash tokens for storage
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// Verify PKCE code challenge
function verifyCodeChallenge(verifier: string, challenge: string, method: string): boolean {
    if (method === 'S256') {
        const hash = crypto.createHash('sha256').update(verifier).digest('base64url')
        return hash === challenge
    }
    return verifier === challenge // plain method
}

// POST /api/oauth/token - Exchange code for tokens
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || ''
        let body: any

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const formData = await request.formData()
            body = Object.fromEntries(formData.entries())
        } else {
            body = await request.json()
        }

        const grant_type = body.grant_type
        const admin = getSupabaseAdmin()

        switch (grant_type) {
            case 'authorization_code':
                return handleAuthorizationCode(body, admin)
            case 'refresh_token':
                return handleRefreshToken(body, admin)
            case 'client_credentials':
                return handleClientCredentials(body, admin)
            default:
                return NextResponse.json({
                    error: 'unsupported_grant_type',
                    error_description: `Grant type '${grant_type}' is not supported`
                }, { status: 400 })
        }
    } catch (error: any) {
        console.error('OAuth token error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

async function handleAuthorizationCode(body: any, admin: any) {
    const { code, client_id, client_secret, redirect_uri, code_verifier } = body

    if (!code || !client_id) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'Missing required parameters'
        }, { status: 400 })
    }

    // Get authorization code
    const { data: authCode, error: codeError } = await admin
        .from('oauth_authorization_codes')
        .select('*, application:developer_applications(*)')
        .eq('code', code)
        .single()

    if (codeError || !authCode) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Invalid or expired authorization code'
        }, { status: 400 })
    }

    // Check expiration
    if (new Date(authCode.expires_at) < new Date()) {
        await admin.from('oauth_authorization_codes').delete().eq('code', code)
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Authorization code has expired'
        }, { status: 400 })
    }

    // Check if already used
    if (authCode.used_at) {
        // Security: Revoke all tokens for this authorization
        await admin
            .from('oauth_access_tokens')
            .update({ is_revoked: true })
            .eq('authorization_code', code)

        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Authorization code has already been used'
        }, { status: 400 })
    }

    const app = authCode.application

    // Verify client_id matches
    if (app.client_id !== client_id) {
        return NextResponse.json({
            error: 'invalid_client',
            error_description: 'Client ID mismatch'
        }, { status: 401 })
    }

    // Verify redirect_uri if provided
    if (redirect_uri && redirect_uri !== authCode.redirect_uri) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Redirect URI mismatch'
        }, { status: 400 })
    }

    // Verify PKCE if code_challenge was provided
    if (authCode.code_challenge) {
        if (!code_verifier) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Code verifier required for PKCE'
            }, { status: 400 })
        }

        if (!verifyCodeChallenge(code_verifier, authCode.code_challenge, authCode.code_challenge_method || 'plain')) {
            return NextResponse.json({
                error: 'invalid_grant',
                error_description: 'Code verifier verification failed'
            }, { status: 400 })
        }
    } else if (client_secret) {
        // Verify client secret for confidential clients
        const secretHash = hashToken(client_secret)
        if (app.client_secret_hash !== secretHash) {
            // Check previous secret during grace period
            if (!app.previous_client_secret_hash ||
                app.previous_client_secret_hash !== secretHash ||
                new Date(app.previous_secret_expires_at) < new Date()) {
                return NextResponse.json({
                    error: 'invalid_client',
                    error_description: 'Invalid client credentials'
                }, { status: 401 })
            }
        }
    }

    // Mark authorization code as used
    await admin
        .from('oauth_authorization_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('code', code)

    // Get user info
    const { data: userProfile } = await admin
        .from('profiles')
        .select('*')
        .eq('user_id', authCode.user_id)
        .single()

    // Generate tokens
    const accessTokenPayload = {
        sub: authCode.user_id,
        aud: app.client_id,
        app_id: app.id,
        scopes: authCode.scopes,
        iss: 'catalystwells',
        iat: Math.floor(Date.now() / 1000)
    }

    const accessToken = generateAccessToken(accessTokenPayload, 3600)
    const refreshToken = generateRefreshToken()
    const expiresIn = 3600 // 1 hour

    // Store refresh token
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    await admin.from('oauth_refresh_tokens').insert({
        token_hash: hashToken(refreshToken),
        application_id: app.id,
        user_id: authCode.user_id,
        scopes: authCode.scopes,
        expires_at: refreshExpiresAt.toISOString()
    })

    // Store access token reference
    await admin.from('oauth_access_tokens').insert({
        token_hash: hashToken(accessToken),
        application_id: app.id,
        user_id: authCode.user_id,
        scopes: authCode.scopes,
        authorization_code: code,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
    })

    // Update app analytics
    await admin.rpc('increment_token_exchanges', { app_id: app.id }).catch(() => { })

    // Build response
    const response: any = {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        refresh_token: refreshToken,
        scope: authCode.scopes.join(' ')
    }

    // Include id_token if openid scope requested
    if (authCode.scopes.includes('openid')) {
        const idTokenPayload = {
            sub: authCode.user_id,
            aud: app.client_id,
            iss: 'catalystwells',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + expiresIn,
            email: userProfile?.email,
            name: userProfile?.full_name,
            picture: userProfile?.avatar_url
        }
        response.id_token = generateAccessToken(idTokenPayload)
    }

    return NextResponse.json(response)
}

async function handleRefreshToken(body: any, admin: any) {
    const { refresh_token, client_id, client_secret, scope } = body

    if (!refresh_token || !client_id) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'Missing required parameters'
        }, { status: 400 })
    }

    // Get refresh token
    const tokenHash = hashToken(refresh_token)
    const { data: storedToken, error } = await admin
        .from('oauth_refresh_tokens')
        .select('*, application:developer_applications(*)')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .single()

    if (error || !storedToken) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Invalid or expired refresh token'
        }, { status: 400 })
    }

    // Check expiration
    if (new Date(storedToken.expires_at) < new Date()) {
        await admin
            .from('oauth_refresh_tokens')
            .update({ is_revoked: true })
            .eq('token_hash', tokenHash)

        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Refresh token has expired'
        }, { status: 400 })
    }

    const app = storedToken.application

    // Verify client_id
    if (app.client_id !== client_id) {
        return NextResponse.json({
            error: 'invalid_client',
            error_description: 'Client ID mismatch'
        }, { status: 401 })
    }

    // Verify client secret if provided
    if (client_secret) {
        const secretHash = hashToken(client_secret)
        if (app.client_secret_hash !== secretHash) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Invalid client credentials'
            }, { status: 401 })
        }
    }

    // Determine scopes (can request subset of original)
    let newScopes = storedToken.scopes
    if (scope) {
        const requestedScopes = scope.split(' ').filter(Boolean)
        const invalidScopes = requestedScopes.filter((s: string) => !storedToken.scopes.includes(s))
        if (invalidScopes.length > 0) {
            return NextResponse.json({
                error: 'invalid_scope',
                error_description: 'Cannot request scopes not in original grant'
            }, { status: 400 })
        }
        newScopes = requestedScopes
    }

    // Generate new access token
    const accessTokenPayload = {
        sub: storedToken.user_id,
        aud: app.client_id,
        app_id: app.id,
        scopes: newScopes,
        iss: 'catalystwells',
        iat: Math.floor(Date.now() / 1000)
    }

    const accessToken = generateAccessToken(accessTokenPayload, 3600)
    const expiresIn = 3600

    // Optionally rotate refresh token
    let newRefreshToken = refresh_token
    if (process.env.ROTATE_REFRESH_TOKENS === 'true') {
        newRefreshToken = generateRefreshToken()

        // Revoke old, create new
        await admin
            .from('oauth_refresh_tokens')
            .update({ is_revoked: true })
            .eq('token_hash', tokenHash)

        const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        await admin.from('oauth_refresh_tokens').insert({
            token_hash: hashToken(newRefreshToken),
            application_id: app.id,
            user_id: storedToken.user_id,
            scopes: newScopes,
            expires_at: refreshExpiresAt.toISOString()
        })
    }

    // Store access token reference
    await admin.from('oauth_access_tokens').insert({
        token_hash: hashToken(accessToken),
        application_id: app.id,
        user_id: storedToken.user_id,
        scopes: newScopes,
        expires_at: new Date(Date.now() + expiresIn * 1000).toISOString()
    })

    // Update analytics
    await admin.rpc('increment_token_refreshes', { app_id: app.id }).catch(() => { })

    return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        refresh_token: newRefreshToken,
        scope: newScopes.join(' ')
    })
}

async function handleClientCredentials(body: any, admin: any) {
    const { client_id, client_secret, scope } = body

    if (!client_id || !client_secret) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'Missing client credentials'
        }, { status: 400 })
    }

    // Get application
    const { data: app } = await admin
        .from('developer_applications')
        .select('*')
        .eq('client_id', client_id)
        .single()

    if (!app) {
        return NextResponse.json({
            error: 'invalid_client',
            error_description: 'Unknown client_id'
        }, { status: 401 })
    }

    // Verify client secret
    const secretHash = hashToken(client_secret)
    if (app.client_secret_hash !== secretHash) {
        return NextResponse.json({
            error: 'invalid_client',
            error_description: 'Invalid client credentials'
        }, { status: 401 })
    }

    // Check app status
    if (app.status !== 'approved') {
        return NextResponse.json({
            error: 'unauthorized_client',
            error_description: 'Application is not approved'
        }, { status: 403 })
    }

    // Parse scopes
    const requestedScopes = scope ? scope.split(' ').filter(Boolean) : []
    const allowedScopes = app.allowed_scopes || []

    // For client credentials, limit to app-level scopes only
    const grantedScopes = requestedScopes.filter((s: string) =>
        allowedScopes.includes(s) && !s.startsWith('user.')
    )

    // Generate access token (no refresh token for client credentials)
    const accessTokenPayload = {
        sub: `app:${app.id}`,
        aud: app.client_id,
        app_id: app.id,
        scopes: grantedScopes,
        iss: 'catalystwells',
        iat: Math.floor(Date.now() / 1000),
        grant_type: 'client_credentials'
    }

    const accessToken = generateAccessToken(accessTokenPayload, 3600)
    const expiresIn = 3600

    return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: expiresIn,
        scope: grantedScopes.join(' ')
    })
}
