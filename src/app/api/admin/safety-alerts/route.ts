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
    const severity = searchParams.get('severity')
    const status = searchParams.get('status') || 'active'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
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
      .eq('school_id', profile.school_id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (severity && severity !== 'all') {
      query = query.eq('severity', severity)
    }

    const { data: alerts, error } = await query

    if (error) {
      console.error('Error fetching safety alerts:', error)
      return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
    }

    return NextResponse.json({ alerts: alerts || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/safety-alerts:', error)
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

    if (!profile || !['admin', 'principal', 'counselor'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.alert_type || !body.title || !body.message) {
      return NextResponse.json({ 
        error: 'Alert type, title, and message are required' 
      }, { status: 400 })
    }

    const alertData = {
      school_id: profile.school_id,
      alert_type: body.alert_type,
      severity: body.severity || 'medium',
      title: body.title,
      message: body.message,
      related_incident_id: body.related_incident_id,
      related_student_id: body.related_student_id,
      assigned_to_id: body.assigned_to_id || user.id,
      auto_generated: body.auto_generated || false
    }

    const { data: alert, error } = await supabase
      .from('safety_alerts')
      .insert(alertData)
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
        )
      `)
      .single()

    if (error) {
      console.error('Error creating safety alert:', error)
      return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
    }

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/safety-alerts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
