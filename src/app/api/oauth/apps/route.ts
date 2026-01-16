/**
 * Connected Apps Management API
 * Allows users to view and revoke third-party app authorizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

async function getAuthenticatedUser() {
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
        .select('id, user_id, email, role')
        .eq('user_id', user.id)
        .single()

    return { user, profile }
}

/**
 * GET /api/oauth/apps - List connected apps for current user
 */
export async function GET(request: NextRequest) {
    const auth = await getAuthenticatedUser()

    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()

    // Get user's authorized apps
    const { data: authorizations, error } = await supabase
        .from('oauth_user_authorizations')
        .select(`
      id,
      scopes,
      first_authorized_at,
      last_authorized_at,
      authorization_count,
      revoked,
      application:oauth_applications (
        id,
        client_id,
        name,
        description,
        logo_url,
        website_url,
        developer_name,
        is_verified,
        is_first_party,
        trust_level
      )
    `)
        .eq('user_id', auth.user.id)
        .order('last_authorized_at', { ascending: false })

    if (error) {
        console.error('Error fetching apps:', error)
        return NextResponse.json({ error: 'Failed to fetch apps' }, { status: 500 })
    }

    // Get active token counts for each app
    const appsWithActivity = await Promise.all(
        (authorizations || []).map(async (authz) => {
            const app = authz.application as any

            // Count active tokens
            const { count: activeTokens } = await supabase
                .from('oauth_access_tokens')
                .select('*', { count: 'exact', head: true })
                .eq('application_id', app.id)
                .eq('user_id', auth.user.id)
                .eq('revoked', false)
                .gt('expires_at', new Date().toISOString())

            // Get last activity
            const { data: lastToken } = await supabase
                .from('oauth_access_tokens')
                .select('last_used_at')
                .eq('application_id', app.id)
                .eq('user_id', auth.user.id)
                .order('last_used_at', { ascending: false, nullsFirst: false })
                .limit(1)
                .single()

            return {
                id: authz.id,
                app: {
                    id: app.id,
                    clientId: app.client_id,
                    name: app.name,
                    description: app.description,
                    logoUrl: app.logo_url,
                    websiteUrl: app.website_url,
                    developer: app.developer_name,
                    isVerified: app.is_verified,
                    isFirstParty: app.is_first_party,
                    trustLevel: app.trust_level
                },
                scopes: authz.scopes,
                firstAuthorizedAt: authz.first_authorized_at,
                lastAuthorizedAt: authz.last_authorized_at,
                lastActivityAt: lastToken?.last_used_at,
                authorizationCount: authz.authorization_count,
                activeTokens: activeTokens || 0,
                isRevoked: authz.revoked
            }
        })
    )

    return NextResponse.json({
        apps: appsWithActivity,
        total: appsWithActivity.length,
        active: appsWithActivity.filter(a => !a.isRevoked).length
    })
}

/**
 * DELETE /api/oauth/apps - Revoke app access
 */
export async function DELETE(request: NextRequest) {
    const auth = await getAuthenticatedUser()

    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const appId = searchParams.get('app_id')

    if (!appId) {
        return NextResponse.json({ error: 'app_id is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Revoke all access tokens for this app
    await supabase
        .from('oauth_access_tokens')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('application_id', appId)
        .eq('user_id', auth.user.id)

    // Revoke all refresh tokens for this app
    await supabase
        .from('oauth_refresh_tokens')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('application_id', appId)
        .eq('user_id', auth.user.id)

    // Mark authorization as revoked
    await supabase
        .from('oauth_user_authorizations')
        .update({ revoked: true, revoked_at: new Date().toISOString() })
        .eq('application_id', appId)
        .eq('user_id', auth.user.id)

    return NextResponse.json({
        success: true,
        message: 'App access revoked successfully'
    })
}

/**
 * POST /api/oauth/apps - Reauthorize a revoked app
 */
export async function POST(request: NextRequest) {
    const auth = await getAuthenticatedUser()

    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { app_id, scopes } = body

    if (!app_id) {
        return NextResponse.json({ error: 'app_id is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Verify app exists
    const { data: app } = await supabase
        .from('oauth_applications')
        .select('id, allowed_scopes')
        .eq('id', app_id)
        .single()

    if (!app) {
        return NextResponse.json({ error: 'App not found' }, { status: 404 })
    }

    // Validate scopes
    const allowedScopes = app.allowed_scopes as string[]
    const requestedScopes = scopes || ['profile.read']
    const validScopes = requestedScopes.filter((s: string) => allowedScopes.includes(s))

    // Check profile exists
    if (!auth.profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 401 })
    }

    // Upsert authorization
    const { data: authorization, error } = await supabase
        .from('oauth_user_authorizations')
        .upsert({
            user_id: auth.user.id,
            profile_id: auth.profile.id,
            application_id: app_id,
            scopes: validScopes,
            revoked: false,
            revoked_at: null,
            last_authorized_at: new Date().toISOString()
        }, {
            onConflict: 'user_id,application_id'
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: 'Failed to authorize app' }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        authorization
    })
}
