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
    const riskLevel = searchParams.get('risk_level')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('digital_safety_checks')
      .select(`
        *,
        student:profiles!digital_safety_checks_student_id_fkey(
          id,
          full_name,
          grade_level,
          email
        ),
        reviewed_by:profiles!digital_safety_checks_reviewed_by_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .eq('school_id', profile.school_id)
      .order('check_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (riskLevel && riskLevel !== 'all') {
      query = query.eq('risk_level', riskLevel)
    }

    const { data: digitalChecks, error } = await query

    if (error) {
      console.error('Error fetching digital safety checks:', error)
      return NextResponse.json({ error: 'Failed to fetch digital safety data' }, { status: 500 })
    }

    return NextResponse.json({ digitalChecks: digitalChecks || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/digital-safety:', error)
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

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    if (!body.student_id || !body.risk_level) {
      return NextResponse.json({ 
        error: 'Student ID and risk level are required' 
      }, { status: 400 })
    }

    const checkData = {
      school_id: profile.school_id,
      student_id: body.student_id,
      risk_level: body.risk_level,
      flagged_content_count: body.flagged_content_count || 0,
      content_categories: body.content_categories || [],
      platforms_checked: body.platforms_checked || [],
      ai_confidence_score: body.ai_confidence_score,
      manual_review_required: body.manual_review_required || false,
      parent_notified: body.parent_notified || false,
      parent_notification_date: body.parent_notified ? new Date().toISOString() : null,
      reviewed_by_id: user.id,
      review_notes: body.review_notes,
      false_positive: body.false_positive || false
    }

    const { data: digitalCheck, error } = await supabase
      .from('digital_safety_checks')
      .insert(checkData)
      .select(`
        *,
        student:profiles!digital_safety_checks_student_id_fkey(
          id,
          full_name,
          grade_level
        )
      `)
      .single()

    if (error) {
      console.error('Error creating digital safety check:', error)
      return NextResponse.json({ error: 'Failed to create digital safety check' }, { status: 500 })
    }

    // Create alert if high risk
    if (digitalCheck.risk_level === 'high' || digitalCheck.risk_level === 'critical') {
      await supabase.from('safety_alerts').insert({
        school_id: profile.school_id,
        alert_type: 'high_risk_detected',
        severity: digitalCheck.risk_level === 'critical' ? 'critical' : 'high',
        title: `High risk digital activity detected`,
        message: `${digitalCheck.student?.full_name} - ${digitalCheck.flagged_content_count} items flagged`,
        related_student_id: digitalCheck.student_id,
        assigned_to_id: user.id
      })
    }

    return NextResponse.json({ digitalCheck }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/digital-safety:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
