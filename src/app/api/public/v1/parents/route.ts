/**
 * ============================================================================
 * Public API v1 - Parent Endpoints
 * ============================================================================
 * Secure endpoints for third-party apps to access parent data
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
        case 'children':
            return handleGetChildren(auth, supabase)
        case 'child_grades':
            return handleGetChildGrades(auth, supabase, searchParams)
        case 'child_attendance':
            return handleGetChildAttendance(auth, supabase, searchParams)
        case 'child_assessments':
            return handleGetChildAssessments(auth, supabase, searchParams)
        case 'announcements':
            return handleGetAnnouncements(auth, supabase, searchParams)
        case 'messages':
            return handleGetMessages(auth, supabase, searchParams)
        case 'meetings':
            return handleGetMeetings(auth, supabase, searchParams)
        default:
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Unknown action. Available: me, children, child_grades, child_attendance, child_assessments, announcements, messages, meetings'
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
        case 'book_meeting':
            return handleBookMeeting(auth, supabase, body)
        case 'mark_announcement_read':
            return handleMarkAnnouncementRead(auth, supabase, body)
        default:
            return NextResponse.json({
                error: 'invalid_request',
                error_description: 'Unknown action. Available: book_meeting, mark_announcement_read'
            }, { status: 400 })
    }
}

// ============================================================================
// Helper: Get Parent's Children IDs using actual table
// ============================================================================

async function getChildrenIds(
    supabase: ReturnType<typeof getSupabaseAdmin>,
    parentUserId: string
): Promise<string[]> {
    // Using actual parent_child_relationships table
    const { data } = await supabase
        .from('parent_child_relationships')
        .select('child_id')
        .eq('parent_id', parentUserId)
        .eq('is_approved', true)

    return data?.map(r => r.child_id) || []
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
      phone,
      ${hasScope(auth, 'profile.email') ? 'email,' : ''}
      schools (id, name, logo_url)
    `)
        .eq('id', auth.profileId)
        .single()

    return NextResponse.json({ data: profile })
}

async function handleGetChildren(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>
) {
    if (!hasScope(auth, 'parent.children.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.children.read scope'
        }, { status: 403 })
    }

    // Using actual parent_child_relationships table
    const { data: relationships } = await supabase
        .from('parent_child_relationships')
        .select('child_id, relationship_type, is_approved, created_at')
        .eq('parent_id', auth.userId)
        .eq('is_approved', true)

    if (!relationships || relationships.length === 0) {
        return NextResponse.json({ data: [], meta: { count: 0 } })
    }

    const childIds = relationships.map(r => r.child_id)

    // Get children profiles
    const { data: children } = await supabase
        .from('profiles')
        .select(`
      id,
      user_id,
      first_name,
      last_name,
      grade_level,
      avatar_url,
      xp,
      level,
      current_mood,
      wellbeing_status,
      streak_days
    `)
        .in('user_id', childIds)

    // Merge relationship info
    const enrichedChildren = children?.map(child => {
        const rel = relationships.find(r => r.child_id === child.user_id)
        return {
            ...child,
            relationship: rel?.relationship_type || 'parent'
        }
    })

    return NextResponse.json({
        data: enrichedChildren || [],
        meta: { count: enrichedChildren?.length || 0 }
    })
}

async function handleGetChildGrades(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'parent.grades.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.grades.read scope'
        }, { status: 403 })
    }

    const childId = searchParams.get('child_id')
    if (!childId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'child_id is required'
        }, { status: 400 })
    }

    // Verify parent-child relationship
    const childrenIds = await getChildrenIds(supabase, auth.userId!)
    if (!childrenIds.includes(childId)) {
        return NextResponse.json({
            error: 'forbidden',
            error_description: 'Not authorized to view this child\'s data'
        }, { status: 403 })
    }

    // Using actual assessment_grades table
    const { data: grades } = await supabase
        .from('assessment_grades')
        .select(`
      id,
      score,
      percentage,
      letter_grade,
      feedback,
      is_excused,
      created_at,
      assessment:assessments (
        id,
        title,
        type,
        max_score,
        class:classes (
          id,
          class_name,
          subject
        )
      )
    `)
        .eq('student_id', childId)
        .order('created_at', { ascending: false })
        .limit(50)

    return NextResponse.json({ data: grades || [] })
}

async function handleGetChildAttendance(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'parent.attendance.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.attendance.read scope'
        }, { status: 403 })
    }

    const childId = searchParams.get('child_id')
    if (!childId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'child_id is required'
        }, { status: 400 })
    }

    // Verify parent-child relationship
    const childrenIds = await getChildrenIds(supabase, auth.userId!)
    if (!childrenIds.includes(childId)) {
        return NextResponse.json({
            error: 'forbidden',
            error_description: 'Not authorized to view this child\'s data'
        }, { status: 403 })
    }

    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    // Using actual attendance table with correct column names
    const { data: attendance } = await supabase
        .from('attendance')
        .select(`
      id,
      attendance_date,
      attendance_status,
      notes,
      created_at
    `)
        .eq('student_id', childId)
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

async function handleGetChildAssessments(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'parent.children.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.children.read scope'
        }, { status: 403 })
    }

    const childId = searchParams.get('child_id')
    if (!childId) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'child_id is required'
        }, { status: 400 })
    }

    // Verify parent-child relationship
    const childrenIds = await getChildrenIds(supabase, auth.userId!)
    if (!childrenIds.includes(childId)) {
        return NextResponse.json({
            error: 'forbidden',
            error_description: 'Not authorized to view this child\'s data'
        }, { status: 403 })
    }

    // Get child's class assignments
    const { data: classAssignments } = await supabase
        .from('student_class_assignments')
        .select('class_id')
        .eq('student_id', childId)
        .eq('is_active', true)

    const classIds = classAssignments?.map(ca => ca.class_id) || []

    if (classIds.length === 0) {
        return NextResponse.json({ data: [], meta: { count: 0 } })
    }

    // Get upcoming assessments
    const { data: assessments } = await supabase
        .from('assessments')
        .select(`
      id,
      title,
      description,
      type,
      max_score,
      due_date,
      class:classes (
        id,
        class_name,
        subject
      )
    `)
        .in('class_id', classIds)
        .eq('is_published', true)
        .gte('due_date', new Date().toISOString())
        .order('due_date', { ascending: true })
        .limit(20)

    return NextResponse.json({ data: assessments || [] })
}

async function handleGetAnnouncements(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'parent.communications.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.communications.read scope'
        }, { status: 403 })
    }

    const limit = parseInt(searchParams.get('limit') || '20')

    // Get school announcements from school_announcements table
    const { data: announcements } = await supabase
        .from('school_announcements')
        .select(`
      id,
      title,
      content,
      announcement_type,
      priority,
      is_published,
      expires_at,
      created_at
    `)
        .eq('school_id', auth.schoolId)
        .eq('is_published', true)
        .or(`expires_at.is.null,expires_at.gte.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(limit)

    return NextResponse.json({
        data: announcements || [],
        meta: { count: announcements?.length || 0 }
    })
}

async function handleGetMessages(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'parent.communications.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.communications.read scope'
        }, { status: 403 })
    }

    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unread') === 'true'

    // Using actual parent_teacher_messages or management_messages table
    let query = supabase
        .from('management_messages')
        .select(`
      id,
      title,
      message,
      is_read,
      priority,
      created_at
    `)
        .eq('recipient_id', auth.userId)
        .order('created_at', { ascending: false })
        .limit(limit)

    if (unreadOnly) {
        query = query.eq('is_read', false)
    }

    const { data: messages } = await query

    return NextResponse.json({
        data: messages || [],
        meta: { count: messages?.length || 0 }
    })
}

async function handleGetMeetings(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    searchParams: URLSearchParams
) {
    if (!hasScope(auth, 'parent.meetings.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.meetings.read scope'
        }, { status: 403 })
    }

    const upcoming = searchParams.get('upcoming') !== 'false'

    // Using actual meeting_bookings table
    let query = supabase
        .from('meeting_bookings')
        .select(`
      id,
      subject,
      agenda,
      status,
      meeting_notes,
      created_at,
      slot:meeting_slots (
        id,
        date,
        start_time,
        end_time,
        location,
        virtual_meeting_link
      )
    `)
        .eq('parent_id', auth.userId)
        .order('created_at', { ascending: false })

    if (upcoming) {
        query = query.in('status', ['scheduled', 'confirmed'])
    }

    const { data: meetings } = await query

    return NextResponse.json({ data: meetings || [] })
}

// ============================================================================
// POST Handlers - Using ACTUAL table names
// ============================================================================

async function handleBookMeeting(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'parent.meetings.write')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.meetings.write scope'
        }, { status: 403 })
    }

    const { slot_id, child_id, subject, agenda } = body

    if (!slot_id || !child_id || !subject) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'slot_id, child_id, and subject are required'
        }, { status: 400 })
    }

    // Verify parent-child relationship
    const childrenIds = await getChildrenIds(supabase, auth.userId!)
    if (!childrenIds.includes(child_id)) {
        return NextResponse.json({
            error: 'forbidden',
            error_description: 'Not authorized for this child'
        }, { status: 403 })
    }

    // Verify slot is available
    const { data: slot } = await supabase
        .from('meeting_slots')
        .select('id, is_available')
        .eq('id', slot_id)
        .eq('is_available', true)
        .single()

    if (!slot) {
        return NextResponse.json({
            error: 'not_found',
            error_description: 'Meeting slot not available'
        }, { status: 404 })
    }

    // Using actual meeting_bookings table
    const { data: booking, error } = await supabase
        .from('meeting_bookings')
        .insert({
            slot_id,
            parent_id: auth.userId,
            student_id: child_id,
            subject,
            agenda,
            status: 'scheduled'
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    // Mark slot as unavailable
    await supabase
        .from('meeting_slots')
        .update({ is_available: false })
        .eq('id', slot_id)

    return NextResponse.json({ data: booking }, { status: 201 })
}

async function handleMarkAnnouncementRead(
    auth: OAuthCredentials,
    supabase: ReturnType<typeof getSupabaseAdmin>,
    body: any
) {
    if (!hasScope(auth, 'parent.communications.read')) {
        return NextResponse.json({
            error: 'insufficient_scope',
            error_description: 'Requires parent.communications.read scope'
        }, { status: 403 })
    }

    const { announcement_id } = body

    if (!announcement_id) {
        return NextResponse.json({
            error: 'invalid_request',
            error_description: 'announcement_id is required'
        }, { status: 400 })
    }

    // Using actual announcement_read_status table
    const { data, error } = await supabase
        .from('announcement_read_status')
        .upsert({
            announcement_id,
            parent_id: auth.userId,
            read_at: new Date().toISOString()
        }, {
            onConflict: 'announcement_id,parent_id'
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({
            error: 'server_error',
            error_description: error.message
        }, { status: 500 })
    }

    return NextResponse.json({ data })
}
