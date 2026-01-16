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

// GET /api/v1/academic-years - List academic years
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
        const current = searchParams.get('current') === 'true'

        const admin = getSupabaseAdmin()
        const now = new Date()

        let query = admin
            .from('academic_years')
            .select(`
                id,
                name,
                start_date,
                end_date,
                is_current,
                school:schools(id, name)
            `)
            .order('start_date', { ascending: false })

        if (schoolId) {
            query = query.eq('school_id', schoolId)
        }
        if (current) {
            query = query.eq('is_current', true)
        }

        const { data: years, error } = await query

        if (error) throw error

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: '/api/v1/academic-years',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            total: years?.length || 0,
            current_year: years?.find(y => y.is_current) || null,
            academic_years: years?.map(y => {
                const school = Array.isArray(y.school) ? y.school[0] : y.school
                const startDate = new Date(y.start_date)
                const endDate = new Date(y.end_date)

                let status = 'upcoming'
                if (now >= startDate && now <= endDate) status = 'active'
                else if (now > endDate) status = 'completed'

                return {
                    id: y.id,
                    name: y.name,
                    start_date: y.start_date,
                    end_date: y.end_date,
                    is_current: y.is_current,
                    status,
                    duration_months: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)),
                    school: school ? { id: school.id, name: school.name } : null
                }
            }) || []
        })
    } catch (error: any) {
        console.error('Academic years API error:', error)
        return NextResponse.json({ error: 'server_error', error_description: error.message }, { status: 500 })
    }
}
