import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// =====================================================
// GET - Fetch a specific intervention with full details
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: interventionId } = await params

    // Fetch intervention with all related data
    const { data: intervention, error: fetchError } = await supabase
      .from('student_interventions')
      .select(`
        *,
        intervention_actions (*),
        intervention_participants (*),
        intervention_follow_ups (
          *
        )
      `)
      .eq('id', interventionId)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Intervention not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching intervention:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch intervention' },
        { status: 500 }
      )
    }

    return NextResponse.json({ intervention })

  } catch (error) {
    console.error('Unexpected error fetching intervention:', error)
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
// PATCH - Update an intervention
// =====================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only admins can update interventions
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can update interventions' },
        { status: 403 }
      )
    }

    const { id: interventionId } = await params
    const body = await request.json()

    // Allowed update fields
    const allowedFields = [
      'status',
      'priority',
      'notes',
      'special_instructions',
      'scheduled_start_date',
      'actual_start_date',
      'target_completion_date',
      'actual_completion_date',
      'outcome_summary',
      'effectiveness_rating'
    ]

    // Build update object with only allowed fields
    const updates: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    // Update the intervention
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('student_interventions')
      .update(updates)
      .eq('id', interventionId)
      .eq('school_id', profile.school_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating intervention:', updateError)
      return NextResponse.json(
        { error: 'Failed to update intervention' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      intervention: updatedIntervention,
      message: 'Intervention updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error updating intervention:', error)
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
// DELETE - Delete/Cancel an intervention
// =====================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Only admins can delete interventions
    if (profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can delete interventions' },
        { status: 403 }
      )
    }

    const { id: interventionId } = await params

    // Soft delete by setting status to cancelled
    const { error: updateError } = await supabase
      .from('student_interventions')
      .update({ 
        status: 'cancelled',
        outcome_summary: 'Cancelled by administrator'
      })
      .eq('id', interventionId)
      .eq('school_id', profile.school_id)

    if (updateError) {
      console.error('Error cancelling intervention:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel intervention' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Intervention cancelled successfully'
    })

  } catch (error) {
    console.error('Unexpected error cancelling intervention:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
