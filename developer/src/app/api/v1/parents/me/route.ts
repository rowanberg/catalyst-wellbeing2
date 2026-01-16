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

// GET /api/v1/parents/me - Get current parent profile
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({ error: 'unauthorized', error_description: auth.error }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'parent.profile.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: parent.profile.read'
        }, { status: 403 })
    }

    try {
        const admin = getSupabaseAdmin()
        const userId = auth.payload.sub

        const { data: parent, error } = await admin
            .from('parents')
            .select(`
                id,
                full_name,
                email,
                phone,
                alternate_phone,
                occupation,
                relationship,
                address,
                avatar_url
            `)
            .eq('user_id', userId)
            .single()

        if (error || !parent) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Parent profile not found for this user'
            }, { status: 404 })
        }

        // Get linked children
        const { data: children } = await admin
            .from('student_parent_links')
            .select(`
                relationship,
                is_primary_contact,
                is_emergency_contact,
                can_pickup,
                student:students(
                    id,
                    full_name,
                    enrollment_number,
                    grade,
                    section,
                    avatar_url,
                    school:schools(id, name, code)
                )
            `)
            .eq('parent_id', parent.id)
            .eq('is_active', true)

        // Log API call
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: userId,
                endpoint: '/api/v1/parents/me',
                method: 'GET',
                response_status: 200
            })
        } catch { }

        return NextResponse.json({
            id: parent.id,
            name: parent.full_name,
            email: parent.email,
            phone: parent.phone,
            alternate_phone: parent.alternate_phone,
            occupation: parent.occupation,
            relationship: parent.relationship,
            address: parent.address,
            avatar_url: parent.avatar_url,
            children: children?.map(c => {
                const studentData = Array.isArray(c.student) ? c.student[0] : c.student
                const schoolData = studentData?.school
                const school = Array.isArray(schoolData) ? schoolData[0] : schoolData

                return {
                    relationship: c.relationship,
                    is_primary_contact: c.is_primary_contact,
                    is_emergency_contact: c.is_emergency_contact,
                    can_pickup: c.can_pickup,
                    student: {
                        id: studentData?.id,
                        name: studentData?.full_name,
                        enrollment_number: studentData?.enrollment_number,
                        grade: studentData?.grade,
                        section: studentData?.section,
                        avatar_url: studentData?.avatar_url,
                        school: school ? {
                            id: school.id,
                            name: school.name
                        } : null
                    }
                }
            }) || [],
            children_count: children?.length || 0
        })
    } catch (error: any) {
        console.error('Parents API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
