/**
 * ============================================================================
 * Public API v1 - Teacher Endpoints
 * ============================================================================
 * Secure endpoints for third-party apps to access teacher data
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

    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'me'

    switch (action) {
        case 'me':
            return handleGetOwnProfile(auth, supabase)
        case 'classes':
            return handleGetTeacherClasses(auth, supabase, searchParams)
        case 'students':
            return handleGetClassStudents(auth, supabase, searchParams)
        case 'grades':
            return handleGetClassGrades(auth, supabase, searchParams)
        case 'attendance':
            return handleGetClassAttendance(auth, supabase, searchParams)
        case 'analytics':
            return handleGetClassAnalytics(auth, supabase, searchParams)
        case 'assessments':
            return handleGetAssessments(auth, supabase, searchParams)
        default:
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Unknown action. Available: me, classes, students, grades, attendance, analytics, assessments'
            }, { status: 400 })
    }
}

export async function POST(request: NextRequest) {
    const auth = await authenticateOAuthRequest(request)

    if ('error' in auth) {
        return oauthErrorResponse(auth)
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const action = body.action

    switch (action) {
        case 'mark_attendance':
            return handleMarkAttendance(auth, supabase, body)
        case 'create_assessment':
            return handleCreateAssessment(auth, supabase, body)
        case 'grade_assessment':
            return handleGradeAssessment(auth, supabase, body)
        case 'send_shout_out':
            return handleSendShoutOut(auth, supabase, body)
        default:
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Unknown action. Available: mark_attendance, create_assessment, grade_assessment, send_shout_out'
            }, { status: 400 })
    }
}

// ============================================================================
// GET Handlers - Using ACTUAL CatalystWells tables
// ============================================================================

async function handleGetOwnProfile(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    if (!hasScope(auth, 'profile.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires profile.read scope'
        }, { status: 403 })
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      role,
      avatar_url,
      department,
      ${hasScope(auth, 'profile.email') ? 'email,' : ''}
      schools (id, name, logo_url)
    `)
        .eq('id', auth.profileId)
        .single()

    return NextResponse.json({ data: profile })
}

async function handleGetTeacherClasses(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'teacher.students.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.students.read scope'
        }, { status: 403 })
    }

    // Using actual 'teacher_class_assignments' table to get assigned classes
    const { data: assignments } = await supabase
        .from('teacher_class_assignments')
        .select(`
      id,
      is_primary,
      class:classes (
        id,
        class_name,
        subject,
        grade_level,
        room_number,
        academic_year
      )
    `)
        .eq('teacher_id', auth.userId)
        .eq('is_active', true)

    // Also get classes where teacher is the primary teacher
    const { data: ownedClasses } = await supabase
        .from('classes')
        .select(`
      id,
      class_name,
      subject,
      grade_level,
      room_number,
      academic_year
    `)
        .eq('teacher_id', auth.userId)

    // Combine and deduplicate
    const assignedClasses: any[] = assignments?.map(a => ({ ...a.class, isPrimary: a.is_primary })) || []
    const allClasses: any[] = [...assignedClasses]

    // Add owned classes if not already in list
    ownedClasses?.forEach(c => {
        if (!allClasses.find(ac => ac.id === c.id)) {
            allClasses.push({ ...c, isPrimary: true })
        }
    })

    return NextResponse.json({
        data: allClasses,
        meta: { count: allClasses.length }
    })
}

async function handleGetClassStudents(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'teacher.students.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.students.read scope'
        }, { status: 403 })
    }

    const classId = searchParams.get('class_id')
    if (!classId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'class_id is required'
        }, { status: 400 })
    }

    // Get students via student_class_assignments
    const { data: assignments } = await supabase
        .from('student_class_assignments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true)

    if (!assignments || assignments.length === 0) {
        return NextResponse.json({ data: [], meta: { classId, count: 0 } })
    }

    const studentIds = assignments.map(a => a.student_id)

    // Get student profiles
    const { data: students } = await supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      avatar_url,
      grade_level,
      student_number,
      xp,
      level,
      current_mood,
      wellbeing_status,
      streak_days
    `)
        .in('user_id', studentIds)

    return NextResponse.json({
        data: students || [],
        meta: { classId, count: students?.length || 0 }
    })
}

async function handleGetClassGrades(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'teacher.grades.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.grades.read scope'
        }, { status: 403 })
    }

    const classId = searchParams.get('class_id')
    const assessmentId = searchParams.get('assessment_id')

    if (!classId && !assessmentId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'class_id or assessment_id is required'
        }, { status: 400 })
    }

    // Using actual assessment_grades table
    let query = supabase
        .from('assessment_grades')
        .select(`
      id,
      score,
      percentage,
      letter_grade,
      feedback,
      is_excused,
      late_penalty,
      created_at,
      updated_at,
      student:profiles!assessment_grades_student_id_fkey (
        id,
        first_name,
        last_name,
        student_number
      ),
      assessment:assessments (
        id,
        title,
        type,
        max_score
      )
    `)
        .eq('teacher_id', auth.userId)

    if (assessmentId) {
        query = query.eq('assessment_id', assessmentId)
    }

    const { data: grades } = await query.order('created_at', { ascending: false })

    return NextResponse.json({ data: grades || [] })
}

async function handleGetClassAttendance(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'teacher.attendance.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.attendance.read scope'
        }, { status: 403 })
    }

    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Using actual attendance table with correct column names
    const { data: attendance } = await supabase
        .from('attendance')
        .select(`
      id,
      student_id,
      attendance_date,
      attendance_status,
      notes,
      created_at
    `)
        .eq('teacher_id', auth.userId)
        .eq('attendance_date', date)

    // Get student details separately
    if (attendance && attendance.length > 0) {
        const studentIds = [...new Set(attendance.map(a => a.student_id))]
        const { data: students } = await supabase
            .from('profiles')
            .select('id, user_id, first_name, last_name, avatar_url')
            .in('user_id', studentIds)

        // Merge student info into attendance records
        const enrichedAttendance = attendance.map(a => ({
            ...a,
            student: students?.find(s => s.user_id === a.student_id)
        }))

        return NextResponse.json({
            data: enrichedAttendance,
            meta: { date, count: enrichedAttendance.length }
        })
    }

    return NextResponse.json({
        data: attendance || [],
        meta: { date, count: 0 }
    })
}

async function handleGetClassAnalytics(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'teacher.analytics.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.analytics.read scope'
        }, { status: 403 })
    }

    const classId = searchParams.get('class_id')

    if (!classId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'class_id is required'
        }, { status: 400 })
    }

    // Get class info
    const { data: classData } = await supabase
        .from('classes')
        .select('id, class_name, subject, grade_level')
        .eq('id', classId)
        .single()

    // Get student count
    const { count: studentCount } = await supabase
        .from('student_class_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', classId)
        .eq('is_active', true)

    // Get assessments for this class
    const { data: assessments } = await supabase
        .from('assessments')
        .select('id')
        .eq('class_id', classId)

    const assessmentIds = assessments?.map(a => a.id) || []

    // Get grade stats if there are assessments
    let avgGrade = 0
    let totalGraded = 0

    if (assessmentIds.length > 0) {
        const { data: grades } = await supabase
            .from('assessment_grades')
            .select('percentage')
            .in('assessment_id', assessmentIds)

        if (grades && grades.length > 0) {
            avgGrade = grades.reduce((sum, g) => sum + (g.percentage || 0), 0) / grades.length
            totalGraded = grades.length
        }
    }

    // Get attendance rate (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const { data: attendance } = await supabase
        .from('attendance')
        .select('attendance_status')
        .eq('teacher_id', auth.userId)
        .gte('attendance_date', thirtyDaysAgo)

    const presentCount = attendance?.filter(a => a.attendance_status === 'present').length || 0
    const attendanceRate = attendance?.length ? (presentCount / attendance.length) * 100 : 0

    return NextResponse.json({
        data: {
            class: classData,
            metrics: {
                studentCount: studentCount || 0,
                assessmentCount: assessmentIds.length,
                averageGrade: Math.round(avgGrade * 10) / 10,
                totalGraded,
                attendanceRate: Math.round(attendanceRate * 10) / 10,
                attendanceRecords: attendance?.length || 0
            }
        }
    })
}

async function handleGetAssessments(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'teacher.assignments.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.assignments.read scope'
        }, { status: 403 })
    }

    const classId = searchParams.get('class_id')
    const type = searchParams.get('type')

    // Using actual assessments table
    let query = supabase
        .from('assessments')
        .select(`
      id,
      title,
      description,
      type,
      max_score,
      due_date,
      is_published,
      created_at,
      class:classes (id, class_name, subject)
    `)
        .eq('teacher_id', auth.userId)
        .order('created_at', { ascending: false })

    if (classId) {
        query = query.eq('class_id', classId)
    }

    if (type) {
        query = query.eq('type', type)
    }

    const { data: assessments } = await query

    return NextResponse.json({ data: assessments || [] })
}

// ============================================================================
// POST Handlers (Write Operations) - Using ACTUAL table names
// ============================================================================

async function handleMarkAttendance(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'teacher.attendance.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.attendance.write scope'
        }, { status: 403 })
    }

    const { date, records } = body

    if (!records || !Array.isArray(records)) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'records array is required'
        }, { status: 400 })
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0]

    // Using actual attendance table columns
    const attendanceRecords = records.map((r: any) => ({
        student_id: r.student_id,
        teacher_id: auth.userId,
        school_id: auth.schoolId,
        attendance_date: attendanceDate,
        attendance_status: r.status, // 'present', 'absent', 'late', 'excused'
        notes: r.notes
    }))

    // Upsert attendance records
    const { data, error } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
            onConflict: 'student_id,attendance_date',
            ignoreDuplicates: false
        })
        .select()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({
        data,
        meta: { count: data?.length || 0, date: attendanceDate }
    })
}

async function handleCreateAssessment(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'teacher.assignments.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.assignments.write scope'
        }, { status: 403 })
    }

    const { class_id, title, description, type, max_score, due_date, is_published } = body

    if (!class_id || !title || !type || !max_score) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'class_id, title, type, and max_score are required'
        }, { status: 400 })
    }

    // Using actual assessments table
    const { data: assessment, error } = await supabase
        .from('assessments')
        .insert({
            class_id,
            teacher_id: auth.userId,
            school_id: auth.schoolId,
            title,
            description,
            type, // 'quiz', 'test', 'assignment', 'project', 'exam'
            max_score,
            due_date,
            is_published: is_published || false
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({ data: assessment }, { status: 201 })
}

async function handleGradeAssessment(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'teacher.grades.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.grades.write scope'
        }, { status: 403 })
    }

    const { assessment_id, student_id, score, feedback, is_excused, late_penalty } = body

    if (!assessment_id || !student_id || score === undefined) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'assessment_id, student_id, and score are required'
        }, { status: 400 })
    }

    // Get assessment to calculate percentage
    const { data: assessment } = await supabase
        .from('assessments')
        .select('max_score')
        .eq('id', assessment_id)
        .single()

    if (!assessment) {
        return NextResponse.json({
            error: 'not_found',
            error_description: 'Assessment not found'
        }, { status: 404 })
    }

    const percentage = (score / assessment.max_score) * 100

    // Using actual assessment_grades table
    const { data: grade, error } = await supabase
        .from('assessment_grades')
        .upsert({
            assessment_id,
            student_id,
            teacher_id: auth.userId,
            school_id: auth.schoolId,
            score,
            percentage,
            feedback,
            is_excused: is_excused || false,
            late_penalty: late_penalty || 0
        }, {
            onConflict: 'student_id,assessment_id'
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({ data: grade })
}

async function handleSendShoutOut(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'teacher.communications.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.communications.write scope'
        }, { status: 403 })
    }

    const { student_id, message, badge_type, xp_reward } = body

    if (!student_id || !message) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'student_id and message are required'
        }, { status: 400 })
    }

    // Using actual student_shout_outs table
    const { data: shoutOut, error } = await supabase
        .from('student_shout_outs')
        .insert({
            student_id,
            teacher_id: auth.profileId,
            school_id: auth.schoolId,
            message,
            badge_type: badge_type || 'star',
            xp_reward: xp_reward || 10
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    // Award XP to student - try RPC first, fallback to direct increment
    if (xp_reward && xp_reward > 0) {
        try {
            // Try using RPC function
            await supabase.rpc('increment_student_xp', {
                p_student_id: student_id,
                p_xp_amount: xp_reward
            })
        } catch {
            // Fallback: direct SQL increment isn't possible without RPC,
            // but the shout out was still created successfully
            console.log('XP RPC not available, shout out created without XP award')
        }
    }

    return NextResponse.json({ data: shoutOut }, { status: 201 })
}
