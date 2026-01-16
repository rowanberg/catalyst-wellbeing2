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

// GET /api/v1/attendance/student/[id] - Get student attendance
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'student.attendance.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.attendance.read'
        }, { status: 403 })
    }

    try {
        const { id: studentId } = params
        const { searchParams } = new URL(request.url)
        const startDate = searchParams.get('start_date')
        const endDate = searchParams.get('end_date')
        const month = searchParams.get('month')
        const limit = parseInt(searchParams.get('limit') || '30')

        const admin = getSupabaseAdmin()

        // Verify student exists
        const { data: student, error: studentError } = await admin
            .from('students')
            .select('id, full_name, grade, section, school_id')
            .eq('id', studentId)
            .single()

        if (studentError || !student) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Student not found'
            }, { status: 404 })
        }

        // Build attendance query
        let query = admin
            .from('attendance_records')
            .select(`
                id,
                date,
                status,
                check_in_time,
                check_out_time,
                marked_by,
                notes,
                is_holiday,
                created_at
            `)
            .eq('student_id', studentId)
            .order('date', { ascending: false })
            .limit(limit)

        // Apply date filters
        if (startDate) {
            query = query.gte('date', startDate)
        }
        if (endDate) {
            query = query.lte('date', endDate)
        }
        if (month) {
            // month format: YYYY-MM
            const [year, monthNum] = month.split('-')
            const startOfMonth = `${year}-${monthNum}-01`
            const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
            query = query.gte('date', startOfMonth).lte('date', endOfMonth)
        }

        const { data: records, error } = await query

        if (error) throw error

        // Calculate summary
        const totalDays = records?.length || 0
        const present = records?.filter(r => r.status === 'present').length || 0
        const absent = records?.filter(r => r.status === 'absent').length || 0
        const late = records?.filter(r => r.status === 'late').length || 0
        const excused = records?.filter(r => r.status === 'excused').length || 0
        const holidays = records?.filter(r => r.is_holiday).length || 0

        const workingDays = totalDays - holidays
        const attendanceRate = workingDays > 0 ? (present + late) / workingDays : 0

        // Log API call (fire and forget)
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: `/api/v1/attendance/student/${studentId}`,
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json({
            student: {
                id: student.id,
                name: student.full_name,
                grade: student.grade,
                section: student.section
            },
            summary: {
                total_days: totalDays,
                working_days: workingDays,
                present,
                absent,
                late,
                excused,
                holidays,
                attendance_rate: Math.round(attendanceRate * 100) / 100
            },
            records: records?.map(r => ({
                date: r.date,
                status: r.status,
                check_in_time: r.check_in_time,
                check_out_time: r.check_out_time,
                is_holiday: r.is_holiday,
                notes: r.notes
            })) || [],
            period: {
                start_date: startDate || (records && records.length > 0 ? records[records.length - 1].date : null),
                end_date: endDate || (records && records.length > 0 ? records[0].date : null)
            }
        })
    } catch (error: any) {
        console.error('Attendance API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
