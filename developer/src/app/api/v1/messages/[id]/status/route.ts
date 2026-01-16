import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin credentials not configured')
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

const getDevSupabase = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
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

function hasScope(payload: any, requiredScope: string): boolean {
    const scopes = payload.scopes || []
    return scopes.includes(requiredScope) || scopes.includes('*')
}

// GET /api/v1/messages/[id]/status - Get message delivery status
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'notifications.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: notifications.read'
        }, { status: 403 })
    }

    try {
        const { id: messageId } = params
        const admin = getSupabaseAdmin()
        const devDb = getDevSupabase()

        // Get notification
        const { data: notification, error } = await admin
            .from('notifications')
            .select(`
                id,
                user_id,
                title,
                message,
                type,
                priority,
                is_read,
                read_at,
                is_dismissed,
                dismissed_at,
                action_clicked,
                action_clicked_at,
                created_at,
                source_app_id
            `)
            .eq('id', messageId)
            .single()

        if (error || !notification) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Message not found'
            }, { status: 404 })
        }

        // Verify ownership (notification was sent by this app)
        if (notification.source_app_id !== auth.payload.app_id) {
            return NextResponse.json({
                error: 'forbidden',
                error_description: 'Cannot access notifications from other applications'
            }, { status: 403 })
        }

        // Get delivery status from logs
        const { data: deliveryLogs } = await devDb
            .from('notification_delivery_logs')
            .select('*')
            .eq('notification_id', messageId)
            .order('created_at', { ascending: false })

        // Calculate status
        let status = 'pending'
        if (notification.is_read) {
            status = 'read'
        } else if (notification.is_dismissed) {
            status = 'dismissed'
        } else {
            // Check if push was delivered
            const pushDelivered = deliveryLogs?.some(l => l.channel === 'push' && l.status === 'delivered')
            if (pushDelivered) status = 'delivered'
        }

        // Log API call
        try {
            await devDb.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: `/api/v1/messages/${messageId}/status`,
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            message_id: notification.id,
            user_id: notification.user_id,
            title: notification.title,
            status,
            delivery: {
                sent_at: notification.created_at,
                delivered_at: deliveryLogs?.find(l => l.status === 'delivered')?.delivered_at || null,
                read_at: notification.read_at,
                dismissed_at: notification.dismissed_at
            },
            engagement: {
                is_read: notification.is_read,
                read_at: notification.read_at,
                action_clicked: notification.action_clicked || false,
                action_clicked_at: notification.action_clicked_at
            },
            channels: deliveryLogs?.map(l => ({
                channel: l.channel,
                status: l.status,
                delivered_at: l.delivered_at,
                error: l.error_message
            })) || []
        })
    } catch (error: any) {
        console.error('Message status API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }
}
