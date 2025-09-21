import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const { data: incident, error } = await supabase
      .from('safety_incidents')
      .select(`
        *,
        student:profiles!safety_incidents_student_id_fkey(
          id,
          full_name,
          grade_level,
          email
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
          next_steps,
          taken_by:profiles!safety_actions_taken_by_id_fkey(
            id,
            full_name,
            role
          )
        )
      `)
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .single()

    if (error || !incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-incidents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params
    const incidentId = resolvedParams.id
    const body = await request.json()

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only update provided fields
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }
    }
    if (body.severity !== undefined) updateData.severity = body.severity
    if (body.assigned_to_id !== undefined) updateData.assigned_to_id = body.assigned_to_id
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.resolution_notes !== undefined) updateData.resolution_notes = body.resolution_notes
    if (body.follow_up_required !== undefined) updateData.follow_up_required = body.follow_up_required
    if (body.follow_up_date !== undefined) {
      updateData.follow_up_date = body.follow_up_date ? new Date(body.follow_up_date).toISOString() : null
    }
    if (body.parent_notified !== undefined) {
      updateData.parent_notified = body.parent_notified
      if (body.parent_notified && !updateData.parent_notification_date) {
        updateData.parent_notification_date = new Date().toISOString()
      }
    }

    const { data: incident, error } = await supabase
      .from('safety_incidents')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)
      .select(`
        *,
        student:profiles!safety_incidents_student_id_fkey(
          id,
          full_name,
          grade_level
        ),
        assigned_to:profiles!safety_incidents_assigned_to_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error updating incident:', error)
      return NextResponse.json({ error: 'Failed to update incident' }, { status: 500 })
    }

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 })
    }

    return NextResponse.json({ incident })
  } catch (error) {
    console.error('Error in PUT /api/admin/safety-incidents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const resolvedParams = await params
    const { error } = await supabase
      .from('safety_incidents')
      .delete()
      .eq('id', resolvedParams.id)
      .eq('school_id', profile.school_id)

    if (error) {
      console.error('Error deleting incident:', error)
      return NextResponse.json({ error: 'Failed to delete incident' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Incident deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/safety-incidents/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
