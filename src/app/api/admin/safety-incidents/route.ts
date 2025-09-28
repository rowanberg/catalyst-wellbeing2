import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'counselor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('safety_incidents')
      .select(`
        *,
        student:profiles!safety_incidents_student_id_fkey(
          id,
          full_name,
          grade_level
        ),
        reported_by:profiles!safety_incidents_reported_by_id_fkey(
          id,
          full_name,
          role
        ),
        assigned_to:profiles!safety_incidents_assigned_to_id_fkey(
          id,
          full_name,
          role
        ),
        safety_actions(
          id,
          action_type,
          description,
          taken_at,
          outcome,
          taken_by:profiles!safety_actions_taken_by_id_fkey(
            id,
            full_name,
            role
          )
        )
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    if (type && type !== 'all') {
      query = query.eq('incident_type', type)
    }

    const { data: incidents, error } = await query

    if (error) {
      console.error('Error fetching safety incidents:', error)
      return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
    }

    return NextResponse.json({ incidents: incidents || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-incidents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'principal', 'counselor', 'teacher'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.student_id || !body.incident_type || !body.title || !body.description) {
      return NextResponse.json({ 
        error: 'Student ID, incident type, title, and description are required' 
      }, { status: 400 })
    }

    const incidentData = {
      school_id: profile.school_id,
      student_id: body.student_id,
      incident_type: body.incident_type,
      severity: body.severity || 'medium',
      title: body.title,
      description: body.description,
      location: body.location,
      witness_accounts: body.witness_accounts || [],
      evidence_files: body.evidence_files || [],
      reported_by_id: user.id,
      reported_by_type: profile.role,
      assigned_to_id: body.assigned_to_id,
      priority: body.priority || 3,
      is_anonymous: body.is_anonymous || false,
      follow_up_required: body.follow_up_required || false,
      follow_up_date: body.follow_up_date ? new Date(body.follow_up_date).toISOString() : null
    }

    const { data: incident, error } = await supabase
      .from('safety_incidents')
      .insert(incidentData)
      .select(`
        *,
        student:profiles!safety_incidents_student_id_fkey(
          id,
          full_name,
          grade_level
        ),
        reported_by:profiles!safety_incidents_reported_by_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error creating safety incident:', error)
      return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
    }

    // Create initial action record
    await supabase
      .from('safety_actions')
      .insert({
        incident_id: incident.id,
        action_type: 'investigation',
        description: 'Incident reported and investigation initiated',
        taken_by_id: user.id
      })

    // Create alert for assigned user or admin
    const alertData = {
      school_id: profile.school_id,
      alert_type: 'incident_reported',
      severity: incident.severity,
      title: `New ${incident.incident_type} incident reported`,
      message: `${incident.title} - ${incident.student?.full_name}`,
      related_incident_id: incident.id,
      related_student_id: incident.student_id,
      assigned_to_id: incident.assigned_to_id
    }

    await supabase.from('safety_alerts').insert(alertData)

    return NextResponse.json({ incident }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/safety-incidents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
