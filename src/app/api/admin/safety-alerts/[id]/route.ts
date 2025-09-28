import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    const body = await request.json()
    const resolvedParams = await params
    const alertId = resolvedParams.id

    // Verify the alert belongs to the user's school
    const { data: existingAlert } = await supabase
      .from('safety_alerts')
      .select('school_id')
      .eq('id', alertId)
      .single()

    if (!existingAlert || existingAlert.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Handle acknowledgment
    if (body.acknowledged !== undefined) {
      updateData.acknowledged = body.acknowledged
      if (body.acknowledged) {
        updateData.acknowledged_by_id = user.id
        updateData.acknowledged_at = new Date().toISOString()
      } else {
        updateData.acknowledged_by_id = null
        updateData.acknowledged_at = null
      }
    }

    // Handle status updates
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
      }
    }

    // Handle assignment changes
    if (body.assigned_to_id !== undefined) {
      updateData.assigned_to_id = body.assigned_to_id
    }

    const { data: updatedAlert, error } = await supabase
      .from('safety_alerts')
      .update(updateData)
      .eq('id', alertId)
      .select(`
        *,
        assigned_to:profiles!safety_alerts_assigned_to_id_fkey(
          id,
          full_name,
          role
        ),
        related_student:profiles!safety_alerts_related_student_id_fkey(
          id,
          full_name,
          grade_level
        ),
        acknowledged_by:profiles!safety_alerts_acknowledged_by_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error updating safety alert:', error)
      return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    }

    return NextResponse.json({ alert: updatedAlert })
  } catch (error) {
    console.error('Error in PUT /api/admin/safety-alerts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const alertId = resolvedParams.id

    // Verify the alert belongs to the user's school
    const { data: existingAlert } = await supabase
      .from('safety_alerts')
      .select('school_id')
      .eq('id', alertId)
      .single()

    if (!existingAlert || existingAlert.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const { data: alert, error } = await supabase
      .from('safety_alerts')
      .select(`
        *,
        assigned_to:profiles!safety_alerts_assigned_to_id_fkey(
          id,
          full_name,
          role
        ),
        related_student:profiles!safety_alerts_related_student_id_fkey(
          id,
          full_name,
          grade_level
        ),
        acknowledged_by:profiles!safety_alerts_acknowledged_by_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq('id', alertId)
      .single()

    if (error) {
      console.error('Error fetching safety alert:', error)
      return NextResponse.json({ error: 'Failed to fetch alert' }, { status: 500 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-alerts/[id]:', error)
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
    const alertId = resolvedParams.id

    // Verify the alert belongs to the user's school
    const { data: existingAlert } = await supabase
      .from('safety_alerts')
      .select('school_id')
      .eq('id', alertId)
      .single()

    if (!existingAlert || existingAlert.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('safety_alerts')
      .delete()
      .eq('id', alertId)

    if (error) {
      console.error('Error deleting safety alert:', error)
      return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Alert deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/safety-alerts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
