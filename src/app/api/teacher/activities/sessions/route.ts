import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Build query
    let query = supabase
      .from('activity_sessions')
      .select(`
        id,
        activity_type,
        activity_id,
        session_name,
        conducted_at,
        duration_actual_minutes,
        participant_count,
        effectiveness_rating,
        mood_before,
        mood_after,
        session_notes,
        follow_up_needed,
        class:classes(id, name),
        participants:student_activity_participation(
          student:students(id, full_name),
          participation_level,
          engagement_score,
          mood_before,
          mood_after
        )
      `)
      .eq('teacher_id', teacher.id)
      .order('conducted_at', { ascending: false })
      .limit(limit)

    if (classId) {
      query = query.eq('class_id', classId)
    }

    const { data: sessions, error } = await query

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const {
      class_id,
      activity_type,
      activity_id,
      session_name,
      duration_actual_minutes,
      participant_count,
      participant_ids = [],
      effectiveness_rating,
      mood_before,
      mood_after,
      session_notes,
      follow_up_needed = false,
      follow_up_notes,
      participants = []
    } = body

    // Validate required fields
    if (!class_id || !activity_type || !activity_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Verify class belongs to teacher's school
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('id, school_id')
      .eq('id', class_id)
      .eq('school_id', teacher.school_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: 'Invalid class' }, { status: 400 })
    }

    // Insert session
    const { data: newSession, error: insertError } = await supabase
      .from('activity_sessions')
      .insert({
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        class_id,
        activity_type,
        activity_id,
        session_name,
        duration_actual_minutes,
        participant_count,
        participant_ids,
        effectiveness_rating,
        mood_before,
        mood_after,
        session_notes,
        follow_up_needed,
        follow_up_notes
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting session:', insertError)
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
    }

    // Insert participant data if provided
    if (participants.length > 0) {
      const participantData = participants.map((p: any) => ({
        session_id: newSession.id,
        student_id: p.student_id,
        participation_level: p.participation_level || 'full',
        mood_before: p.mood_before,
        mood_after: p.mood_after,
        engagement_score: p.engagement_score,
        notes: p.notes
      }))

      const { error: participantError } = await supabase
        .from('student_activity_participation')
        .insert(participantData)

      if (participantError) {
        console.error('Error inserting participant data:', participantError)
        // Don't fail the whole request, just log the error
      }
    }

    // Update activity usage count
    if (activity_type === 'template') {
      await supabase.rpc('increment_template_usage', { template_id: activity_id })
    } else {
      await supabase.rpc('increment_custom_activity_usage', { activity_id: activity_id })
    }

    return NextResponse.json({ session: newSession }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { session_id, ...updates } = body

    if (!session_id) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('activity_sessions')
      .update(updates)
      .eq('id', session_id)
      .eq('teacher_id', teacher.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
