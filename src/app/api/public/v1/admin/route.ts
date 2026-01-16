/**
 * ============================================================================
 * Public API v1 - Admin Endpoints
 * ============================================================================
 * Secure endpoints for third-party apps with admin access
 * Uses ACTUAL CatalystWells database tables and column names
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    authenticateOAuthRequest,
    oauthErrorResponse,
    hasScope,
    OAuthCredentials
} from '@/lib/auth/oauth-api-auth'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

export async function GET(request: NextRequest) {
    const auth = await authenticateOAuthRequest(request)

    if ('error' in auth) {
        return oauthErrorResponse(auth)
    }

    // Verify admin role
    if (auth.userRole !== 'admin' && auth.userRole !== 'super_admin') {
        return NextResponse.json({
            error: 'forbidden',
            error_description: 'Admin access required'
        }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'dashboard'

    switch (action) {
        case 'dashboard':
            return handleGetDashboard(auth, supabase)
        case 'users':
            return handleGetUsers(auth, supabase, searchParams)
        case 'user':
            return handleGetUser(auth, supabase, searchParams)
        case 'classes':
            return handleGetClasses(auth, supabase, searchParams)
        case 'reports':
            return handleGetReports(auth, supabase, searchParams)
        case 'school':
            return handleGetSchool(auth, supabase)
        case 'aegisx':
            return handleGetAegisX(auth, supabase, searchParams)
        default:
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Unknown action. Available: dashboard, users, user, classes, reports, school, aegisx'
            }, { status: 400 })
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateOAuthRequest(request)

    if ('error' in auth) {
        return oauthErrorResponse(auth)
    }

    // Verify admin role
    if (auth.userRole !== 'admin' && auth.userRole !== 'super_admin') {
        return NextResponse.json({
            error: 'forbidden',
            error_description: 'Admin access required'
        }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const action = body.action

    switch (action) {
        case 'update_user':
            return handleUpdateUser(auth, supabase, body)
        case 'deactivate_user':
            return handleDeactivateUser(auth, supabase, body)
        case 'update_school':
            return handleUpdateSchool(auth, supabase, body)
        default:
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Unknown action. Available: update_user, deactivate_user, update_school'
            }, { status: 400 })
    }
}

// ============================================================================
// GET Handlers - Using ACTUAL CatalystWells tables
// ============================================================================

async function handleGetDashboard(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    if (!hasScope(auth, 'admin.reports.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.reports.read scope'
        }, { status: 403 })
    }

    // Get counts by role from profiles table
    const { count: studentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', auth.schoolId)
        .eq('role', 'student')

    const { count: teacherCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', auth.schoolId)
        .eq('role', 'teacher')

    const { count: parentCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', auth.schoolId)
        .eq('role', 'parent')

    // Get class count from classes table
    const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', auth.schoolId)

    // Get today's attendance rate from attendance table
    const today = new Date().toISOString().split('T')[0]
    const { data: attendance } = await supabase
        .from('attendance')
        .select('attendance_status')
        .eq('attendance_date', today)
        .eq('school_id', auth.schoolId)

    const presentCount = attendance?.filter(a => a.attendance_status === 'present').length || 0
    const attendanceRate = attendance?.length ? (presentCount / attendance.length) * 100 : 0

    return NextResponse.json({
        data: {
            overview: {
                students: studentCount || 0,
                teachers: teacherCount || 0,
                parents: parentCount || 0,
                classes: classCount || 0
            },
            today: {
                attendanceRate: Math.round(attendanceRate * 10) / 10,
                attendanceRecords: attendance?.length || 0
            }
        }
    })
}

async function handleGetUsers(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'admin.users.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.users.read scope'
        }, { status: 403 })
    }

    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    // Using actual profiles table
    let query = supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      email,
      role,
      grade_level,
      department,
      avatar_url,
      xp,
      level,
      created_at
    `, { count: 'exact' })
        .eq('school_id', auth.schoolId)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })

    if (role) {
        query = query.eq('role', role)
    }

    if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: users, count } = await query

    return NextResponse.json({
        data: users || [],
        meta: {
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        }
    })
}

async function handleGetUser(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'admin.users.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.users.read scope'
        }, { status: 403 })
    }

    const userId = searchParams.get('user_id')
    if (!userId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'user_id is required'
        }, { status: 400 })
    }

    const { data: user, error } = await supabase
        .from('profiles')
        .select(`
      *,
      schools (id, name)
    `)
        .eq('id', userId)
        .eq('school_id', auth.schoolId)
        .single()

    if (error || !user) {
        return NextResponse.json({
            error: 'not_found',
            error_description: 'User not found'
        }, { status: 404 })
    }

    return NextResponse.json({ data: user })
}

async function handleGetClasses(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'admin.school.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.school.read scope'
        }, { status: 403 })
    }

    // Using actual classes table with correct column names
    const { data: classes } = await supabase
        .from('classes')
        .select(`
      id,
      class_name,
      subject,
      grade_level,
      room_number,
      academic_year
    `)
        .eq('school_id', auth.schoolId)
        .order('class_name')

    // Get teacher info and student counts separately
    const enrichedClasses = await Promise.all(
        (classes || []).map(async (cls) => {
            // Get student count
            const { count: studentCount } = await supabase
                .from('student_class_assignments')
                .select('*', { count: 'exact', head: true })
                .eq('class_id', cls.id)
                .eq('is_active', true)

            return {
                ...cls,
                studentCount: studentCount || 0
            }
        })
    )

    return NextResponse.json({
        data: enrichedClasses,
        meta: { count: enrichedClasses.length }
    })
}

async function handleGetReports(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'admin.reports.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.reports.read scope'
        }, { status: 403 })
    }

    const reportType = searchParams.get('type') || 'summary'
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    if (reportType === 'attendance') {
        // Using actual attendance table with correct column names
        const { data: records } = await supabase
            .from('attendance')
            .select('attendance_date, attendance_status')
            .eq('school_id', auth.schoolId)
            .gte('attendance_date', startDate)

        // Group by date
        const byDate: Record<string, { present: number; absent: number; late: number }> = {}
        records?.forEach(r => {
            if (!byDate[r.attendance_date]) {
                byDate[r.attendance_date] = { present: 0, absent: 0, late: 0 }
            }
            if (r.attendance_status === 'present') byDate[r.attendance_date].present++
            else if (r.attendance_status === 'absent') byDate[r.attendance_date].absent++
            else if (r.attendance_status === 'late') byDate[r.attendance_date].late++
        })

        return NextResponse.json({
            data: { type: 'attendance', days, byDate }
        })
    }

    if (reportType === 'grades') {
        // Using actual assessment_grades table
        const { data: grades } = await supabase
            .from('assessment_grades')
            .select('percentage, created_at')
            .eq('school_id', auth.schoolId)
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

        const avgGrade = grades?.length
            ? grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length
            : 0

        return NextResponse.json({
            data: {
                type: 'grades',
                days,
                totalGraded: grades?.length || 0,
                averagePercentage: Math.round(avgGrade * 10) / 10
            }
        })
    }

    if (reportType === 'wellbeing') {
        // Using actual mood_history table
        const { data: moods } = await supabase
            .from('mood_history')
            .select('mood, mood_score')
            .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())

        const moodCounts: Record<string, number> = {}
        moods?.forEach(m => {
            moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1
        })

        const avgMoodScore = moods?.length
            ? moods.reduce((sum, m) => sum + (m.mood_score || 5), 0) / moods.length
            : 0

        return NextResponse.json({
            data: {
                type: 'wellbeing',
                days,
                totalEntries: moods?.length || 0,
                moodDistribution: moodCounts,
                averageMoodScore: Math.round(avgMoodScore * 10) / 10
            }
        })
    }

    return NextResponse.json({
        data: { type: 'summary', message: 'Use type=attendance, grades, or wellbeing for specific reports' }
    })
}

async function handleGetSchool(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    if (!hasScope(auth, 'admin.school.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.school.read scope'
        }, { status: 403 })
    }

    const { data: school } = await supabase
        .from('schools')
        .select('*')
        .eq('id', auth.schoolId)
        .single()

    return NextResponse.json({ data: school })
}

async function handleGetAegisX(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'admin.aegisx.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.aegisx.read scope'
        }, { status: 403 })
    }

    const resource = searchParams.get('resource') || 'readers'

    if (resource === 'readers') {
        // Using actual aegisx_readers table
        const { data: readers } = await supabase
            .from('aegisx_readers')
            .select('*')
            .eq('school_id', auth.schoolId)

        return NextResponse.json({ data: readers || [] })
    }

    if (resource === 'logs') {
        const limit = parseInt(searchParams.get('limit') || '100')
        // Using actual aegisx_access_logs table
        const { data: logs } = await supabase
            .from('aegisx_access_logs')
            .select(`
        *,
        profile:profiles (first_name, last_name),
        reader:aegisx_readers (name, location)
      `)
            .eq('school_id', auth.schoolId)
            .order('created_at', { ascending: false })
            .limit(limit)

        return NextResponse.json({ data: logs || [] })
    }

    return NextResponse.json({
        error: 'invalid_request',
        error_description: 'Unknown resource. Available: readers, logs'
    }, { status: 400 })
}

// ============================================================================
// POST Handlers - Using ACTUAL table names
// ============================================================================

async function handleUpdateUser(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'admin.users.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.users.write scope'
        }, { status: 403 })
    }

    const { user_id, ...updates } = body

    if (!user_id) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'user_id is required'
        }, { status: 400 })
    }

    // Remove sensitive fields that shouldn't be updated via API
    delete updates.school_id
    delete updates.action

    const { data: user, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user_id)
        .eq('school_id', auth.schoolId)
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({ data: user })
}

async function handleDeactivateUser(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'admin.users.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.users.write scope'
        }, { status: 403 })
    }

    const { user_id, reason } = body

    if (!user_id) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'user_id is required'
        }, { status: 400 })
    }

    // Deactivate by setting a flag or removing access
    const { data: user, error } = await supabase
        .from('profiles')
        .update({
            is_active: false,
            deactivated_at: new Date().toISOString(),
            deactivation_reason: reason
        })
        .eq('id', user_id)
        .eq('school_id', auth.schoolId)
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({ data: user })
}

async function handleUpdateSchool(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'admin.school.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires admin.school.write scope'
        }, { status: 403 })
    }

    const { name, address, phone, email, settings } = body

    const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (address !== undefined) updateData.address = address
    if (phone !== undefined) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (settings !== undefined) updateData.settings = settings

    const { data: school, error } = await supabase
        .from('schools')
        .update(updateData)
        .eq('id', auth.schoolId)
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({ data: school })
}
