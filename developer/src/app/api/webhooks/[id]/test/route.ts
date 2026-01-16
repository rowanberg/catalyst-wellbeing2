import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import crypto from 'crypto'

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

// POST /api/webhooks/[id]/test - Send test webhook
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const developer = await getAuthenticatedDeveloper()
        if (!developer) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: webhookId } = params
        const admin = getSupabaseAdmin()

        // Get webhook
        const { data: webhook, error } = await admin
            .from('application_webhooks')
            .select(`
                *,
                application:developer_applications(id, developer_id, name)
            `)
            .eq('id', webhookId)
            .single()

        if (error || !webhook) {
            return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        }

        // Verify ownership
        const app = Array.isArray(webhook.application) ? webhook.application[0] : webhook.application
        if (app?.developer_id !== developer.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 })
        }

        // Generate test event
        const testEvent = {
            id: `test_${crypto.randomUUID()}`,
            event: 'test.webhook',
            created_at: new Date().toISOString(),
            data: {
                message: 'This is a test webhook delivery',
                application_name: app.name,
                webhook_url: webhook.url,
                timestamp: Date.now()
            }
        }

        const payload = JSON.stringify(testEvent)
        const signature = crypto
            .createHmac('sha256', webhook.signing_secret)
            .update(payload)
            .digest('hex')
        const timestamp = Math.floor(Date.now() / 1000)

        // Send test webhook
        const startTime = Date.now()
        let response: Response
        let responseBody: string
        let success = false

        try {
            response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CatalystWells-Signature': signature,
                    'X-CatalystWells-Timestamp': String(timestamp),
                    'X-CatalystWells-Event': 'test.webhook',
                    'User-Agent': 'CatalystWells-Webhooks/1.0'
                },
                body: payload,
                signal: AbortSignal.timeout(30000)
            })

            responseBody = await response.text()
            success = response.ok
        } catch (err: any) {
            responseBody = err.message
            success = false
            response = { ok: false, status: 0 } as Response
        }

        const responseTime = Date.now() - startTime

        // Log delivery
        await admin.from('webhook_delivery_logs').insert({
            webhook_id: webhookId,
            event_id: testEvent.id,
            status: success ? 'success' : 'failed',
            http_status: response.status,
            response_body: responseBody?.substring(0, 1000),
            response_time_ms: responseTime,
            attempt_number: 1,
            is_test: true
        })

        return NextResponse.json({
            success,
            test_event_id: testEvent.id,
            delivery: {
                url: webhook.url,
                http_status: response.status,
                response_time_ms: responseTime,
                response_body: responseBody?.substring(0, 500)
            },
            request: {
                headers: {
                    'X-CatalystWells-Signature': signature.substring(0, 20) + '...',
                    'X-CatalystWells-Timestamp': String(timestamp),
                    'X-CatalystWells-Event': 'test.webhook'
                },
                body: testEvent
            },
            message: success
                ? 'Test webhook delivered successfully!'
                : 'Webhook delivery failed. Check your endpoint configuration.'
        })
    } catch (error: any) {
        console.error('Webhook test error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
