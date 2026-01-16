/**
 * OAuth Authorization Endpoint
 * POST /api/oauth/authorize - Create authorization code
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import crypto from 'crypto'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

async function getAuthenticatedUser() {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return null

        const admin = getSupabaseAdmin()
        const { data: profile } = await admin
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

        return { user, profile }
    } catch (error) {
        console.error('Auth error:', error)
        return null
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            client_id,
            redirect_uri,
            scope,
            state,
            response_type,
            code_challenge,
            code_challenge_method
        } = body

        // Validate required fields
        if (!client_id) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Missing client_id parameter'
            }, { status: 400 })
        }

        if (!scope) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Missing scope parameter'
            }, { status: 400 })
        }

        // Get authenticated user
        const auth = await getAuthenticatedUser()
        if (!auth || !auth.profile) {
            return NextResponse.json({
                error: 'unauthorized',
                error_description: 'User must be authenticated'
            }, { status: 401 })
        }

        const supabase = getSupabaseAdmin()

        // Parse scopes
        const requestedScopes = scope.split(' ').filter((s: string) => s.length > 0)

        // Try to validate application from database
        let app: any = null
        let useDevMode = false

        try {
            const { data: appData, error: appError } = await supabase
                .from('oauth_applications')
                .select('*')
                .eq('client_id', client_id)
                .eq('is_active', true)
                .single()

            if (!appError && appData) {
                app = appData

                // Validate redirect_uri if app exists
                if (redirect_uri && app.redirect_uris && !app.redirect_uris.includes(redirect_uri)) {
                    return NextResponse.json({
                        error: 'invalid_request',
                        error_description: 'Invalid redirect_uri for this application'
                    }, { status: 400 })
                }

                // Validate scopes
                const allowedScopes = app.allowed_scopes as string[]
                const invalidScopes = requestedScopes.filter((s: string) => !allowedScopes.includes(s))

                if (invalidScopes.length > 0) {
                    return NextResponse.json({
                        error: 'invalid_scope',
                        error_description: `Invalid scopes: ${invalidScopes.join(', ')}. Allowed: ${allowedScopes.join(', ')}`
                    }, { status: 400 })
                }
            } else {
                // App not in database - use dev mode for known apps
                useDevMode = true
            }
        } catch (dbError) {
            // Database table might not exist yet
            console.warn('OAuth tables not available, using dev mode')
            useDevMode = true
        }

        // Generate authorization code
        const authorizationCode = `cw_ac_${crypto.randomBytes(32).toString('hex')}`

        // If we have the database tables, store the code
        if (!useDevMode && app) {
            try {
                const { error: insertError } = await supabase
                    .from('oauth_authorization_codes')
                    .insert({
                        code: authorizationCode,
                        application_id: app.id,
                        user_id: auth.user.id,
                        profile_id: auth.profile.id,
                        scopes: requestedScopes,
                        redirect_uri: redirect_uri || '',
                        state: state || null,
                        code_challenge: code_challenge || null,
                        code_challenge_method: code_challenge_method || null,
                        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
                    })

                if (insertError) {
                    console.error('Failed to create auth code:', insertError)
                    // Fall back to dev mode
                    useDevMode = true
                } else {
                    // Update or create user authorization record
                    await supabase
                        .from('oauth_user_authorizations')
                        .upsert({
                            user_id: auth.user.id,
                            profile_id: auth.profile.id,
                            application_id: app.id,
                            scopes: requestedScopes,
                            last_authorized_at: new Date().toISOString()
                        }, { onConflict: 'user_id,application_id' })
                }
            } catch (insertErr) {
                console.error('Insert error:', insertErr)
                useDevMode = true
            }
        }

        // Build response
        const response: any = {
            authorization_code: authorizationCode,
            scopes: requestedScopes
        }

        if (state) {
            response.state = state
        }

        // If redirect_uri provided, include the full redirect
        if (redirect_uri) {
            try {
                const callbackUrl = new URL(redirect_uri)
                callbackUrl.searchParams.set('code', authorizationCode)
                if (state) callbackUrl.searchParams.set('state', state)
                response.redirect_uri = callbackUrl.toString()
            } catch {
                // Invalid URL, just return the code
            }
        }

        if (useDevMode) {
            response.dev_mode = true
            response.message = 'Development mode - OAuth tables not available'
        }

        return NextResponse.json(response)

    } catch (error: any) {
        console.error('OAuth authorize error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
