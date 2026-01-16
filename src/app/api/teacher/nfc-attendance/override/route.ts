import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// POST - Override attendance status
export async function POST(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['teacher', 'admin'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const body = await request.json()
        const { attendanceId, studentId, periodId, classId, date, newStatus, reason } = body

        const validStatuses = ['present', 'absent', 'late', 'early_exit', 'partial', 'excused', 'half_day']
        if (!newStatus || !validStatuses.includes(newStatus)) {
            return NextResponse.json({
                error: 'Invalid status',
                validStatuses
            }, { status: 400 })
        }

        // If attendanceId provided, update existing record
        if (attendanceId) {
            const { data: updated, error: updateError } = await supabaseAdmin
                .from('period_attendance')
                .update({
                    final_status: newStatus,
                    is_overridden: true,
                    overridden_by: profile.id,
                    override_reason: reason || null,
                    overridden_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', attendanceId)
                .eq('school_id', profile.school_id)
                .select()
                .single()

            if (updateError) {
                console.error('Failed to update attendance:', updateError)
                return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
            }

            // Log audit
            await supabaseAdmin
                .from('aegisx_audit_log')
                .insert({
                    school_id: profile.school_id,
                    actor_id: profile.id,
                    actor_role: profile.role,
                    action: 'override_attendance',
                    entity_type: 'period_attendance',
                    entity_id: attendanceId,
                    new_values: { final_status: newStatus, override_reason: reason }
                })

            return NextResponse.json({
                record: {
                    id: updated.id,
                    finalStatus: updated.final_status,
                    isOverridden: updated.is_overridden,
                    overrideReason: updated.override_reason
                },
                message: 'Attendance overridden successfully'
            })
        }

        // If no attendanceId, create new record (for manual override of someone with no scan)
        if (!studentId || !periodId) {
            return NextResponse.json({
                error: 'Student ID and Period ID required for new records'
            }, { status: 400 })
        }

        const { data: created, error: createError } = await supabaseAdmin
            .from('period_attendance')
            .insert({
                school_id: profile.school_id,
                student_id: studentId,
                period_id: periodId,
                class_id: classId || null,
                attendance_date: date || new Date().toISOString().split('T')[0],
                auto_status: 'absent', // Was absent before override
                final_status: newStatus,
                is_overridden: true,
                overridden_by: profile.id,
                override_reason: reason || 'Manual entry by teacher',
                overridden_at: new Date().toISOString()
            })
            .select()
            .single()

        if (createError) {
            console.error('Failed to create attendance:', createError)
            return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 })
        }

        return NextResponse.json({
            record: {
                id: created.id,
                finalStatus: created.final_status,
                isOverridden: created.is_overridden,
                overrideReason: created.override_reason
            },
            message: 'Attendance recorded successfully'
        })

    } catch (error: any) {
        console.error('Error overriding attendance:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
