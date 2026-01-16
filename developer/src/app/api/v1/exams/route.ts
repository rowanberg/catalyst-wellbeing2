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

// GET /api/v1/exams - List exams
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'student.academic.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.academic.read'
        }, { status: 403 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const schoolId = searchParams.get('school_id')
        const gradeId = searchParams.get('grade_id')
        const term = searchParams.get('term')
        const examType = searchParams.get('type') // unit_test, mid_term, final, etc.
        const academicYear = searchParams.get('academic_year')
        const upcoming = searchParams.get('upcoming') === 'true'
        const limit = parseInt(searchParams.get('limit') || '50')

        const admin = getSupabaseAdmin()
        const now = new Date()
        const today = now.toISOString().split('T')[0]

        let query = admin
            .from('exams')
            .select(`
                id,
                name,
                type,
                term,
                academic_year,
                start_date,
                end_date,
                description,
                is_published,
                results_published,
                school:schools(id, name),
                grade:grades(id, name, level)
            `)
            .order('start_date', { ascending: true })
            .limit(limit)

        if (schoolId) {
            query = query.eq('school_id', schoolId)
        }
        if (gradeId) {
            query = query.eq('grade_id', gradeId)
        }
        if (term) {
            query = query.eq('term', term)
        }
        if (examType) {
            query = query.eq('type', examType)
        }
        if (academicYear) {
            query = query.eq('academic_year', academicYear)
        }
        if (upcoming) {
            query = query.gte('start_date', today)
        }

        const { data: exams, error } = await query

        if (error) throw error

        // Group by type
        const byType: { [key: string]: number } = {}
        exams?.forEach(e => {
            byType[e.type] = (byType[e.type] || 0) + 1
        })

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/exams',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: exams?.length || 0,
            by_type: byType,
            exams: exams?.map(e => {
                const school = Array.isArray(e.school) ? e.school[0] : e.school
                const grade = Array.isArray(e.grade) ? e.grade[0] : e.grade
                const startDate = new Date(e.start_date)
                const endDate = new Date(e.end_date)

                let status = 'scheduled'
                if (now >= startDate && now <= endDate) {
                    status = 'in_progress'
                } else if (now > endDate) {
                    status = e.results_published ? 'results_published' : 'completed'
                }

                return {
                    id: e.id,
                    name: e.name,
                    type: e.type,
                    term: e.term,
                    academic_year: e.academic_year,
                    start_date: e.start_date,
                    end_date: e.end_date,
                    description: e.description,
                    status,
                    is_published: e.is_published,
                    results_published: e.results_published,
                    days_until_start: Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                    duration_days: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
                    school: school ? { id: school.id, name: school.name } : null,
                    grade: grade ? { id: grade.id, name: grade.name, level: grade.level } : null
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Exams API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
