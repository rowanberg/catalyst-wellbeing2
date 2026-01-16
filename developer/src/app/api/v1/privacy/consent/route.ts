import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function verifyAccessToken(request: NextRequest): { valid: boolean; payload?: any; error?: string } {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false, error: 'Missing or invalid authorization header' }
    }
    const token = authHeader.substring(7)
    try {
        const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
        const payload = jwt.verify(token, secret)
        return { valid: true, payload }
    } catch {
        return { valid: false, error: 'Invalid or expired access token' }
    }
}

// GET /api/v1/privacy/consent/status - Get consent status for user
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id') || auth.payload.sub

        const admin = getSupabaseAdmin()

        // Get all consent types
        const { data: consents, error } = await admin
            .from('user_consents')
            .select(`
                consent_type,
                is_granted,
                granted_at,
                expires_at,
                scope,
                application_id,
                application:developer_applications(id, name)
            `)
            .eq('user_id', userId)
            .eq('is_active', true)

        if (error) throw error

        // Group by consent type
        const consentsByType: { [key: string]: any[] } = {}
        consents?.forEach(c => {
            if (!consentsByType[c.consent_type]) {
                consentsByType[c.consent_type] = []
            }
            const app = Array.isArray(c.application) ? c.application[0] : c.application
            consentsByType[c.consent_type].push({
                is_granted: c.is_granted,
                granted_at: c.granted_at,
                expires_at: c.expires_at,
                scope: c.scope,
                application: app ? { id: app.id, name: app.name } : null
            })
        })

        // Get wellbeing-specific consents
        const { data: wellbeingConsents } = await admin
            .from('wellbeing_consents')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)

        return NextResponse.json({
            user_id: userId,
            consent_types: consentsByType,
            wellbeing_consents: wellbeingConsents?.map(wc => ({
                type: wc.consent_type,
                is_granted: wc.is_granted,
                granted_at: wc.granted_at,
                can_share_with_parents: wc.can_share_with_parents,
                can_share_with_teachers: wc.can_share_with_teachers,
                can_share_with_third_party: wc.can_share_with_third_party
            })) || [],
            summary: {
                total_consents: consents?.length || 0,
                active_authorizations: consents?.filter(c => c.is_granted).length || 0,
                wellbeing_data_shared: wellbeingConsents?.some(wc => wc.can_share_with_third_party) || false
            }
        })
    } catch (error: any) {
        console.error('Privacy consent status error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}

// POST /api/v1/privacy/consent/request - Request consent for data access
export async function POST(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { user_id, consent_type, scope, purpose, expires_in_days } = body

        if (!user_id || !consent_type) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'user_id and consent_type are required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Create consent request
        const expiresAt = expires_in_days
            ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
            : null

        const { data: request_record, error } = await admin
            .from('consent_requests')
            .insert({
                user_id,
                application_id: auth.payload.app_id,
                consent_type,
                scope: scope || [],
                purpose,
                expires_at: expiresAt,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // Create notification for user
        await admin.from('notifications').insert({
            user_id,
            title: 'Data Access Request',
            message: `An application is requesting access to your ${consent_type} data.`,
            type: 'info',
            priority: 'high',
            action_url: `/settings/privacy/requests`,
            action_label: 'Review Request',
            source: 'third_party_app',
            source_app_id: auth.payload.app_id
        })

        return NextResponse.json({
            request_id: request_record.id,
            status: 'pending',
            message: 'Consent request created. User will be notified to approve or deny.',
            expires_at: expiresAt
        }, { status: 201 })
    } catch (error: any) {
        console.error('Privacy consent request error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
