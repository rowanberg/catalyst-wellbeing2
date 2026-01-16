/**
 * ============================================================================
 * Public API v1 - Student Endpoints
 * ============================================================================
 * Secure endpoints for third-party apps to access student data
 * Uses ACTUAL CatalystWells database tables and column names
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
    authenticateOAuthRequest,
    oauthErrorResponse,
    hasScope,
    OAuthCredentials,
    OAuthError
} from '@/lib/auth/oauth-api-auth'

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    )
}

// ============================================================================
// GET /api/public/v1/students - List students (teacher/admin scope)
// ============================================================================
export async function GET(request: NextRequest) {
    const auth = await authenticateOAuthRequest(request)

    if ('error' in auth) {
        return oauthErrorResponse(auth)
    }

    const supabase = getSupabaseAdmin()
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    // Route to appropriate handler
    if (action === 'me' || (!action && auth.userRole === 'student')) {
        return handleGetOwnProfile(auth, supabase)
    } else if (action === 'classes') {
        return handleGetStudentClasses(auth, supabase, searchParams)
    } else if (action === 'grades') {
        return handleGetStudentGrades(auth, supabase, searchParams)
    } else if (action === 'attendance') {
        return handleGetStudentAttendance(auth, supabase, searchParams)
    } else if (action === 'assignments') {
        return handleGetStudentAssignments(auth, supabase, searchParams)
    } else if (action === 'achievements') {
        return handleGetStudentAchievements(auth, supabase)
    } else if (action === 'wellbeing') {
        return handleGetStudentWellbeing(auth, supabase, searchParams)
    } else if (action === 'list') {
        return handleListStudents(auth, supabase, searchParams)
    }

    return NextResponse.json({
        error: 'invalid_request',
        error_description: 'Unknown action. Available actions: me, classes, grades, attendance, assignments, achievements, wellbeing, list'
    }, { status: 400 })
}

// ============================================================================
// Handler Functions - Using ACTUAL CatalystWells table/column names
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

    // Using actual 'profiles' table structure
    const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      role,
      avatar_url,
      xp,
      gems,
      level,
      grade_level,
      student_number,
      current_mood,
      wellbeing_status,
      streak_days,
      total_quests_completed,
      created_at,
      ${hasScope(auth, 'profile.email') ? 'email,' : ''}
      schools (
        id,
        name,
        logo_url
      )
    `)
        .eq('id', auth.profileId)
        .single()

    if (error) {
        return NextResponse.json({ error: 'not_found', error_description: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({
        data: profile,
        meta: { scopes: auth.scopes }
    })
}

async function handleGetStudentClasses(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'student.classes.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires student.classes.read scope'
        }, { status: 403 })
    }

    // Using actual 'student_class_assignments' table
    const { data: classes, error } = await supabase
        .from('student_class_assignments')
        .select(`
      id,
      assigned_at,
      is_active,
      class:classes (
        id,
        class_name,
        subject,
        room_number,
        grade_level,
        academic_year
      )
    `)
        .eq('student_id', auth.userId)
        .eq('is_active', true)

    return NextResponse.json({
        data: classes || [],
        meta: { count: classes?.length || 0 }
    })
}

async function handleGetStudentGrades(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'student.grades.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires student.grades.read scope'
        }, { status: 403 })
    }

    const limit = parseInt(searchParams.get('limit') || '50')

    // Using actual 'assessment_grades' table
    const { data: grades, error } = await supabase
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
      assessment:assessments (
        id,
        title,
        type,
        max_score,
        description,
        due_date,
        class:classes (
          id,
          class_name,
          subject
        )
      )
    `)
        .eq('student_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    return NextResponse.json({
        data: grades || [],
        meta: { count: grades?.length || 0 }
    })
}

async function handleGetStudentAttendance(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'student.attendance.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires student.attendance.read scope'
        }, { status: 403 })
    }

    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Using actual 'attendance' table with correct column names
    const { data: attendance, error } = await supabase
        .from('attendance')
        .select(`
      id,
      attendance_date,
      attendance_status,
      notes,
      created_at
    `)
        .eq('student_id', auth.userId)
        .gte('attendance_date', startDate)
        .order('attendance_date', { ascending: false })

    // Calculate summary
    const summary = {
        total: attendance?.length || 0,
        present: attendance?.filter(a => a.attendance_status === 'present').length || 0,
        absent: attendance?.filter(a => a.attendance_status === 'absent').length || 0,
        late: attendance?.filter(a => a.attendance_status === 'late').length || 0,
        excused: attendance?.filter(a => a.attendance_status === 'excused').length || 0
    }

    return NextResponse.json({
        data: attendance || [],
        meta: { summary, days }
    })
}

async function handleGetStudentAssignments(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'student.assignments.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires student.assignments.read scope'
        }, { status: 403 })
    }

    const limit = parseInt(searchParams.get('limit') || '50')

    // Get student's class assignments first
    const { data: classAssignments } = await supabase
        .from('student_class_assignments')
        .select('class_id')
        .eq('student_id', auth.userId)
        .eq('is_active', true)

    const classIds = classAssignments?.map(ca => ca.class_id) || []

    if (classIds.length === 0) {
        return NextResponse.json({ data: [], meta: { count: 0 } })
    }

    // Using actual 'assessments' table for assignments
    const { data: assignments, error } = await supabase
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
      class:classes (
        id,
        class_name,
        subject
      )
    `)
        .in('class_id', classIds)
        .eq('is_published', true)
        .order('due_date', { ascending: false })
        .limit(limit)

    return NextResponse.json({
        data: assignments || [],
        meta: { count: assignments?.length || 0 }
    })
}

async function handleGetStudentAchievements(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    if (!hasScope(auth, 'student.achievements.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires student.achievements.read scope'
        }, { status: 403 })
    }

    // Get profile for XP, gems, level from actual profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('xp, gems, level, total_quests_completed, streak_days, current_gems')
        .eq('id', auth.profileId)
        .single()

    // Get shout-outs/recognition from student_shout_outs table
    const { data: shoutOuts } = await supabase
        .from('student_shout_outs')
        .select(`
      id,
      message,
      badge_type,
      xp_reward,
      created_at
    `)
        .eq('student_id', auth.profileId)
        .order('created_at', { ascending: false })
        .limit(20)

    return NextResponse.json({
        data: {
            stats: {
                xp: profile?.xp || 0,
                gems: profile?.gems || profile?.current_gems || 0,
                level: profile?.level || 1,
                questsCompleted: profile?.total_quests_completed || 0,
                streakDays: profile?.streak_days || 0
            },
            shoutOuts: shoutOuts || []
        }
    })
}

async function handleGetStudentWellbeing(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'student.wellbeing.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires student.wellbeing.read scope'
        }, { status: 403 })
    }

    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Get mood entries from mood_tracking and mood_history tables
    const { data: moods } = await supabase
        .from('mood_history')
        .select('id, mood, mood_emoji, mood_score, notes, recorded_date, recorded_time, created_at')
        .eq('user_id', auth.userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })

    // Get gratitude entries
    const { data: gratitude } = await supabase
        .from('gratitude_entries')
        .select('id, entry_text, created_at')
        .eq('user_id', auth.userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })

    // Get kindness counter
    const { data: kindness } = await supabase
        .from('kindness_counter')
        .select('id, description, created_at')
        .eq('user_id', auth.userId)
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })

    return NextResponse.json({
        data: {
            moods: moods || [],
            gratitude: gratitude || [],
            kindness: kindness || []
        },
        meta: { days }
    })
}

async function handleListStudents(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    // Only teachers and admins can list students
    if (!hasScope(auth, 'teacher.students.read') && !hasScope(auth, 'admin.users.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires teacher.students.read or admin.users.read scope'
        }, { status: 403 })
    }

    const classId = searchParams.get('class_id')
    const grade = searchParams.get('grade')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = (page - 1) * limit

    // If class_id provided, get students from that class
    if (classId) {
        const { data: classStudents } = await supabase
            .from('student_class_assignments')
            .select(`
        profile:profiles!student_class_assignments_student_id_fkey (
          id,
          user_id,
          first_name,
          last_name,
          grade_level,
          avatar_url,
          xp,
          level,
          current_mood,
          wellbeing_status
        )
      `)
            .eq('class_id', classId)
            .eq('is_active', true)

        return NextResponse.json({
            data: classStudents?.map(s => s.profile) || [],
            meta: { count: classStudents?.length || 0, classId }
        })
    }

    // Otherwise list all students from school
    let query = supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      grade_level,
      avatar_url,
      xp,
      level
    `, { count: 'exact' })
        .eq('role', 'student')
        .eq('school_id', auth.schoolId)
        .range(offset, offset + limit - 1)
        .order('last_name')

    if (grade) {
        query = query.eq('grade_level', grade)
    }

    const { data: students, count, error } = await query

    return NextResponse.json({
        data: students || [],
        meta: {
            total: count || 0,
            page,
            limit,
            totalPages: Math.ceil((count || 0) / limit)
        }
    })
}
