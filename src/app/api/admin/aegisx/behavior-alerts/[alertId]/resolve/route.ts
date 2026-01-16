import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

interface RouteParams {
    params: Promise<{ alertId: string }>
}

// POST - Resolve a behavior alert
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['admin', 'teacher'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { alertId } = await params
        const body = await request.json()
        const { resolutionNotes, actionTaken } = body

        // Get existing alert
        const { data: existingAlert } = await supabaseAdmin
            .from('behavior_alerts')
            .select('*')
            .eq('id', alertId)
            .eq('school_id', profile.school_id)
            .single()

        if (!existingAlert) {
            return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
        }

        if (existingAlert.is_resolved) {
            return NextResponse.json({ error: 'Alert is already resolved' }, { status: 400 })
        }

        // Update alert as resolved
        const { data: updatedAlert, error: updateError } = await supabaseAdmin
            .from('behavior_alerts')
            .update({
                is_resolved: true,
                resolved_by: profile.id,
                resolved_at: new Date().toISOString(),
                resolution_notes: resolutionNotes || null,
                action_taken: actionTaken || null
            })
            .eq('id', alertId)
            .select()
            .single()

        if (updateError) {
            console.error('Failed to resolve alert:', updateError)
            return NextResponse.json({
                error: 'Failed to resolve alert',
                details: updateError.message
            }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin
            .from('aegisx_audit_log')
            .insert({
                school_id: profile.school_id,
                actor_id: profile.id,
                actor_role: profile.role,
                action: 'resolve_behavior_alert',
                entity_type: 'behavior_alerts',
                entity_id: alertId,
                old_values: { is_resolved: false },
                new_values: {
                    is_resolved: true,
                    resolution_notes: resolutionNotes,
                    action_taken: actionTaken
                }
            })

        return NextResponse.json({
            alert: {
                id: updatedAlert.id,
                isResolved: updatedAlert.is_resolved,
                resolvedAt: updatedAlert.resolved_at,
                resolutionNotes: updatedAlert.resolution_notes,
                actionTaken: updatedAlert.action_taken
            },
            message: 'Alert resolved successfully'
        })

    } catch (error: any) {
        console.error('Error resolving behavior alert:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
