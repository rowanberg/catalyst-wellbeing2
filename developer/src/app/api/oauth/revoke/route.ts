import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

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

// Hash token
function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

// POST /api/oauth/revoke - Revoke tokens
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

        const { token, token_type_hint, client_id, client_secret } = body

        if (!token) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Missing token parameter'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Verify client credentials if provided
        if (client_id && client_secret) {
            const { data: app } = await admin
                .from('developer_applications')
                .select('client_secret_hash')
                .eq('client_id', client_id)
                .single()

            if (!app || app.client_secret_hash !== hashToken(client_secret)) {
                return NextResponse.json({
                    error: 'invalid_client',
                    error_description: 'Invalid client credentials'
                }, { status: 401 })
            }
        }

        const tokenHash = hashToken(token)

        // Try to revoke based on token type hint
        if (token_type_hint === 'refresh_token' || !token_type_hint) {
            const { data: refreshToken } = await admin
                .from('oauth_refresh_tokens')
                .select('id, application_id')
                .eq('token_hash', tokenHash)
                .single()

            if (refreshToken) {
                // Revoke refresh token
                await admin
                    .from('oauth_refresh_tokens')
                    .update({ is_revoked: true, revoked_at: new Date().toISOString() })
                    .eq('id', refreshToken.id)

                // Also revoke all access tokens from this refresh token family
                // (In a real implementation, you'd track the family)

                return NextResponse.json({ success: true })
            }
        }

        if (token_type_hint === 'access_token' || !token_type_hint) {
            const { data: accessToken } = await admin
                .from('oauth_access_tokens')
                .select('id')
                .eq('token_hash', tokenHash)
                .single()

            if (accessToken) {
                await admin
                    .from('oauth_access_tokens')
                    .update({ is_revoked: true, revoked_at: new Date().toISOString() })
                    .eq('id', accessToken.id)

                return NextResponse.json({ success: true })
            }
        }

        // RFC 7009: Return success even if token not found
        // This prevents token fishing attacks
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Token revocation error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
