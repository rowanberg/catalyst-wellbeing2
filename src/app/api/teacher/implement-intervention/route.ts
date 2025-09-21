import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { activityId } = await request.json()

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Log the intervention implementation
    const { data: implementation, error: implementError } = await supabase
      .from('intervention_implementations')
      .insert({
        teacher_id: user.id,
        activity_id: activityId,
        school_id: profile.school_id,
        teacher_name: `${profile.first_name} ${profile.last_name}`,
        implementation_notes: `Activity implemented via intervention toolkit`
      })
      .select()
      .single()

    if (implementError) {
      console.error('Error logging intervention implementation:', implementError)
      return NextResponse.json({ error: 'Failed to log implementation' }, { status: 500 })
    }

    // Create a notification for admins about the intervention
    await supabase
      .from('admin_notifications')
      .insert({
        school_id: profile.school_id,
        type: 'intervention_implemented',
        title: 'Intervention Activity Implemented',
        message: `${profile.first_name} ${profile.last_name} implemented intervention activity: ${activityId}`,
        priority: 'medium',
        created_by: user.id
      })

    // Update teacher's intervention stats
    await supabase
      .from('teacher_intervention_stats')
      .upsert({
        teacher_id: user.id,
        school_id: profile.school_id,
        total_interventions: 1,
        last_intervention_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'teacher_id',
        ignoreDuplicates: false
      })

    return NextResponse.json({ 
      message: 'Intervention implemented successfully',
      implementationId: implementation.id
    })

  } catch (error) {
    console.error('Unexpected error in implement intervention API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
