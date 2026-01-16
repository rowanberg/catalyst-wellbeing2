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

// GET /api/v1/subjects - List subjects
export async function GET(request: NextRequest) {
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
        const { searchParams } = new URL(request.url)
        const schoolId = searchParams.get('school_id')
        const gradeLevel = searchParams.get('grade_level')
        const department = searchParams.get('department')

        const admin = getSupabaseAdmin()

        let query = admin
            .from('subjects')
            .select(`
                id,
                name,
                code,
                description,
                color,
                credits,
                grade_level,
                is_mandatory,
                department:departments(id, name),
                school:schools(id, name)
            `)
            .order('name')

        if (schoolId) {
            query = query.eq('school_id', schoolId)
        }
        if (gradeLevel) {
            query = query.eq('grade_level', gradeLevel)
        }
        if (department) {
            query = query.eq('department_id', department)
        }

        const { data: subjects, error } = await query

        if (error) throw error

        // Group by department
        const byDepartment: { [key: string]: any[] } = {}
        subjects?.forEach(s => {
            const dept = Array.isArray(s.department) ? s.department[0] : s.department
            const deptName = dept?.name || 'General'
            if (!byDepartment[deptName]) {
                byDepartment[deptName] = []
            }
            byDepartment[deptName].push({
                id: s.id,
                name: s.name,
                code: s.code,
                description: s.description,
                color: s.color,
                credits: s.credits,
                grade_level: s.grade_level,
                is_mandatory: s.is_mandatory
            })
        })

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/subjects',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: subjects?.length || 0,
            by_department: byDepartment,
            subjects: subjects?.map(s => {
                const dept = Array.isArray(s.department) ? s.department[0] : s.department
                const school = Array.isArray(s.school) ? s.school[0] : s.school
                return {
                    id: s.id,
                    name: s.name,
                    code: s.code,
                    description: s.description,
                    color: s.color,
                    credits: s.credits,
                    grade_level: s.grade_level,
                    is_mandatory: s.is_mandatory,
                    department: dept ? { id: dept.id, name: dept.name } : null,
                    school: school ? { id: school.id, name: school.name } : null
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Subjects API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
