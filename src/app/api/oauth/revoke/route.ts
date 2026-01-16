/**
 * OAuth Token Revocation Endpoint
 * POST /api/oauth/revoke - Revoke access or refresh tokens
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

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const token = formData.get('token') as string
        const tokenTypeHint = formData.get('token_type_hint') as string | null
        const clientId = formData.get('client_id') as string
        const clientSecret = formData.get('client_secret') as string

        if (!token || !clientId) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Missing token or client_id'
            }, { status: 400 })
        }

        const supabase = getSupabaseAdmin()

        // Validate client
        const { data: app } = await supabase
            .from('oauth_applications')
            .select('*')
            .eq('client_id', clientId)
            .single()

        if (!app) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Invalid client_id'
            }, { status: 401 })
        }

        if (app.client_secret && app.client_secret !== clientSecret) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Invalid client_secret'
            }, { status: 401 })
        }

        const tokenHash = hashToken(token)

        // Try to revoke as access token first (or based on hint)
        if (!tokenTypeHint || tokenTypeHint === 'access_token') {
            const { data: accessToken } = await supabase
                .from('oauth_access_tokens')
                .select('id, application_id')
                .eq('token_hash', tokenHash)
                .single()

            if (accessToken && accessToken.application_id === app.id) {
                await supabase
                    .from('oauth_access_tokens')
                    .update({ revoked: true, revoked_at: new Date().toISOString() })
                    .eq('id', accessToken.id)

                // Also revoke associated refresh tokens
                await supabase
                    .from('oauth_refresh_tokens')
                    .update({ revoked: true, revoked_at: new Date().toISOString() })
                    .eq('access_token_id', accessToken.id)

                return new NextResponse(null, { status: 200 })
            }
        }

        // Try to revoke as refresh token
        if (!tokenTypeHint || tokenTypeHint === 'refresh_token') {
            const { data: refreshToken } = await supabase
                .from('oauth_refresh_tokens')
                .select('id, application_id, access_token_id')
                .eq('token_hash', tokenHash)
                .single()

            if (refreshToken && refreshToken.application_id === app.id) {
                await supabase
                    .from('oauth_refresh_tokens')
                    .update({ revoked: true, revoked_at: new Date().toISOString() })
                    .eq('id', refreshToken.id)

                // Also revoke associated access token
                if (refreshToken.access_token_id) {
                    await supabase
                        .from('oauth_access_tokens')
                        .update({ revoked: true, revoked_at: new Date().toISOString() })
                        .eq('id', refreshToken.access_token_id)
                }

                return new NextResponse(null, { status: 200 })
            }
        }

        // Token not found or doesn't belong to client - still return 200 per RFC 7009
        return new NextResponse(null, { status: 200 })

    } catch (error: any) {
        console.error('OAuth revoke error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
