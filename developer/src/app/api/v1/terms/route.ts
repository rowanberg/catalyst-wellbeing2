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

// GET /api/v1/terms - List academic terms
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
        const academicYearId = searchParams.get('academic_year_id')
        const current = searchParams.get('current') === 'true'

        const admin = getSupabaseAdmin()
        const now = new Date()

        let query = admin
            .from('terms')
            .select(`
                id,
                name,
                term_number,
                start_date,
                end_date,
                is_current,
                academic_year:academic_years(id, name),
                school:schools(id, name)
            `)
            .order('term_number')

        if (schoolId) {
            query = query.eq('school_id', schoolId)
        }
        if (academicYearId) {
            query = query.eq('academic_year_id', academicYearId)
        }
        if (current) {
            query = query.eq('is_current', true)
        }

        const { data: terms, error } = await query

        if (error) throw error

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/terms',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: terms?.length || 0,
            current_term: terms?.find(t => t.is_current) || null,
            terms: terms?.map(t => {
                const academicYear = Array.isArray(t.academic_year) ? t.academic_year[0] : t.academic_year
                const school = Array.isArray(t.school) ? t.school[0] : t.school
                const startDate = new Date(t.start_date)
                const endDate = new Date(t.end_date)

                let status = 'upcoming'
                if (now >= startDate && now <= endDate) status = 'active'
                else if (now > endDate) status = 'completed'

                // Calculate progress
                let progress = 0
                if (status === 'active') {
                    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    const elapsedDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
                    progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100))
                } else if (status === 'completed') {
                    progress = 100
                }

                return {
                    id: t.id,
                    name: t.name,
                    term_number: t.term_number,
                    start_date: t.start_date,
                    end_date: t.end_date,
                    is_current: t.is_current,
                    status,
                    progress_percent: progress,
                    days_remaining: status === 'active'
                        ? Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                        : null,
                    academic_year: academicYear ? { id: academicYear.id, name: academicYear.name } : null,
                    school: school ? { id: school.id, name: school.name } : null
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Terms API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
