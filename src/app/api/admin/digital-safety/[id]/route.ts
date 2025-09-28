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
    const checkId = resolvedParams.id

    // Verify the digital safety check belongs to the user's school
    const { data: existingCheck } = await supabase
      .from('digital_safety_checks')
      .select('school_id')
      .eq('id', checkId)
      .single()

    if (!existingCheck || existingCheck.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Digital safety check not found' }, { status: 404 })
    }

    const updateData: any = {}

    // Only update provided fields
    if (body.parent_notified !== undefined) {
      updateData.parent_notified = body.parent_notified
    }
    if (body.parent_notification_date !== undefined) {
      updateData.parent_notification_date = body.parent_notification_date
    }
    if (body.review_notes !== undefined) {
      updateData.review_notes = body.review_notes
    }
    if (body.false_positive !== undefined) {
      updateData.false_positive = body.false_positive
    }
    if (body.manual_review_required !== undefined) {
      updateData.manual_review_required = body.manual_review_required
    }

    const { data: updatedCheck, error } = await supabase
      .from('digital_safety_checks')
      .update(updateData)
      .eq('id', checkId)
      .select(`
        *,
        student:profiles!digital_safety_checks_student_id_fkey(
          id,
          full_name,
          grade_level
        ),
        reviewed_by:profiles!digital_safety_checks_reviewed_by_id_fkey(
          id,
          full_name,
          role
        )
      `)
      .single()

    if (error) {
      console.error('Error updating digital safety check:', error)
      return NextResponse.json({ error: 'Failed to update digital safety check' }, { status: 500 })
    }

    return NextResponse.json({ digitalCheck: updatedCheck })
  } catch (error) {
    console.error('Error in PUT /api/admin/digital-safety/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
