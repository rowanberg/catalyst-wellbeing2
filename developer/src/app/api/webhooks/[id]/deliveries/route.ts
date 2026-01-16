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

// GET /api/webhooks/[id]/deliveries - Get webhook delivery logs
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: webhookId } = params
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')
        const status = searchParams.get('status')
        const startDate = searchParams.get('start_date')

        const admin = getSupabaseAdmin()

        // Verify webhook ownership
        const { data: webhook } = await admin
            .from('application_webhooks')
            .select(`
                id,
                url,
                application:developer_applications(developer_id)
            `)
            .eq('id', webhookId)
            .single()

        if (!webhook) {
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        const app = Array.isArray(webhook.application) ? webhook.application[0] : webhook.application
        if (app?.developer_id !== developer.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Get deliveries
        let query = admin
            .from('webhook_delivery_logs')
            .select('*')
            .eq('webhook_id', webhookId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (status) {
            query = query.eq('status', status)
        }
        if (startDate) {
            query = query.gte('created_at', startDate)
        }

        const { data: deliveries, error } = await query

        if (error) throw error

        // Calculate statistics
        const total = deliveries?.length || 0
        const successful = deliveries?.filter(d => d.status === 'success').length || 0
        const failed = deliveries?.filter(d => d.status === 'failed').length || 0
        const avgResponseTime = deliveries?.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / (total || 1)

        return NextResponse.json({
            webhook_id: webhookId,
            url: webhook.url,
            statistics: {
                total_deliveries: total,
                successful,
                failed,
                success_rate: total > 0 ? (successful / total * 100).toFixed(1) + '%' : 'N/A',
                average_response_time_ms: Math.round(avgResponseTime)
            },
            deliveries: deliveries?.map(d => ({
                id: d.id,
                event_id: d.event_id,
                status: d.status,
                http_status: d.http_status,
                response_time_ms: d.response_time_ms,
                attempt_number: d.attempt_number,
                error_message: d.error_message,
                delivered_at: d.delivered_at || d.created_at,
                is_test: d.is_test || false
            })) || []
        })
    } catch (error: any) {
        console.error('Webhook deliveries error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
