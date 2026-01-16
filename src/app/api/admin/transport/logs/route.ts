import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { authenticateRequest } from '@/lib/auth/api-auth'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
)

// GET - Fetch transport logs
export async function GET(request: NextRequest) {
    try {
        const authResult = await authenticateRequest(request, { allowedRoles: ['admin', 'teacher'] })

        if ('error' in authResult) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status })
        }

        const profile = authResult.profile

        const { searchParams } = new URL(request.url)
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
        const routeId = searchParams.get('routeId')

        let query = supabaseAdmin
            .from('transport_logs')
            .select(`
                *,
                student:profiles!transport_logs_student_id_fkey(id, first_name, last_name, student_tag),
                route:transport_routes!transport_logs_route_id_fkey(route_name, route_code)
            `)
            .eq('school_id', profile.school_id)
            .eq('log_date', date)
            .order('boarding_time', { ascending: false, nullsFirst: false })

        if (routeId) {
            query = query.eq('route_id', routeId)
        }

        const { data: logs, error: fetchError } = await query

        if (fetchError) {
            // Table might not exist
            if (fetchError.code === '42P01') {
                return NextResponse.json({
                    logs: [],
                    message: 'Transport tables not configured.'
                })
            }
            console.error('Failed to fetch logs:', fetchError)
            return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
        }

        // Transform to camelCase
        const transformedLogs = (logs || []).map(l => ({
            id: l.id,
            studentId: l.student_id,
            studentName: l.student ? `${l.student.first_name} ${l.student.last_name}` : 'Unknown',
            studentTag: l.student?.student_tag,
            routeId: l.route_id,
            routeName: l.route?.route_name,
            routeCode: l.route?.route_code,
            logDate: l.log_date,
            boardingTime: l.boarding_time,
            boardingStop: l.boarding_stop,
            dropTime: l.drop_time,
            dropStop: l.drop_stop,
            boardingStatus: l.boarding_status,
            dropStatus: l.drop_status,
            isWrongBus: l.is_wrong_bus,
            parentNotified: l.parent_notified
        }))

        return NextResponse.json({ logs: transformedLogs })

    } catch (error: any) {
        console.error('Error fetching transport logs:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
