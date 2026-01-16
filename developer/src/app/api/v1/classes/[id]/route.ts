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

// GET /api/v1/classes/[id] - Get class details
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'school.structure.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: school.structure.read'
        }, { status: 403 })
    }

    try {
        const { id: classId } = params
        const { searchParams } = new URL(request.url)
        const include = searchParams.get('include')?.split(',') || []

        const admin = getSupabaseAdmin()

        // Get class
        const { data: classData, error } = await admin
            .from('classes')
            .select(`
                id,
                name,
                grade,
                section,
                academic_year,
                capacity,
                room_number,
                school:schools(id, name, code)
            `)
            .eq('id', classId)
            .single()

        if (error || !classData) {
            return NextResponse.json({ error: 'not_found', error_description: 'Class not found' }, { status: 404 })
        }

        const schoolData = Array.isArray(classData.school) ? classData.school[0] : classData.school

        const response: any = {
            id: classData.id,
            name: classData.name,
            grade: classData.grade,
            section: classData.section,
            academic_year: classData.academic_year,
            capacity: classData.capacity,
            room_number: classData.room_number,
            school: schoolData ? {
                id: schoolData.id,
                name: schoolData.name,
                code: schoolData.code
            } : null
        }

        // Include students if requested
        if (include.includes('students')) {
            const { data: students } = await admin
                .from('class_students')
                .select(`
                    roll_number,
                    student:students(id, full_name, enrollment_number, avatar_url)
                `)
                .eq('class_id', classId)
                .eq('is_active', true)
                .order('roll_number')

            response.students = students?.map(s => {
                const student = Array.isArray(s.student) ? s.student[0] : s.student
                return {
                    id: student?.id,
                    name: student?.full_name,
                    enrollment_number: student?.enrollment_number,
                    roll_number: s.roll_number,
                    avatar_url: student?.avatar_url
                }
            }) || []
            response.student_count = response.students.length
        }

        // Include teachers if requested
        if (include.includes('teachers')) {
            const { data: teachers } = await admin
                .from('class_teachers')
                .select(`
                    is_class_teacher,
                    teacher:teachers(id, full_name, email, avatar_url),
                    subject:subjects(id, name, code)
                `)
                .eq('class_id', classId)

            response.teachers = teachers?.map(t => {
                const teacher = Array.isArray(t.teacher) ? t.teacher[0] : t.teacher
                const subject = Array.isArray(t.subject) ? t.subject[0] : t.subject
                return {
                    id: teacher?.id,
                    name: teacher?.full_name,
                    email: teacher?.email,
                    avatar_url: teacher?.avatar_url,
                    is_class_teacher: t.is_class_teacher,
                    subject: subject ? { id: subject.id, name: subject.name } : null
                }
            }) || []

            response.class_teacher = response.teachers.find((t: any) => t.is_class_teacher) || null
        }

        // Include subjects if requested
        if (include.includes('subjects')) {
            const { data: subjects } = await admin
                .from('class_subjects')
                .select(`
                    subject:subjects(id, name, code, color)
                `)
                .eq('class_id', classId)

            response.subjects = subjects?.map(s => {
                const subject = Array.isArray(s.subject) ? s.subject[0] : s.subject
                return {
                    id: subject?.id,
                    name: subject?.name,
                    code: subject?.code,
                    color: subject?.color
                }
            }) || []
        }

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: `/api/v1/classes/${classId}`,
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Classes API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
