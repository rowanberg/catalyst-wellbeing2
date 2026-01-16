import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

// Get authenticated user from main CatalystWells
async function getAuthenticatedUser() {
    try {
        const cookieStore = await cookies()
        const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_MAIN_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!url || !key) return null

        const supabase = createServerClient(url, key, {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                }
            }
        })

        const { data: { user } } = await supabase.auth.getUser()
        return user
    } catch (error) {
        console.error('Auth error:', error)
        return null
    }
}

// Validate redirect URI
function validateRedirectUri(uri: string, allowedUris: string[]): boolean {
    try {
        const requestedUrl = new URL(uri)

        for (const allowed of allowedUris) {
            // Exact match
            if (uri === allowed) return true

            // Wildcard support for localhost (dev only)
            if (allowed.includes('*')) {
                const pattern = allowed.replace(/\*/g, '.*')
                if (new RegExp(`^${pattern}$`).test(uri)) return true
            }

            // Same origin match
            try {
                const allowedUrl = new URL(allowed)
                if (requestedUrl.origin === allowedUrl.origin &&
                    requestedUrl.pathname.startsWith(allowedUrl.pathname)) {
                    return true
                }
            } catch { }
        }

        return false
    } catch {
        return false
    }
}

// Validate scopes
function validateScopes(requested: string[], allowed: string[]): { valid: boolean; invalid: string[] } {
    const invalid = requested.filter(scope => !allowed.includes(scope) && scope !== 'openid')
    return { valid: invalid.length === 0, invalid }
}

// Generate authorization code
function generateAuthCode(): string {
    return `cw_ac_${crypto.randomBytes(32).toString('hex')}`
}

// Hash for PKCE
function hashCodeChallenge(verifier: string, method: string): string {
    if (method === 'S256') {
        return crypto.createHash('sha256').update(verifier).digest('base64url')
    }
    return verifier // plain method
}

