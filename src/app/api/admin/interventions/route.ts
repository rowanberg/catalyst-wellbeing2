import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// =====================================================
// POST - Create a new intervention
// =====================================================
export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication (secure method)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Only admins can create interventions
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can create interventions' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      student_id,
      student_name,
      interventions,
      priority,
      notes,
      risk_level,
      risk_score,
      overall_wellbeing_score,
      scheduled_start_date,
      target_completion_date
    } = body

    // Validation
    if (!student_id || !student_name) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, student_name' },
        { status: 400 }
      )
    }

    if (!interventions || !Array.isArray(interventions) || interventions.length === 0) {
      return NextResponse.json(
        { error: 'At least one intervention must be selected' },
        { status: 400 }
      )
    }

    // Validate intervention types
    const validInterventionTypes = [
      'counseling',
      'parent_contact',
      'wellness_plan',
      'support_teacher',
      'peer_support',
      'mental_health',
      'academic_support',
      'priority_checkin',
      'school_counselor',
      'break_schedule'
    ]

    const invalidInterventions = interventions.filter(
      (i: string) => !validInterventionTypes.includes(i)
    )

    if (invalidInterventions.length > 0) {
      return NextResponse.json(
        { error: `Invalid intervention types: ${invalidInterventions.join(', ')}` },
        { status: 400 }
      )
    }

    // Use the helper function to create intervention with actions
    const { data: interventionId, error: createError } = await supabase
      .rpc('create_intervention_with_actions', {
        p_student_id: student_id,
        p_student_name: student_name,
        p_school_id: profile.school_id,
        p_priority: priority || 'high',
        p_risk_level: risk_level || null,
        p_risk_score: risk_score || null,
        p_notes: notes || null,
        p_created_by: user.id,
        p_action_types: interventions
      })

    if (createError) {
      console.error('Error creating intervention:', createError)
      return NextResponse.json(
        { error: 'Failed to create intervention', details: createError.message },
        { status: 500 }
      )
    }

    // If we have scheduled dates, update the intervention
    if (scheduled_start_date || target_completion_date) {
      const { error: updateError } = await supabase
        .from('student_interventions')
        .update({
          scheduled_start_date,
          target_completion_date
        })
        .eq('id', interventionId)

      if (updateError) {
        console.error('Error updating intervention dates:', updateError)
        // Don't fail the request, just log the error
      }
    }

    // Fetch the created intervention with all details
    const { data: intervention, error: fetchError } = await supabase
      .from('student_interventions')
      .select(`
        *,
        intervention_actions (*)
      `)
      .eq('id', interventionId)
      .single()

    if (fetchError) {
      console.error('Error fetching created intervention:', fetchError)
      // Still return success with just the ID
      return NextResponse.json({
        success: true,
        intervention_id: interventionId,
        message: 'Intervention created successfully'
      })
    }

    return NextResponse.json({
      success: true,
      intervention: intervention,
      message: `Intervention plan created successfully for ${student_name}`
    })

  } catch (error) {
    console.error('Unexpected error creating intervention:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// =====================================================
// GET - Fetch interventions with optional filters
// =====================================================
export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Check authentication (secure method)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const priority = searchParams.get('priority') || 'all'
    const student_id = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('student_interventions')
      .select(`
        *,
        intervention_actions (
          id,
          action_type,
          action_label,
          status,
          assigned_to,
          due_date,
          completed_date
        ),
        intervention_follow_ups (
          id,
          follow_up_date,
          outcome,
          progress_notes
        )
      `, { count: 'exact' })
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (priority !== 'all') {
      query = query.eq('priority', priority)
    }

    if (student_id) {
      query = query.eq('student_id', student_id)
    }

    // For teachers, only show interventions for their students
    if (profile.role === 'teacher') {
      // First get teacher's class assignments
      const { data: teacherClassAssignments } = await supabase
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true)

      if (teacherClassAssignments && teacherClassAssignments.length > 0) {
        const classIds = teacherClassAssignments.map(tca => tca.class_id)
        
        // Then get students in those classes
        const { data: studentAssignments } = await supabase
          .from('student_class_assignments')
          .select('student_id')
          .in('class_id', classIds)

        if (studentAssignments && studentAssignments.length > 0) {
          const studentIds = studentAssignments.map(s => s.student_id)
          query = query.in('student_id', studentIds)
        } else {
          // Teacher has no students, return empty
          return NextResponse.json({
            interventions: [],
            summary: {
              total: 0,
              by_status: {},
              by_priority: {}
            },
            pagination: { limit, offset, total: 0 }
          })
        }
      }
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: interventions, error: fetchError, count } = await query

    if (fetchError) {
      console.error('Error fetching interventions:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch interventions' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const summary = {
      total: count || 0,
      by_status: {
        pending: interventions?.filter(i => i.status === 'pending').length || 0,
        in_progress: interventions?.filter(i => i.status === 'in_progress').length || 0,
        completed: interventions?.filter(i => i.status === 'completed').length || 0,
        cancelled: interventions?.filter(i => i.status === 'cancelled').length || 0,
        on_hold: interventions?.filter(i => i.status === 'on_hold').length || 0
      },
      by_priority: {
        urgent: interventions?.filter(i => i.priority === 'urgent').length || 0,
        high: interventions?.filter(i => i.priority === 'high').length || 0,
        medium: interventions?.filter(i => i.priority === 'medium').length || 0,
        low: interventions?.filter(i => i.priority === 'low').length || 0
      }
    }

    return NextResponse.json({
      interventions,
      summary,
      pagination: {
        limit,
        offset,
        total: count
      }
    })

  } catch (error) {
    console.error('Unexpected error fetching interventions:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
