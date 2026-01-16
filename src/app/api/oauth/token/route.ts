/**
 * OAuth Token Endpoint
 * POST /api/oauth/token - Exchange code for tokens or refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

function generateSecureToken(prefix: string, length: number = 32): string {
    return `${prefix}${crypto.randomBytes(length).toString('hex')}`
}

function verifyCodeChallenge(
    codeVerifier: string,
    codeChallenge: string,
    method: string
): boolean {
    if (method === 'S256') {
        const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url')
        return hash === codeChallenge
    }
    return codeVerifier === codeChallenge
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const grantType = formData.get('grant_type') as string
        const clientId = formData.get('client_id') as string
        const clientSecret = formData.get('client_secret') as string

        const supabase = getSupabaseAdmin()

        // Validate client credentials
        const { data: app, error: appError } = await supabase
            .from('oauth_applications')
            .select('*')
            .eq('client_id', clientId)
            .eq('is_active', true)
            .single()

        if (appError || !app) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Invalid client_id'
            }, { status: 401 })
        }

        // Verify client_secret for confidential clients
        if (app.client_secret && app.client_secret !== clientSecret) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Invalid client_secret'
            }, { status: 401 })
        }

        // Handle different grant types
        if (grantType === 'authorization_code') {
            return handleAuthorizationCodeGrant(request, formData, app, supabase)
        } else if (grantType === 'refresh_token') {
            return handleRefreshTokenGrant(request, formData, app, supabase)
        } else {
            return NextResponse.json({
                error: 'unsupported_grant_type',
                error_description: 'Supported grant types: authorization_code, refresh_token'
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

async function handleAuthorizationCodeGrant(
    request: NextRequest,
    formData: FormData,
    app: any,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    const code = formData.get('code') as string
    const redirectUri = formData.get('redirect_uri') as string
    const codeVerifier = formData.get('code_verifier') as string

    if (!code || !redirectUri) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'Missing code or redirect_uri'
        }, { status: 400 })
    }

    // Get authorization code
    const { data: authCode, error: codeError } = await supabase
        .from('oauth_authorization_codes')
        .select('*')
        .eq('code', code)
        .eq('application_id', app.id)
        .single()

    if (codeError || !authCode) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Invalid or expired authorization code'
        }, { status: 400 })
    }

    // Validate code
    if (authCode.used) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Authorization code already used'
        }, { status: 400 })
    }

    if (new Date(authCode.expires_at) < new Date()) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Authorization code expired'
        }, { status: 400 })
    }

    if (authCode.redirect_uri !== redirectUri) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'redirect_uri mismatch'
        }, { status: 400 })
    }

    // Verify PKCE if present
    if (authCode.code_challenge) {
        if (!codeVerifier) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'code_verifier required for PKCE'
            }, { status: 400 })
        }

        if (!verifyCodeChallenge(codeVerifier, authCode.code_challenge, authCode.code_challenge_method || 'plain')) {
            return NextResponse.json({
                error: 'invalid_grant',
                error_description: 'Invalid code_verifier'
            }, { status: 400 })
        }
    }

    // Mark code as used
    await supabase
        .from('oauth_authorization_codes')
        .update({ used: true })
        .eq('id', authCode.id)

    // Generate access token
    const accessToken = generateSecureToken('cw_at_')
    const accessTokenHash = hashToken(accessToken)
    const accessTokenExpiresAt = new Date(Date.now() + 3600 * 1000) // 1 hour

    const { data: tokenData, error: tokenError } = await supabase
        .from('oauth_access_tokens')
        .insert({
            token_hash: accessTokenHash,
            application_id: app.id,
            user_id: authCode.user_id,
            profile_id: authCode.profile_id,
            scopes: authCode.scopes,
            expires_at: accessTokenExpiresAt.toISOString()
        })
        .select('id')
        .single()

    if (tokenError) {
        console.error('Failed to create access token:', tokenError)
        return NextResponse.json({
            error: 'server_error',
            error_description: 'Failed to generate tokens'
        }, { status: 500 })
    }

    // Generate refresh token
    const refreshToken = generateSecureToken('cw_rt_')
    const refreshTokenHash = hashToken(refreshToken)
    const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000) // 30 days

    await supabase
        .from('oauth_refresh_tokens')
        .insert({
            token_hash: refreshTokenHash,
            access_token_id: tokenData.id,
            application_id: app.id,
            user_id: authCode.user_id,
            profile_id: authCode.profile_id,
            scopes: authCode.scopes,
            expires_at: refreshTokenExpiresAt.toISOString()
        })

    return NextResponse.json({
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: authCode.scopes.join(' ')
    })
}

async function handleRefreshTokenGrant(
    request: NextRequest,
    formData: FormData,
    app: any,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    const refreshToken = formData.get('refresh_token') as string

    if (!refreshToken) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'Missing refresh_token'
        }, { status: 400 })
    }

    const tokenHash = hashToken(refreshToken)

    // Get refresh token
    const { data: tokenData, error: tokenError } = await supabase
        .from('oauth_refresh_tokens')
        .select('*')
        .eq('token_hash', tokenHash)
        .eq('application_id', app.id)
        .single()

    if (tokenError || !tokenData) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Invalid refresh token'
        }, { status: 400 })
    }

    if (tokenData.revoked) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Refresh token has been revoked'
        }, { status: 400 })
    }

    if (new Date(tokenData.expires_at) < new Date()) {
        return NextResponse.json({
            error: 'invalid_grant',
            error_description: 'Refresh token expired'
        }, { status: 400 })
    }

    // Revoke old access token
    if (tokenData.access_token_id) {
        await supabase
            .from('oauth_access_tokens')
            .update({ revoked: true, revoked_at: new Date().toISOString() })
            .eq('id', tokenData.access_token_id)
    }

    // Generate new access token
    const newAccessToken = generateSecureToken('cw_at_')
    const newAccessTokenHash = hashToken(newAccessToken)
    const newAccessTokenExpiresAt = new Date(Date.now() + 3600 * 1000)

    const { data: newTokenData } = await supabase
        .from('oauth_access_tokens')
        .insert({
            token_hash: newAccessTokenHash,
            application_id: app.id,
            user_id: tokenData.user_id,
            profile_id: tokenData.profile_id,
            scopes: tokenData.scopes,
            expires_at: newAccessTokenExpiresAt.toISOString()
        })
        .select('id')
        .single()

    // Rotate refresh token
    const newRefreshToken = generateSecureToken('cw_rt_')
    const newRefreshTokenHash = hashToken(newRefreshToken)
    const newRefreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 3600 * 1000)

    // Mark old refresh token as rotated
    await supabase
        .from('oauth_refresh_tokens')
        .update({ rotated: true })
        .eq('id', tokenData.id)

    // Create new refresh token
    await supabase
        .from('oauth_refresh_tokens')
        .insert({
            token_hash: newRefreshTokenHash,
            access_token_id: newTokenData?.id,
            application_id: app.id,
            user_id: tokenData.user_id,
            profile_id: tokenData.profile_id,
            scopes: tokenData.scopes,
            expires_at: newRefreshTokenExpiresAt.toISOString(),
            previous_token_id: tokenData.id
        })

    return NextResponse.json({
        access_token: newAccessToken,
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: newRefreshToken,
        scope: tokenData.scopes.join(' ')
    })
}
