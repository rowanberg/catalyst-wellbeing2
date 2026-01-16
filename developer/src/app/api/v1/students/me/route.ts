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

// Verify access token and extract info
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
    } catch (error: any) {
        return { valid: false, error: 'Invalid or expired access token' }
    }
}

// Check if scope is granted
function hasScope(payload: any, requiredScope: string): boolean {
    const scopes = payload.scopes || []
    return scopes.includes(requiredScope) || scopes.includes('*')
}

// Rate limit check (simplified)
async function checkRateLimit(appId: string, admin: any): Promise<{ allowed: boolean; remaining: number }> {
    // In production, use Redis or similar for rate limiting
    // This is a simplified version
    return { allowed: true, remaining: 100 }
}

// GET /api/v1/students/me - Get current authenticated student
export async function GET(request: NextRequest) {
    const auth = verifyAccessToken(request)
    if (!auth.valid) {
        return NextResponse.json({
            error: 'unauthorized',
            error_description: auth.error
        }, { status: 401 })
    }

    if (!hasScope(auth.payload, 'student.profile.read') && !hasScope(auth.payload, 'profile.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Token missing required scope: student.profile.read'
        }, { status: 403 })
    }

    try {
        const admin = getSupabaseAdmin()
        const userId = auth.payload.sub

        // Check rate limit
        const rateLimit = await checkRateLimit(auth.payload.app_id, admin)
        if (!rateLimit.allowed) {
            return NextResponse.json({
                error: 'rate_limit_exceeded',
                error_description: 'Too many requests'
            }, {
                status: 429,
                headers: { 'Retry-After': '60' }
            })
        }

        // Get student profile
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
                school:schools(id, name, code),
                class:classes(id, name, grade, section)
            `)
            .eq('user_id', userId)
            .single()

        if (error || !student) {
            return NextResponse.json({
                error: 'not_found',
                error_description: 'Student profile not found for this user'
            }, { status: 404 })
        }

        // Log API call for analytics (fire and forget)
        try {
            await admin.from('api_request_logs').insert({
                application_id: auth.payload.app_id,
                user_id: userId,
                endpoint: '/api/v1/students/me',
                method: 'GET',
                response_status: 200
            })
        } catch {
            // Ignore logging errors
        }

        // Handle Supabase join returns (can be array or object)
        const schoolData = Array.isArray(student.school) ? student.school[0] : student.school
        const classData = Array.isArray(student.class) ? student.class[0] : student.class

        // Build response based on scopes
        const response: any = {
            id: student.id,
            enrollment_number: student.enrollment_number,
            name: student.full_name,
            grade: student.grade,
            section: student.section,
            roll_number: student.roll_number,
            avatar_url: student.avatar_url
        }

        // Add school info
        if (schoolData) {
            response.school = {
                id: schoolData.id,
                name: schoolData.name,
                code: schoolData.code
            }
        }

        // Add class info
        if (classData) {
            response.class = {
                id: classData.id,
                name: classData.name
            }
        }

        // Add sensitive data only with proper scope
        if (hasScope(auth.payload, 'student.profile.read')) {
            response.date_of_birth = student.date_of_birth
            response.gender = student.gender
            response.admission_date = student.admission_date
            response.blood_group = student.blood_group
        }

        return NextResponse.json(response, {
            headers: {
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'Cache-Control': 'private, max-age=60'
            }
        })
    } catch (error: any) {
        console.error('Students API error:', error)
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message || 'Internal server error'
        }, { status: 500 })
    }
}
