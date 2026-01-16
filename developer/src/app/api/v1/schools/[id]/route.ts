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

// GET /api/v1/schools/[id] - Get school information
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

    if (!hasScope(auth.payload, 'school.structure.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: school.structure.read'
        }, { status: 403 })
    }

    try {
        const { id: schoolId } = params
        const { searchParams } = new URL(request.url)
        const include = searchParams.get('include')?.split(',') || []

        const admin = getSupabaseAdmin()

        // Get school
        const { data: school, error } = await admin
            .from('schools')
            .select(`
                id,
                name,
                code,
                address,
                city,
                state,
                country,
                phone,
                email,
                website,
                logo_url,
                academic_year,
                timezone,
                established_year
            `)
            .eq('id', schoolId)
            .single()

        if (error || !school) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'School not found'
            }, { status: 404 })
        }

        const response: any = {
            id: school.id,
            name: school.name,
            code: school.code,
            contact: {
                address: school.address,
                city: school.city,
                state: school.state,
                country: school.country,
                phone: school.phone,
                email: school.email,
                website: school.website
            },
            logo_url: school.logo_url,
            academic_year: school.academic_year,
            timezone: school.timezone,
            established_year: school.established_year
        }

        // Include grades if requested
        if (include.includes('grades')) {
            const { data: grades } = await admin
                .from('grades')
                .select('id, name, level, display_order')
                .eq('school_id', schoolId)
                .order('display_order')

            response.grades = grades || []
        }

        // Include sections if requested
        if (include.includes('sections')) {
            const { data: sections } = await admin
                .from('sections')
                .select('id, name, grade_id')
                .eq('school_id', schoolId)
                .order('name')

            response.sections = sections || []
        }

        // Include departments if requested
        if (include.includes('departments')) {
            const { data: departments } = await admin
                .from('departments')
                .select('id, name, head_id')
                .eq('school_id', schoolId)
                .order('name')

            response.departments = departments || []
        }

        // Include academic terms if requested
        if (include.includes('terms')) {
            const { data: terms } = await admin
                .from('academic_terms')
                .select('id, name, start_date, end_date, is_current')
                .eq('school_id', schoolId)
                .order('start_date', { ascending: false })

            response.terms = terms || []
        }

        // Include statistics if requested
        if (include.includes('stats')) {
            const { count: studentCount } = await admin
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', schoolId)

            const { count: teacherCount } = await admin
                .from('teachers')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', schoolId)

            const { count: classCount } = await admin
                .from('classes')
                .select('*', { count: 'exact', head: true })
                .eq('school_id', schoolId)

            response.stats = {
                total_students: studentCount || 0,
                total_teachers: teacherCount || 0,
                total_classes: classCount || 0
            }
        }

        // Log API call (fire and forget)
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: auth.payload.sub,
                endpoint: `/api/v1/schools/${schoolId}`,
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Schools API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
