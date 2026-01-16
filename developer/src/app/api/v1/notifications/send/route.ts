import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_MAIN_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.MAIN_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Verify access token
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

// POST /api/v1/notifications/send - Send notification to user
export async function POST(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'notifications.send')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: notifications.send'
        }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { user_id, title, message, type, priority, action_url, action_label, data } = body

        // Validate required fields
        if (!user_id || !title || !message) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Missing required fields: user_id, title, message'
            }, { status: 400 })
        }

        // Validate type
        const validTypes = ['info', 'success', 'warning', 'error', 'announcement']
        if (type && !validTypes.includes(type)) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: `Invalid type. Must be one of: ${validTypes.join(', ')}`
            }, { status: 400 })
        }

        // Validate priority
        const validPriorities = ['low', 'normal', 'high', 'urgent']
        if (priority && !validPriorities.includes(priority)) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: `Invalid priority. Must be one of: ${validPriorities.join(', ')}`
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Verify user exists
        const { data: user } = await admin
            .from('profiles')
            .select('id, full_name')
            .eq('user_id', user_id)
            .single()

        if (!user) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'User not found'
            }, { status: 404 })
        }

        // Check notification preferences
        const { data: prefs } = await admin
            .from('notification_preferences')
            .select('allow_third_party_notifications')
            .eq('user_id', user_id)
            .single()

        if (prefs && !prefs.allow_third_party_notifications) {
            return NextResponse.json({
                error: 'notifications_disabled',
                error_description: 'User has disabled third-party notifications'
            }, { status: 403 })
        }

        // Create notification
        const { data: notification, error } = await admin
            .from('notifications')
            .insert({
                user_id,
                title,
                message,
                type: type || 'info',
                priority: priority || 'normal',
                action_url,
                action_label,
                source: 'third_party_app',
                source_app_id: auth.payload.app_id,
                metadata: data || {}
            })
            .select()
            .single()

        if (error) throw error

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/notifications/send',
                method: 'POST',
                response_status: 201
            })
        } catch {
            // Ignore logging errors
        }

        // Increment notification count for analytics
        try {
            await admin.rpc('increment_notifications_sent', {
                app_id: auth.payload.app_id
            })
        } catch {
            // Ignore analytics errors
        }

        return NextResponse.json({
            notification_id: notification.id,
            status: 'sent',
            recipient: {
                user_id,
                name: user.full_name
            },
            sent_at: notification.created_at,
            message: 'Notification sent successfully'
        }, { status: 201 })
    } catch (error: any) {
        console.error('Notifications API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// POST /api/v1/notifications/bulk - Send bulk notifications
export async function PUT(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'notifications.send')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: notifications.send'
        }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { user_ids, title, message, type, priority, action_url, action_label } = body

        // Validate
        if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'user_ids must be a non-empty array'
            }, { status: 400 })
        }

        if (user_ids.length > 1000) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Maximum 1000 recipients per bulk send'
            }, { status: 400 })
        }

        if (!title || !message) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Missing required fields: title, message'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Filter users who allow third-party notifications
        const { data: allowedUsers } = await admin
            .from('notification_preferences')
            .select('user_id')
            .in('user_id', user_ids)
            .eq('allow_third_party_notifications', true)

        const allowedUserIds = allowedUsers?.map(u => u.user_id) || []

        if (allowedUserIds.length === 0) {
            return NextResponse.json({
                error: 'no_recipients',
                error_description: 'No users have enabled third-party notifications'
            }, { status: 400 })
        }

        // Create notifications
        const notifications = allowedUserIds.map(user_id => ({
            user_id,
            title,
            message,
            type: type || 'info',
            priority: priority || 'normal',
            action_url,
            action_label,
            source: 'third_party_app',
            source_app_id: auth.payload.app_id
        }))

        const { data, error } = await admin
            .from('notifications')
            .insert(notifications)
            .select('id')

        if (error) throw error

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/notifications/bulk',
                method: 'PUT',
                response_status: 201
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            status: 'sent',
            total_requested: user_ids.length,
            total_sent: data?.length || 0,
            skipped: user_ids.length - (data?.length || 0),
            message: `Sent ${data?.length || 0} notifications successfully`
        }, { status: 201 })
    } catch (error: any) {
        console.error('Bulk notifications API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
