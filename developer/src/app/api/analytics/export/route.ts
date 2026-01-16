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

// GET /api/analytics/export - Export analytics data
export async function GET(request: NextRequest) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const applicationId = searchParams.get('application_id')
        const format = searchParams.get('format') || 'json' // json or csv
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const dataType = searchParams.get('type') || 'api_calls' // api_calls, webhooks, users

        const admin = getSupabaseAdmin()

        // Verify application belongs to developer
        if (applicationId) {
            const { data: app } = await admin
                .from('developer_applications')
                .select('id')
                .eq('id', applicationId)
                .eq('developer_id', developer.id)
                .single()

            if (!app) {
                return NextResponse.json({ error: 'Application not found' }, { status: 404 })
            }
        }

        let data: any[] = []
        const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const defaultEndDate = new Date().toISOString()

        switch (dataType) {
            case 'api_calls':
                let apiQuery = admin
                    .from('api_request_logs')
                    .select('*')
                    .gte('created_at', startDate || defaultStartDate)
                    .lte('created_at', endDate || defaultEndDate)
                    .order('created_at', { ascending: false })
                    .limit(10000)

                if (applicationId) {
                    apiQuery = apiQuery.eq('application_id', applicationId)
                }

                const { data: apiLogs } = await apiQuery
                data = apiLogs || []
                break

            case 'webhooks':
                let webhookQuery = admin
                    .from('webhook_delivery_logs')
                    .select(`
                        *,
                        webhook:application_webhooks(url, events)
                    `)
                    .gte('created_at', startDate || defaultStartDate)
                    .lte('created_at', endDate || defaultEndDate)
                    .order('created_at', { ascending: false })
                    .limit(10000)

                if (applicationId) {
                    webhookQuery = webhookQuery.eq('webhook.application_id', applicationId)
                }

                const { data: webhookLogs } = await webhookQuery
                data = webhookLogs || []
                break

            case 'users':
                let userQuery = admin
                    .from('user_authorizations')
                    .select(`
                        user_id,
                        scopes,
                        first_authorized_at,
                        last_used_at,
                        is_active
                    `)
                    .order('first_authorized_at', { ascending: false })
                    .limit(10000)

                if (applicationId) {
                    userQuery = userQuery.eq('application_id', applicationId)
                }

                const { data: users } = await userQuery
                data = users || []
                break
        }

        if (format === 'csv') {
            // Convert to CSV
            if (data.length === 0) {
                return new NextResponse('No data available', {
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="${dataType}_export.csv"`
                    }
                })
            }

            const headers = Object.keys(data[0])
            const csvRows = [headers.join(',')]

            data.forEach(row => {
                const values = headers.map(h => {
                    const val = row[h]
                    if (val === null || val === undefined) return ''
                    if (typeof val === 'object') return `"${JSON.stringify(val).replace(/"/g, '""')}"`
                    return `"${String(val).replace(/"/g, '""')}"`
                })
                csvRows.push(values.join(','))
            })

            return new NextResponse(csvRows.join('\n'), {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename="${dataType}_export_${new Date().toISOString().split('T')[0]}.csv"`
                }
            })
        }

        return NextResponse.json({
            type: dataType,
            period: {
                start: startDate || defaultStartDate,
                end: endDate || defaultEndDate
            },
            total_records: data.length,
            data
        })
    } catch (error: any) {
        console.error('Analytics export error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