// GET /api/oauth/authorize - Show consent screen
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)

    const client_id = searchParams.get('client_id')
    const redirect_uri = searchParams.get('redirect_uri')
    const response_type = searchParams.get('response_type')
    const scope = searchParams.get('scope')
    const state = searchParams.get('state')
    const code_challenge = searchParams.get('code_challenge')
    const code_challenge_method = searchParams.get('code_challenge_method')

    // Validate required parameters
    if (!client_id) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'Missing client_id parameter'
        }, { status: 400 })
    }

    if (response_type !== 'code') {
        return NextResponse.json({
            error: 'unsupported_response_type',
            error_description: 'Only authorization code flow is supported'
        }, { status: 400 })
    }

    try {
        const admin = getSupabaseAdmin()

        // Look up application
        const { data: app, error } = await admin
            .from('developer_applications')
            .select('*')
            .eq('client_id', client_id)
            .single()

        if (error || !app) {
            return NextResponse.json({
                error: 'invalid_client',
                error_description: 'Unknown client_id'
            }, { status: 400 })
        }

        // Check app status
        if (app.status !== 'approved' && app.environment !== 'sandbox') {
            return NextResponse.json({
                error: 'unauthorized_client',
                error_description: 'Application is not approved for production use'
            }, { status: 403 })
        }

        // Validate redirect URI
        if (redirect_uri && !validateRedirectUri(redirect_uri, app.redirect_uris || [])) {
            return NextResponse.json({
                error: 'invalid_redirect_uri',
                error_description: 'Redirect URI not registered for this application'
            }, { status: 400 })
        }

        // Parse and validate scopes
        const requestedScopes = scope ? scope.split(' ').filter(Boolean) : ['profile.read']
        const allowedScopes = app.allowed_scopes?.length > 0 ? app.allowed_scopes : app.requested_scopes
        const scopeValidation = validateScopes(requestedScopes, allowedScopes)

        if (!scopeValidation.valid) {
            return NextResponse.json({
                error: 'invalid_scope',
                error_description: `Invalid scopes: ${scopeValidation.invalid.join(', ')}`
            }, { status: 400 })
        }

        // Get scope details
        const { data: scopeDetails } = await admin
            .from('scope_definitions')
            .select('*')
            .in('scope_name', requestedScopes)

        // Check if user is authenticated
        const user = await getAuthenticatedUser()

        if (!user) {
            // Redirect to main app login with return URL
            const loginUrl = new URL('/login', process.env.NEXT_PUBLIC_MAIN_APP_URL || 'http://localhost:3000')
            loginUrl.searchParams.set('return_to', request.url)
            return NextResponse.redirect(loginUrl.toString())
        }

        // Check for existing authorization
        const { data: existingAuth } = await admin
            .from('oauth_user_authorizations')
            .select('*')
            .eq('user_id', user.id)
            .eq('application_id', app.id)
            .eq('is_active', true)
            .single()

        // If already authorized with same or greater scopes, auto-approve
        if (existingAuth) {
            const existingScopes = existingAuth.granted_scopes || []
            const newScopes = requestedScopes.filter(s => !existingScopes.includes(s))

            if (newScopes.length === 0) {
                // Auto-generate code and redirect
                const authCode = generateAuthCode()
                const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

                await admin.from('oauth_authorization_codes').insert({
                    code: authCode,
                    application_id: app.id,
                    user_id: user.id,
                    redirect_uri: redirect_uri || app.redirect_uris[0],
                    scopes: requestedScopes,
                    code_challenge: code_challenge || null,
                    code_challenge_method: code_challenge_method || null,
                    expires_at: expiresAt.toISOString()
                })

                const redirectUrl = new URL(redirect_uri || app.redirect_uris[0])
                redirectUrl.searchParams.set('code', authCode)
                if (state) redirectUrl.searchParams.set('state', state)

                return NextResponse.redirect(redirectUrl.toString())
            }
        }

        // Return consent screen data (for SSR or API-based consent)
        return NextResponse.json({
            app: {
                id: app.id,
                name: app.name,
                description: app.description,
                logo_url: app.logo_url,
                website_url: app.website_url,
                privacy_policy_url: app.privacy_policy_url,
                is_verified: app.is_verified,
                trust_level: app.trust_level
            },
            scopes: scopeDetails || requestedScopes.map(s => ({ scope_name: s, display_name: s, description: '' })),
            user: {
                id: user.id,
                email: user.email,
                name: user.user_metadata?.full_name || user.email
            },
            params: {
                client_id,
                redirect_uri: redirect_uri || app.redirect_uris[0],
                scope: requestedScopes.join(' '),
                state,
                code_challenge,
                code_challenge_method
            }
        })
    } catch (error: any) {
        console.error('OAuth authorize error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// POST /api/oauth/authorize - Handle consent decision
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            client_id,
            redirect_uri,
            scope,
            state,
            code_challenge,
            code_challenge_method,
            decision // 'approve' or 'deny'
        } = body

        const user = await getAuthenticatedUser()
        if (!user) {
            return NextResponse.json({
                error: 'unauthorized',
                error_description: 'User not authenticated'
            }, { status: 401 })
        }

        const admin = getSupabaseAdmin()

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
            }, { status: 400 })
        }

        // Handle denial
        if (decision === 'deny') {
            const redirectUrl = new URL(redirect_uri || app.redirect_uris[0])
            redirectUrl.searchParams.set('error', 'access_denied')
            redirectUrl.searchParams.set('error_description', 'User denied the authorization request')
            if (state) redirectUrl.searchParams.set('state', state)

            return NextResponse.json({ redirect_url: redirectUrl.toString() })
        }

        // Generate authorization code
        const authCode = generateAuthCode()
        const requestedScopes = scope ? scope.split(' ').filter(Boolean) : ['profile.read']
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

        // Store authorization code
        await admin.from('oauth_authorization_codes').insert({
            code: authCode,
            application_id: app.id,
            user_id: user.id,
            redirect_uri: redirect_uri || app.redirect_uris[0],
            scopes: requestedScopes,
            code_challenge: code_challenge || null,
            code_challenge_method: code_challenge_method || null,
            expires_at: expiresAt.toISOString()
        })

        // Create or update user authorization record
        const { data: existingAuth } = await admin
            .from('oauth_user_authorizations')
            .select('id, granted_scopes')
            .eq('user_id', user.id)
            .eq('application_id', app.id)
            .single()

        if (existingAuth) {
            const mergedScopes = [...new Set([...existingAuth.granted_scopes, ...requestedScopes])]
            await admin
                .from('oauth_user_authorizations')
                .update({
                    granted_scopes: mergedScopes,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingAuth.id)
        } else {
            await admin.from('oauth_user_authorizations').insert({
                user_id: user.id,
                application_id: app.id,
                granted_scopes: requestedScopes,
                is_active: true
            })
        }

        // Build redirect URL
        const redirectUrl = new URL(redirect_uri || app.redirect_uris[0])
        redirectUrl.searchParams.set('code', authCode)
        if (state) redirectUrl.searchParams.set('state', state)

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: app.developer_id,
            application_id: app.id,
            action: 'user_authorized',
            resource_type: 'authorization',
            details: { user_id: user.id, scopes: requestedScopes }
        })

        return NextResponse.json({
            redirect_url: redirectUrl.toString()
        })
    } catch (error: any) {
        console.error('OAuth authorize POST error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
