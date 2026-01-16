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

// GET /api/schools/linked - Get linked schools for an application
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')

        if (!applicationId) {
            return NextResponse.json({ error: 'application_id required' }, { status: 400 })
        }

        const admin = getSupabaseAdmin()
        const mainDb = getMainSupabase()

        // Verify application belongs to developer
        const { data: app } = await admin
            .from('developer_applications')
            .select('id, name')
            .eq('id', applicationId)
            .eq('developer_id', developer.id)
            .single()

        if (!app) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 })
        }

        // Get approved school links
        const { data: links, error } = await admin
            .from('school_access_requests')
            .select('*')
            .eq('application_id', applicationId)
            .eq('status', 'approved')
            .order('reviewed_at', { ascending: false })

        if (error) throw error

        // Get school details
        const schoolIds = links?.map(l => l.school_id) || []
        const { data: schools } = await mainDb
            .from('schools')
            .select('id, name, code, logo_url, city, state')
            .in('id', schoolIds)

        // Get usage stats per school
        const { data: usageStats } = await admin
            .from('api_request_logs')
            .select('metadata->school_id')
            .eq('application_id', applicationId)
            .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

        const usageBySchool: { [key: string]: number } = {}
        usageStats?.forEach(u => {
            const schoolId = (u as any).school_id
            if (schoolId) {
                usageBySchool[schoolId] = (usageBySchool[schoolId] || 0) + 1
            }
        })

        const schoolMap: { [key: string]: any } = {}
        schools?.forEach(s => { schoolMap[s.id] = s })

        return NextResponse.json({
            application: {
                id: app.id,
                name: app.name
            },
            total_schools: links?.length || 0,
            schools: links?.map(link => {
                const school = schoolMap[link.school_id]
                return {
                    id: link.id,
                    school: school ? {
                        id: school.id,
                        name: school.name,
                        code: school.code,
                        logo_url: school.logo_url,
                        location: school.city ? `${school.city}, ${school.state}` : null
                    } : { id: link.school_id },
                    approved_scopes: link.approved_scopes,
                    approved_at: link.reviewed_at,
                    is_enabled: link.is_enabled !== false,
                    usage_last_30_days: usageBySchool[link.school_id] || 0
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Linked schools error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
