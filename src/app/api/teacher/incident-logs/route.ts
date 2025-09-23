import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Parse query parameters
    const studentId = searchParams.get('student_id')
    const incidentType = searchParams.get('incident_type')
    const severityLevel = searchParams.get('severity_level')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('incident_log_summaries')
      .select('*')
      .eq('teacher_id', profile.id)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (studentId) {
      query = query.eq('student_id', studentId)
    }
    if (incidentType) {
      query = query.eq('incident_type', incidentType)
    }
    if (severityLevel) {
      query = query.eq('severity_level', severityLevel)
    }

    const { data: incidents, error: incidentsError } = await query

    if (incidentsError) {
      console.error('Error fetching incident logs:', incidentsError)
      return NextResponse.json({ error: 'Failed to fetch incident logs' }, { status: 500 })
    }

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('incident_logs')
      .select('incident_type, severity_level')
      .eq('teacher_id', profile.id)
      .eq('school_id', profile.school_id)

    const summary = {
      total: stats?.length || 0,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      followUpRequired: 0
    }

    if (stats) {
      stats.forEach(incident => {
        // Count by type
        summary.byType[incident.incident_type as string] = (summary.byType[incident.incident_type as string] || 0) + 1
        // Count by severity
        summary.bySeverity[incident.severity_level as string] = (summary.bySeverity[incident.severity_level as string] || 0) + 1
      })
    }

    // Count follow-ups required
    const { count: followUpCount } = await supabase
      .from('incident_logs')
      .select('*', { count: 'exact', head: true })
      .eq('teacher_id', profile.id)
      .eq('school_id', profile.school_id)
      .eq('follow_up_required', true)
      .is('follow_up_date', null)

    summary.followUpRequired = followUpCount || 0

    return NextResponse.json({
      incidents: incidents || [],
      summary,
      pagination: {
        limit,
        offset,
        hasMore: (incidents?.length || 0) === limit
      }
    })

  } catch (error) {
    console.error('Unexpected error in incident logs API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      student_id,
      incident_type,
      severity_level,
      title,
      description,
      location,
      witnesses,
      action_taken,
      follow_up_required,
      follow_up_date,
      visible_to_admin,
      visible_to_counselor,
      is_confidential
    } = body

    // Validate required fields
    if (!student_id || !incident_type || !severity_level || !title || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: student_id, incident_type, severity_level, title, description' 
      }, { status: 400 })
    }

    // Validate student belongs to same school
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('id', student_id)
      .single()

    if (studentError || !student || student.role !== 'student' || student.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Invalid student or student not in your school' }, { status: 400 })
    }

    // Create incident log
    const incidentData = {
      student_id,
      teacher_id: profile.id,
      school_id: profile.school_id,
      incident_type,
      severity_level,
      title: title.trim(),
      description: description.trim(),
      location: location?.trim() || null,
      witnesses: witnesses || [],
      action_taken: action_taken?.trim() || null,
      follow_up_required: follow_up_required || false,
      follow_up_date: follow_up_date || null,
      visible_to_admin: visible_to_admin !== false, // Default true
      visible_to_counselor: visible_to_counselor || false,
      is_confidential: is_confidential !== false // Default true
    }

    const { data: incident, error: insertError } = await supabase
      .from('incident_logs')
      .insert(incidentData)
      .select(`
        *,
        student:student_id(first_name, last_name, grade_level, class_name)
      `)
      .single()

    if (insertError) {
      console.error('Error creating incident log:', insertError)
      return NextResponse.json({ error: 'Failed to create incident log' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Incident log created successfully',
      incident 
    }, { status: 201 })

  } catch (error) {
    console.error('Unexpected error creating incident log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const incidentId = searchParams.get('id')

    if (!incidentId) {
      return NextResponse.json({ error: 'Incident ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      title,
      description,
      location,
      witnesses,
      action_taken,
      follow_up_required,
      follow_up_date,
      follow_up_notes,
      visible_to_admin,
      visible_to_counselor,
      is_confidential
    } = body

    // Update incident log (RLS will ensure teacher can only update their own logs)
    const updateData = {
      ...(title && { title: title.trim() }),
      ...(description && { description: description.trim() }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(witnesses !== undefined && { witnesses }),
      ...(action_taken !== undefined && { action_taken: action_taken?.trim() || null }),
      ...(follow_up_required !== undefined && { follow_up_required }),
      ...(follow_up_date !== undefined && { follow_up_date }),
      ...(follow_up_notes !== undefined && { follow_up_notes: follow_up_notes?.trim() || null }),
      ...(visible_to_admin !== undefined && { visible_to_admin }),
      ...(visible_to_counselor !== undefined && { visible_to_counselor }),
      ...(is_confidential !== undefined && { is_confidential })
    }

    const { data: incident, error: updateError } = await supabase
      .from('incident_logs')
      .update(updateData)
      .eq('id', incidentId)
      .eq('teacher_id', profile.id) // Ensure teacher owns this log
      .select(`
        *,
        student:student_id(first_name, last_name, grade_level, class_name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating incident log:', updateError)
      return NextResponse.json({ error: 'Failed to update incident log' }, { status: 500 })
    }

    if (!incident) {
      return NextResponse.json({ error: 'Incident log not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Incident log updated successfully',
      incident 
    })

  } catch (error) {
    console.error('Unexpected error updating incident log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
