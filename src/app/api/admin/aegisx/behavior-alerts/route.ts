import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch behavior alerts
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['admin', 'teacher'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { searchParams } = new URL(request.url)
        const resolved = searchParams.get('resolved')
        const severity = searchParams.get('severity')
        const alertType = searchParams.get('type')
        const limit = parseInt(searchParams.get('limit') || '100')

        let query = supabaseAdmin
            .from('behavior_alerts')
            .select(`
                *,
                student:profiles!behavior_alerts_student_id_fkey(id, first_name, last_name, student_tag),
                resolver:profiles!behavior_alerts_resolved_by_fkey(id, first_name, last_name)
            `)
            .eq('school_id', profile.school_id)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (resolved === 'true') {
            query = query.eq('is_resolved', true)
        } else if (resolved === 'false') {
            query = query.eq('is_resolved', false)
        }

        if (severity) {
            query = query.eq('severity', severity)
        }

        if (alertType) {
            query = query.eq('alert_type', alertType)
        }

        const { data: alerts, error: fetchError } = await query

        if (fetchError) {
            // Table might not exist
            if (fetchError.code === '42P01') {
                return NextResponse.json({
                    alerts: [],
                    message: 'Behavior alerts table not configured.'
                })
            }
            console.error('Failed to fetch alerts:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
        }

        // Transform to camelCase
        const transformedAlerts = (alerts || []).map(a => ({
            id: a.id,
            studentId: a.student_id,
            studentName: a.student ? `${a.student.first_name} ${a.student.last_name}` : 'Unknown',
            studentTag: a.student?.student_tag,
            alertType: a.alert_type,
            severity: a.severity,
            title: a.title,
            description: a.description,
            details: a.details || {},
            relatedScanIds: a.related_scan_ids,
            isResolved: a.is_resolved,
            resolvedBy: a.resolver ? `${a.resolver.first_name} ${a.resolver.last_name}` : null,
            resolvedAt: a.resolved_at,
            resolutionNotes: a.resolution_notes,
            actionTaken: a.action_taken,
            parentNotified: a.parent_notified,
            adminNotified: a.admin_notified,
            createdAt: a.created_at
        }))

        return NextResponse.json({ alerts: transformedAlerts })

    } catch (error: any) {
        console.error('Error fetching behavior alerts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Create a new behavior alert (mostly used by system, but can be manual)
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const body = await request.json()
        const {
            studentId, alertType, severity, title, description,
            details, relatedScanIds, notifyParent, notifyAdmin
        } = body

        if (!studentId || !alertType || !severity) {
            return NextResponse.json({
                error: 'Student ID, alert type, and severity are required'
            }, { status: 400 })
        }

        const { data: alert, error: insertError } = await supabaseAdmin
            .from('behavior_alerts')
            .insert({
                school_id: profile.school_id,
                student_id: studentId,
                alert_type: alertType,
                severity,
                title: title || `${alertType.replace('_', ' ')} detected`,
                description: description || null,
                details: details || {},
                related_scan_ids: relatedScanIds || null,
                parent_notified: false,
                admin_notified: true
            })
            .select()
            .single()

        if (insertError) {
            console.error('Failed to create alert:', insertError)
            return NextResponse.json({
                error: 'Failed to create alert',
                details: insertError.message
            }, { status: 500 })
        }

        // Queue notifications if requested
        if (notifyParent) {
            // Queue parent notification
            await supabaseAdmin
                .from('notification_queue')
                .insert({
                    school_id: profile.school_id,
                    related_student_id: studentId,
                    notification_type: 'unusual_activity',
                    title: title || 'Behavior Alert',
                    message: description || `A behavior alert has been raised for your child.`,
                    delivery_channel: 'push',
                    priority: severity === 'critical' ? 'urgent' : 'high'
                })

            await supabaseAdmin
                .from('behavior_alerts')
                .update({ parent_notified: true })
                .eq('id', alert.id)
        }

        return NextResponse.json({
            alert: {
                id: alert.id,
                alertType: alert.alert_type,
                severity: alert.severity,
                title: alert.title,
                createdAt: alert.created_at
            },
            message: 'Alert created successfully'
        })

    } catch (error: any) {
        console.error('Error creating behavior alert:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
