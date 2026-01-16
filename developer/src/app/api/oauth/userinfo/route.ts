import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'

// Create admin client
const getSupabaseAdmin = () => {
    const url = process.env.NEXT_PUBLIC_DEV_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.DEV_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error('Supabase admin credentials not configured')
    }

    return createClient(url, key, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Verify access token
function verifyAccessToken(token: string): any {
    try {
        const secret = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || 'dev-secret'
        return jwt.verify(token, secret)
    } catch {
        return null
    }
}

// GET /api/oauth/userinfo - Get user information
export async function GET(request: NextRequest) {
    try {
        // Get access token from header
        const authHeader = request.headers.get('authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({
                error: 'invalid_token',
                error_description: 'Missing or invalid authorization header'
            }, { status: 401 })
        }

        const accessToken = authHeader.substring(7)
        const decoded = verifyAccessToken(accessToken)

        if (!decoded) {
            return NextResponse.json({
                error: 'invalid_token',
                error_description: 'Invalid or expired access token'
            }, { status: 401 })
        }

        // Check if token has required scopes
        const scopes = decoded.scopes || []
        if (!scopes.includes('openid') && !scopes.includes('profile.read')) {
            return NextResponse.json({
                error: 'insufficient_scope',
                error_description: 'Token does not have required scopes (openid or profile.read)'
            }, { status: 403 })
        }

        const admin = getSupabaseAdmin()

        // Get user profile from main database
        const { data: profile, error } = await admin
            .from('profiles')
            .select('*')
            .eq('user_id', decoded.sub)
            .single()

        if (error || !profile) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'User profile not found'
            }, { status: 404 })
        }

        // Build response based on granted scopes
        const response: any = {
            sub: decoded.sub
        }

        // Profile scope
        if (scopes.includes('profile.read') || scopes.includes('openid')) {
            response.name = profile.full_name
            response.preferred_username = profile.username
            response.picture = profile.avatar_url
            response.updated_at = profile.updated_at
        }

        // Email scope
        if (scopes.includes('email.read') || scopes.includes('email')) {
            response.email = profile.email
            response.email_verified = profile.email_verified || false
        }

        // Phone scope (if available)
        if (scopes.includes('phone.read') && profile.phone_number) {
            response.phone_number = profile.phone_number
            response.phone_number_verified = profile.phone_verified || false
        }

        // Get additional data based on role
        if (scopes.includes('student.profile.read')) {
            const { data: student } = await admin
                .from('students')
                .select('id, enrollment_number, grade, section, school_id')
                .eq('user_id', decoded.sub)
                .single()

            if (student) {
                response.student = {
                    id: student.id,
                    enrollment_number: student.enrollment_number,
                    grade: student.grade,
                    section: student.section,
                    school_id: student.school_id
                }
            }
        }

        if (scopes.includes('teacher.profile.read')) {
            const { data: teacher } = await admin
                .from('teachers')
                .select('id, employee_id, department, designation')
                .eq('user_id', decoded.sub)
                .single()

            if (teacher) {
                response.teacher = {
                    id: teacher.id,
                    employee_id: teacher.employee_id,
                    department: teacher.department,
                    designation: teacher.designation
                }
            }
        }

        if (scopes.includes('parent.profile.read')) {
            const { data: parent } = await admin
                .from('parents')
                .select('id')
                .eq('user_id', decoded.sub)
                .single()

            if (parent) {
                // Get linked children
                const { data: children } = await admin
                    .from('student_parent_links')
                    .select('student:students(id, full_name, grade, section)')
                    .eq('parent_id', parent.id)
                    .eq('is_active', true)

                response.parent = {
                    id: parent.id,
                    children: children?.map(c => c.student) || []
                }
            }
        }

        // Add claims for role identification
        response.roles = []
        if (response.student) response.roles.push('student')
        if (response.teacher) response.roles.push('teacher')
        if (response.parent) response.roles.push('parent')

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Userinfo error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}

// POST /api/oauth/userinfo - Same as GET (for compatibility)
export async function POST(request: NextRequest) {
    return GET(request)
}
