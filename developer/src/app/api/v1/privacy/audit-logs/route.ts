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

function hasScope(payload: any, requiredScope: string): boolean {
    const scopes = payload.scopes || []
    return scopes.includes(requiredScope) || scopes.includes('*')
}

// GET /api/v1/privacy/audit-logs - Get audit logs for data access
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'privacy.audit.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: privacy.audit.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('user_id') || auth.payload.sub
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const action = searchParams.get('action')
        const limit = parseInt(searchParams.get('limit') || '100')

        const admin = getSupabaseAdmin()

        let query = admin
            .from('data_access_logs')
            .select(`
                id,
                action,
                resource_type,
                resource_id,
                data_accessed,
                ip_address,
                user_agent,
                created_at,
                application:developer_applications(id, name)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (startDate) {
            query = query.gte('created_at', startDate)
        }
        if (endDate) {
            query = query.lte('created_at', endDate)
        }
        if (action) {
            query = query.eq('action', action)
        }

        const { data: logs, error } = await query

        if (error) throw error

        // Group by application
        const byApp: { [key: string]: number } = {}
        logs?.forEach(log => {
            const app = Array.isArray(log.application) ? log.application[0] : log.application
            const appName = app?.name || 'Unknown'
            byApp[appName] = (byApp[appName] || 0) + 1
        })

        // Group by action
        const byAction: { [key: string]: number } = {}
        logs?.forEach(log => {
            byAction[log.action] = (byAction[log.action] || 0) + 1
        })

        // Group by resource type
        const byResource: { [key: string]: number } = {}
        logs?.forEach(log => {
            byResource[log.resource_type] = (byResource[log.resource_type] || 0) + 1
        })

        return NextResponse.json({
            user_id: userId,
            total_logs: logs?.length || 0,
            summary: {
                by_application: byApp,
                by_action: byAction,
                by_resource: byResource
            },
            logs: logs?.map(log => {
                const app = Array.isArray(log.application) ? log.application[0] : log.application
                return {
                    id: log.id,
                    action: log.action,
                    resource_type: log.resource_type,
                    resource_id: log.resource_id,
                    data_accessed: log.data_accessed,
                    ip_address: log.ip_address,
                    timestamp: log.created_at,
                    application: app ? { id: app.id, name: app.name } : null
                }
            }) || [],
            retention_policy: {
                log_retention_days: 365,
                message: 'Audit logs are retained for 365 days as per compliance requirements.'
            }
        })
    } catch (error: any) {
        console.error('Audit logs API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
