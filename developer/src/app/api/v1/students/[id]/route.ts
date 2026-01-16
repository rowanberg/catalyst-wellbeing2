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

// GET /api/v1/students/[id] - Get student by ID
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

    if (!hasScope(auth.payload, 'student.profile.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.profile.read'
        }, { status: 403 })
    }

    try {
        const { id } = params
        const admin = getSupabaseAdmin()

        // Get student
        const { data: student, error } = await admin
            .from('students')
            .select(`
                id,
                enrollment_number,
                full_name,
                date_of_birth,
                gender,
                grade,
                section,
                roll_number,
                admission_date,
                blood_group,
                avatar_url,
                school_id,
                school:schools(id, name, code),
                class:classes(id, name, grade, section)
            `)
            .eq('id', id)
            .single()

        if (error || !student) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Student not found'
            }, { status: 404 })
        }

        // Check authorization:
        // - Teachers can view students in their classes
        // - Parents can view their linked children
        // - Same user can view their own data
        // - School admins can view any student in their school

        const userId = auth.payload.sub
        let authorized = false

        // Check if this is the student's own data
        const { data: selfStudent } = await admin
            .from('students')
            .select('id')
            .eq('user_id', userId)
            .eq('id', id)
            .single()

        if (selfStudent) {
            authorized = true
        }

        // Check if requester is a teacher with this student
        if (!authorized) {
            const { data: teacher } = await admin
                .from('teachers')
                .select('id')
                .eq('user_id', userId)
                .single()

            if (teacher) {
                // First get the class IDs for this teacher
                const { data: teacherClasses } = await admin
                    .from('class_teachers')
                    .select('class_id')
                    .eq('teacher_id', teacher.id)

                if (teacherClasses && teacherClasses.length > 0) {
                    const classIds = teacherClasses.map((c: any) => c.class_id)
                    const { data: classLink } = await admin
                        .from('class_students')
                        .select('id')
                        .eq('student_id', id)
                        .in('class_id', classIds)
                        .limit(1)
                        .single()

                    if (classLink) authorized = true
                }
            }
        }

        // Check if requester is a parent of this student
        if (!authorized) {
            // First get the parent ID
            const { data: parent } = await admin
                .from('parents')
                .select('id')
                .eq('user_id', userId)
                .single()

            if (parent) {
                const { data: parentLink } = await admin
                    .from('student_parent_links')
                    .select('id')
                    .eq('student_id', id)
                    .eq('parent_id', parent.id)
                    .eq('is_active', true)
                    .single()

                if (parentLink) authorized = true
            }
        }

        // For sandbox mode, allow all access
        if (auth.payload.app_id && !authorized) {
            const { data: app } = await admin
                .from('developer_applications')
                .select('environment')
                .eq('id', auth.payload.app_id)
                .single()

            if (app?.environment === 'sandbox') {
                authorized = true
            }
        }

        if (!authorized) {
            return NextResponse.json({
                error: 'forbidden',
                error_description: 'Access to this student data is not authorized'
            }, { status: 403 })
        }

        // Handle Supabase join returns (can be array or object)
        const schoolData = Array.isArray(student.school) ? student.school[0] : student.school
        const classData = Array.isArray(student.class) ? student.class[0] : student.class

        // Build response
        const response: any = {
            id: student.id,
            enrollment_number: student.enrollment_number,
            name: student.full_name,
            grade: student.grade,
            section: student.section,
            roll_number: student.roll_number,
            avatar_url: student.avatar_url,
            date_of_birth: student.date_of_birth,
            gender: student.gender,
            school: schoolData ? {
                id: schoolData.id,
                name: schoolData.name,
                code: schoolData.code
            } : null,
            class: classData ? {
                id: classData.id,
                name: classData.name
            } : null
        }

        // Log API call (fire and forget)
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: userId,
                endpoint: `/api/v1/students/${id}`,
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Students API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
