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

// GET /api/v1/timetable/student/[id] - Get student timetable
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

    if (!hasScope(auth.payload, 'student.timetable.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.timetable.read'
        }, { status: 403 })
    }

    try {
        const { id: studentId } = params
        const { searchParams } = new URL(request.url)
        const day = searchParams.get('day')
        const week = searchParams.get('week')

        const admin = getSupabaseAdmin()

        // Get student and their class
        const { data: student, error: studentError } = await admin
            .from('students')
            .select('id, full_name, grade, section, class_id')
            .eq('id', studentId)
            .single()

        if (studentError || !student) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Student not found'
            }, { status: 404 })
        }

        // Build timetable query
        let query = admin
            .from('timetable_entries')
            .select(`
                id,
                day_of_week,
                period_number,
                start_time,
                end_time,
                room,
                subject:subjects(id, name, code, color),
                teacher:teachers(id, full_name, avatar_url)
            `)
            .eq('class_id', student.class_id)
            .order('day_of_week')
            .order('period_number')

        // Filter by day if specified
        if (day) {
            query = query.eq('day_of_week', day.toLowerCase())
        }

        const { data: entries, error } = await query

        if (error) throw error

        // Group by day of week
        const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        const timetable: { [key: string]: any[] } = {}

        weekdays.forEach(d => {
            timetable[d] = []
        })

        entries?.forEach((entry: any) => {
            const dayKey = entry.day_of_week.toLowerCase()
            // Handle both array and object returns from Supabase joins
            const subjectData = Array.isArray(entry.subject) ? entry.subject[0] : entry.subject
            const teacherData = Array.isArray(entry.teacher) ? entry.teacher[0] : entry.teacher

            if (timetable[dayKey]) {
                timetable[dayKey].push({
                    period: entry.period_number,
                    start_time: entry.start_time,
                    end_time: entry.end_time,
                    subject: subjectData ? {
                        id: subjectData.id,
                        name: subjectData.name,
                        code: subjectData.code,
                        color: subjectData.color
                    } : null,
                    teacher: teacherData ? {
                        id: teacherData.id,
                        name: teacherData.full_name,
                        avatar_url: teacherData.avatar_url
                    } : null,
                    room: entry.room
                })
            }
        })

        // Get today's schedule
        const today = new Date()
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        const todayName = dayNames[today.getDay()]
        const todaySchedule = timetable[todayName] || []

        // Calculate next class
        const currentTime = today.toTimeString().slice(0, 5) // HH:MM
        const nextClass = todaySchedule.find((period: any) => period.start_time > currentTime)

        // Log API call (fire and forget)
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: `/api/v1/timetable/student/${studentId}`,
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
            today: {
                day: todayName,
                schedule: todaySchedule,
                next_class: nextClass || null
            },
            week: day ? { [day.toLowerCase()]: timetable[day.toLowerCase()] } : timetable,
            total_periods: entries?.length || 0
        })
    } catch (error: any) {
        console.error('Timetable API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
