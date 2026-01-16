import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

// Service Role Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch current emergency mode
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['admin', 'teacher'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        // Get active emergency mode
        const { data: mode, error: fetchError } = await supabaseAdmin
            .from('emergency_modes')
            .select(`
                *,
                activator:activated_by (
                    id, first_name, last_name
                )
            `)
            .eq('school_id', profile.school_id)
            .eq('is_active', true)
            .order('activated_at', { ascending: false })
            .limit(1)
            .single()

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
            console.error('Failed to fetch emergency mode:', fetchError)
            return NextResponse.json({
                error: 'Failed to fetch emergency mode',
                details: fetchError.message
            }, { status: 500 })
        }

        // If no active mode, return normal
        if (!mode) {
            return NextResponse.json({
                mode: {
                    modeType: 'normal',
                    isActive: false
                }
            })
        }

        return NextResponse.json({
            mode: {
                id: mode.id,
                modeType: mode.mode_type,
                isActive: mode.is_active,
                activatedBy: mode.activator ? `${mode.activator.first_name} ${mode.activator.last_name}` : null,
                activatedAt: mode.activated_at,
                activationReason: mode.activation_reason,
                autoDeactivateAt: mode.auto_deactivate_at,
                affectedReaderIds: mode.affected_reader_ids
            }
        })

    } catch (error: any) {
        console.error('Error fetching emergency mode:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// POST - Activate/Change emergency mode
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { requiredRole: 'admin' })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const body = await request.json()
        const { modeType, reason, autoDeactivateMinutes, affectedReaderIds } = body

        const validModes = ['normal', 'lockdown', 'emergency_unlock', 'silent_mode', 'exam_mode', 'evacuation']
        if (!validModes.includes(modeType)) {
            return NextResponse.json({
                error: 'Invalid mode type',
                validModes
            }, { status: 400 })
        }

        // Deactivate current active modes
        await supabaseAdmin
            .from('emergency_modes')
            .update({
                is_active: false,
                deactivated_by: profile.id,
                deactivated_at: new Date().toISOString()
            })
            .eq('school_id', profile.school_id)
            .eq('is_active', true)

        // If returning to normal, just deactivate
        if (modeType === 'normal') {
            // Log audit event
            await supabaseAdmin
                .from('aegisx_audit_log')
                .insert({
                    school_id: profile.school_id,
                    actor_id: profile.id,
                    actor_role: profile.role,
                    action: 'deactivate_emergency_mode',
                    entity_type: 'emergency_modes',
                    new_values: { mode_type: 'normal' }
                })

            // Push command to all readers
            await pushEmergencyCommandToReaders(profile.school_id, 'normal', null)

            return NextResponse.json({
                mode: {
                    modeType: 'normal',
                    isActive: false
                },
                message: 'Emergency mode deactivated, returning to normal operation'
            })
        }

        // Calculate auto-deactivation time
        let autoDeactivateAt: string | null = null
        if (autoDeactivateMinutes && autoDeactivateMinutes > 0) {
            const deactivateDate = new Date()
            deactivateDate.setMinutes(deactivateDate.getMinutes() + autoDeactivateMinutes)
            autoDeactivateAt = deactivateDate.toISOString()
        }

        // Create new emergency mode
        const { data: mode, error: insertError } = await supabaseAdmin
            .from('emergency_modes')
            .insert({
                school_id: profile.school_id,
                mode_type: modeType,
                is_active: true,
                activated_by: profile.id,
                activated_at: new Date().toISOString(),
                activation_reason: reason || null,
                auto_deactivate_at: autoDeactivateAt,
                affected_reader_ids: affectedReaderIds || null
            })
            .select()
            .single()

        if (insertError) {
            console.error('Failed to activate emergency mode:', insertError)
            return NextResponse.json({
                error: 'Failed to activate emergency mode',
                details: insertError.message
            }, { status: 500 })
        }

        // Log audit event
        await supabaseAdmin
            .from('aegisx_audit_log')
            .insert({
                school_id: profile.school_id,
                actor_id: profile.id,
                actor_role: profile.role,
                action: 'activate_emergency_mode',
                entity_type: 'emergency_modes',
                entity_id: mode.id,
                new_values: mode
            })

        // Push command to all readers immediately
        await pushEmergencyCommandToReaders(profile.school_id, modeType, reason)

        // Queue admin notifications
        await queueEmergencyNotifications(profile.school_id, modeType, reason, profile.id)

        return NextResponse.json({
            mode: {
                id: mode.id,
                modeType: mode.mode_type,
                isActive: mode.is_active,
                activatedAt: mode.activated_at,
                activationReason: mode.activation_reason,
                autoDeactivateAt: mode.auto_deactivate_at
            },
            message: `${modeType.replace('_', ' ')} mode activated successfully`
        })

    } catch (error: any) {
        console.error('Error activating emergency mode:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Helper: Push emergency command to all readers
async function pushEmergencyCommandToReaders(
    schoolId: string,
    modeType: string,
    reason: string | null
) {
    try {
        // Get all readers for this school
        const { data: readers } = await supabaseAdmin
            .from('nfc_readers')
            .select('id')
            .eq('school_id', schoolId)
            .eq('enabled', true)

        if (!readers || readers.length === 0) return

        // Create command for each reader
        const commands = readers.map(reader => ({
            reader_id: reader.id,
            command_type: 'emergency_mode',
            payload: {
                mode: modeType,
                reason: reason,
                timestamp: new Date().toISOString()
            },
            priority: 100, // Highest priority
            status: 'pending',
            created_at: new Date().toISOString()
        }))

        await supabaseAdmin
            .from('nfc_command_queue')
            .insert(commands)

    } catch (error) {
        console.error('Failed to push emergency commands:', error)
    }
}

// Helper: Queue emergency notifications for staff
async function queueEmergencyNotifications(
    schoolId: string,
    modeType: string,
    reason: string | null,
    activatedBy: string
) {
    try {
        // Get all admin/teacher profiles for the school
        const { data: staff } = await supabaseAdmin
            .from('profiles')
            .select('id, role')
            .eq('school_id', schoolId)
            .in('role', ['admin', 'teacher'])

        if (!staff || staff.length === 0) return

        const modeLabels: Record<string, string> = {
            lockdown: '🔒 LOCKDOWN',
            emergency_unlock: '🔓 EMERGENCY UNLOCK',
            silent_mode: '🔕 Silent Mode',
            exam_mode: '📝 Exam Mode',
            evacuation: '🚨 EVACUATION'
        }

        const notifications = staff.map(person => ({
            school_id: schoolId,
            recipient_id: person.id,
            recipient_type: person.role,
            notification_type: 'emergency_broadcast',
            title: `${modeLabels[modeType] || modeType} Activated`,
            message: reason || `School is now in ${modeType.replace('_', ' ')} mode`,
            delivery_channel: 'push',
            priority: 'urgent',
            created_at: new Date().toISOString()
        }))

        await supabaseAdmin
            .from('notification_queue')
            .insert(notifications)

    } catch (error) {
        console.error('Failed to queue emergency notifications:', error)
    }
}
