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

// GET /api/v1/teachers/me - Get current teacher profile
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'teacher.profile.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: teacher.profile.read'
        }, { status: 403 })
    }

    try {
        const admin = getSupabaseAdmin()
        const userId = auth.payload.sub

        const { data: teacher, error } = await admin
            .from('teachers')
            .select(`
                id,
                employee_id,
                full_name,
                email,
                phone,
                date_of_birth,
                gender,
                qualification,
                experience_years,
                specialization,
                hire_date,
                avatar_url,
                bio,
                school:schools(id, name, code),
                department:departments(id, name)
            `)
            .eq('user_id', userId)
            .single()

        if (error || !teacher) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Teacher profile not found for this user'
            }, { status: 404 })
        }

        // Handle join results
        const schoolData = Array.isArray(teacher.school) ? teacher.school[0] : teacher.school
        const departmentData = Array.isArray(teacher.department) ? teacher.department[0] : teacher.department

        // Get classes taught
        const { data: classes } = await admin
            .from('class_teachers')
            .select(`
                class:classes(id, name, grade, section),
                is_class_teacher,
                subject:subjects(id, name, code)
            `)
            .eq('teacher_id', teacher.id)

        // Get subjects taught
        const { data: subjects } = await admin
            .from('teacher_subjects')
            .select(`
                subject:subjects(id, name, code)
            `)
            .eq('teacher_id', teacher.id)

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: userId,
                endpoint: '/api/v1/teachers/me',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            id: teacher.id,
            employee_id: teacher.employee_id,
            name: teacher.full_name,
            email: teacher.email,
            phone: teacher.phone,
            qualification: teacher.qualification,
            experience_years: teacher.experience_years,
            specialization: teacher.specialization,
            hire_date: teacher.hire_date,
            avatar_url: teacher.avatar_url,
            bio: teacher.bio,
            school: schoolData ? {
                id: schoolData.id,
                name: schoolData.name,
                code: schoolData.code
            } : null,
            department: departmentData ? {
                id: departmentData.id,
                name: departmentData.name
            } : null,
            classes: classes?.map(c => ({
                class: {
                    id: (c.class as any)?.id,
                    name: (c.class as any)?.name,
                    grade: (c.class as any)?.grade,
                    section: (c.class as any)?.section
                },
                is_class_teacher: c.is_class_teacher,
                subject: c.subject ? {
                    id: (c.subject as any)?.id,
                    name: (c.subject as any)?.name
                } : null
            })) || [],
            subjects: subjects?.map(s => ({
                id: (s.subject as any)?.id,
                name: (s.subject as any)?.name,
                code: (s.subject as any)?.code
            })) || []
        })
    } catch (error: any) {
        console.error('Teachers API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
