import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const getMainSupabase = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getAuthenticatedDeveloper() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_DEV_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        { cookies: { getAll() { return cookieStore.getAll() } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const admin = getSupabaseAdmin()
    const { data: account } = await admin
        .from('developer_accounts')
        .select('*')
        .eq('auth_user_id', user.id)
        .single()

    return account
}

// POST /api/schools/request - Request access to a school
export async function POST(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { application_id, school_id, requested_scopes, purpose, data_usage_declaration } = body

        if (!application_id || !school_id) {
            return NextResponse.json({
                error: 'application_id and school_id are required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()
        const mainDb = getMainSupabase()

        // Verify application belongs to developer
        const { data: app } = await admin
            .from('developer_applications')
            .select('*')
            .eq('id', application_id)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Verify school exists
        const { data: school } = await mainDb
            .from('schools')
            .select('id, name, code')
            .eq('id', school_id)
            .single()

        if (!school) {
            return NextResponse.json({ error: 'School not found' }, { status: 404 })
        }

        // Check for existing request
        const { data: existingRequest } = await admin
            .from('school_access_requests')
            .select('id, status')
            .eq('application_id', application_id)
            .eq('school_id', school_id)
            .in('status', ['pending', 'approved'])
            .single()

        if (existingRequest) {
            return NextResponse.json({
                error: existingRequest.status === 'approved'
                    ? 'Already have access to this school'
                    : 'Request already pending',
                existing_request_id: existingRequest.id
            }, { status: 409 })
        }

        // Create access request
        const { data: accessRequest, error } = await admin
            .from('school_access_requests')
            .insert({
                application_id,
                school_id,
                developer_id: developer.id,
                requested_scopes: requested_scopes || app.requested_scopes || [],
                purpose,
                data_usage_declaration,
                status: 'pending'
            })
            .select()
            .single()

        if (error) throw error

        // Create notification for school admin
        await mainDb.from('notifications').insert({
            school_id,
            role: 'school_admin',
            title: 'New Application Access Request',
            message: `"${app.name}" is requesting access to your school's data.`,
            type: 'info',
            priority: 'high',
            action_url: `/admin/integrations/requests/${accessRequest.id}`,
            action_label: 'Review Request',
            source: 'system'
        })

        // Log activity
        await admin.from('developer_activity_logs').insert({
            developer_id: developer.id,
            application_id,
            action: 'school_access_requested',
            resource_type: 'school',
            resource_id: school_id,
            details: { school_name: school.name, purpose },
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
        })

        return NextResponse.json({
            request_id: accessRequest.id,
            school: {
                id: school.id,
                name: school.name,
                code: school.code
            },
            status: 'pending',
            message: 'Access request submitted. The school administrator will review your request.'
        }, { status: 201 })
    } catch (error: any) {
        console.error('School access request error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// GET /api/schools/request - Get access requests status
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')
        const status = searchParams.get('status')

        const admin = getSupabaseAdmin()
        const mainDb = getMainSupabase()

        let query = admin
            .from('school_access_requests')
            .select('*')
            .eq('developer_id', developer.id)
            .order('created_at', { ascending: false })

        if (applicationId) {
            query = query.eq('application_id', applicationId)
        }
        if (status) {
            query = query.eq('status', status)
        }

        const { data: requests, error } = await query

        if (error) throw error

        // Get school details
        const schoolIds = [...new Set(requests?.map(r => r.school_id) || [])]
        const { data: schools } = await mainDb
            .from('schools')
            .select('id, name, code, logo_url')
            .in('id', schoolIds)

        const schoolMap: { [key: string]: any } = {}
        schools?.forEach(s => { schoolMap[s.id] = s })

        return NextResponse.json({
            total: requests?.length || 0,
            requests: requests?.map(r => ({
                id: r.id,
                application_id: r.application_id,
                school: schoolMap[r.school_id] || { id: r.school_id },
                requested_scopes: r.requested_scopes,
                approved_scopes: r.approved_scopes,
                purpose: r.purpose,
                status: r.status,
                rejection_reason: r.rejection_reason,
                created_at: r.created_at,
                reviewed_at: r.reviewed_at
            })) || []
        })
    } catch (error: any) {
        console.error('School access requests error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
