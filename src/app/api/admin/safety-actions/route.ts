import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    if (!body.incident_id || !body.action_type || !body.description) {
      return NextResponse.json({ 
        error: 'Incident ID, action type, and description are required' 
      }, { status: 400 })
    }

    const actionData = {
      incident_id: body.incident_id,
      action_type: body.action_type,
      description: body.description,
      taken_by_id: user.id,
      outcome: body.outcome,
      next_steps: body.next_steps
    }

    const { data: action, error } = await supabase
      .from('safety_actions')
      .insert(actionData)
      .select(`
        *,
        taken_by:profiles!safety_actions_taken_by_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error creating safety action:', error)
      return NextResponse.json({ error: 'Failed to create action' }, { status: 500 })
    }

    return NextResponse.json({ action }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/safety-actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
