import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch period attendance records
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['teacher', 'admin'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { searchParams } = new URL(request.url)
        const periodId = searchParams.get('periodId')
        const classId = searchParams.get('classId')
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

        if (!periodId || !classId) {
            return NextResponse.json({
                error: 'Period ID and Class ID are required'
            }, { status: 400 })
        }

        // Get students in the class
        const { data: students, error: studentsError } = await supabaseAdmin
            .from('student_class_assignments')
            .select(`
                student_id,
                student:profiles!student_class_assignments_student_id_fkey (
                    id, first_name, last_name, student_tag, avatar_url
                )
            `)
            .eq('class_id', classId)
            .eq('is_active', true)

        if (studentsError) {
            console.error('Failed to fetch students:', studentsError)
            return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
        }

        // Get attendance records for this period and date
        const { data: records, error: recordsError } = await supabaseAdmin
            .from('period_attendance')
            .select(`
                *,
                entry_reader:nfc_readers!period_attendance_entry_reader_id_fkey(name),
                exit_reader:nfc_readers!period_attendance_exit_reader_id_fkey(name),
                overrider:profiles!period_attendance_overridden_by_fkey(first_name, last_name)
            `)
            .eq('period_id', periodId)
            .eq('class_id', classId)
            .eq('attendance_date', date)

        if (recordsError && recordsError.code !== '42P01') {
            console.error('Failed to fetch attendance:', recordsError)
            return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
        }

        // Merge students with their attendance
        const attendanceMap = new Map((records || []).map(r => [r.student_id, r]))

        const mergedRecords = (students || []).map(s => {
            const student = s.student as any
            const attendance = attendanceMap.get(student?.id)

            return {
                id: attendance?.id || null,
                studentId: student?.id,
                studentName: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
                studentTag: student?.student_tag,
                avatarUrl: student?.avatar_url,
                periodId,
                actualEntryTime: attendance?.actual_entry_time || null,
                actualExitTime: attendance?.actual_exit_time || null,
                autoStatus: attendance?.auto_status || 'absent',
                finalStatus: attendance?.final_status || null,
                lateByMinutes: attendance?.late_by_minutes || 0,
                earlyExitByMinutes: attendance?.early_exit_by_minutes || 0,
                isOverridden: attendance?.is_overridden || false,
                overrideReason: attendance?.override_reason,
                overriddenBy: attendance?.overrider
                    ? `${attendance.overrider.first_name} ${attendance.overrider.last_name}`
                    : null,
                entryReaderName: attendance?.entry_reader?.name,
                exitReaderName: attendance?.exit_reader?.name
            }
        })

        return NextResponse.json({ records: mergedRecords })

    } catch (error: any) {
        console.error('Error fetching attendance records:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
