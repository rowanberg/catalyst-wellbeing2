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

// GET /api/v1/wellbeing/alerts - Get wellness alerts
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'wellbeing.alerts.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: wellbeing.alerts.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const studentId = searchParams.get('student_id')
        const classId = searchParams.get('class_id')
        const schoolId = searchParams.get('school_id')
        const severity = searchParams.get('severity')
        const status = searchParams.get('status') || 'active'
        const limit = parseInt(searchParams.get('limit') || '50')

        const admin = getSupabaseAdmin()

        let query = admin
            .from('wellness_alerts')
            .select(`
                id,
                alert_type,
                severity,
                title,
                description,
                status,
                suggested_actions,
                created_at,
                resolved_at,
                student:students(id, full_name, grade, section)
            `)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (studentId) {
            query = query.eq('student_id', studentId)
        }
        if (classId) {
            query = query.eq('class_id', classId)
        }
        if (schoolId) {
            query = query.eq('school_id', schoolId)
        }
        if (severity) {
            query = query.eq('severity', severity)
        }
        if (status) {
            query = query.eq('status', status)
        }

        const { data: alerts, error } = await query

        if (error) throw error

        // Group by severity
        const bySeverity = {
            low: alerts?.filter(a => a.severity === 'low').length || 0,
            medium: alerts?.filter(a => a.severity === 'medium').length || 0,
            high: alerts?.filter(a => a.severity === 'high').length || 0,
            critical: alerts?.filter(a => a.severity === 'critical').length || 0
        }

        // Group by type
        const byType: { [key: string]: number } = {}
        alerts?.forEach(a => {
            byType[a.alert_type] = (byType[a.alert_type] || 0) + 1
        })

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/wellbeing/alerts',
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            total_alerts: alerts?.length || 0,
            by_severity: bySeverity,
            by_type: byType,
            alerts: alerts?.map(a => ({
                id: a.id,
                type: a.alert_type,
                severity: a.severity,
                title: a.title,
                description: a.description,
                status: a.status,
                suggested_actions: a.suggested_actions,
                created_at: a.created_at,
                resolved_at: a.resolved_at,
                student: {
                    id: (a.student as any)?.id,
                    name: (a.student as any)?.full_name,
                    grade: (a.student as any)?.grade,
                    section: (a.student as any)?.section
                }
            })),
            disclaimer: 'Alerts are for educational purposes only. For mental health emergencies, contact appropriate professionals.'
        })
    } catch (error: any) {
        console.error('Wellness alerts API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// POST /api/v1/wellbeing/alerts/subscribe - Subscribe to alerts
export async function POST(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'wellbeing.alerts.subscribe')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: wellbeing.alerts.subscribe'
        }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { alert_types, severity_levels, school_id, class_id, webhook_url } = body

        if (!webhook_url) {
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'webhook_url is required'
            }, { status: 400 })
        }

        const admin = getSupabaseAdmin()

        // Create subscription
        const { data: subscription, error } = await admin
            .from('alert_subscriptions')
            .insert({
                application_id: auth.payload.app_id,
                alert_types: alert_types || ['all'],
                severity_levels: severity_levels || ['medium', 'high', 'critical'],
                school_id,
                class_id,
                webhook_url,
                is_active: true
            })
            .select()
            .single()

        if (error) throw error

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/wellbeing/alerts/subscribe',
                method: 'POST',
                response_status: 201
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            subscription_id: subscription.id,
            status: 'active',
            alert_types: subscription.alert_types,
            severity_levels: subscription.severity_levels,
            webhook_url: subscription.webhook_url,
            message: 'Successfully subscribed to wellness alerts'
        }, { status: 201 })
    } catch (error: any) {
        console.error('Alert subscription API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
