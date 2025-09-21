import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get black mark with related data
    const { data: blackMark, error: blackMarkError } = await supabase
      .from('black_marks')
      .select(`
        *,
        student:profiles!student_id(first_name, last_name, email),
        teacher:profiles!teacher_id(first_name, last_name),
        submissions:black_mark_submissions(*),
        comments:black_mark_comments(*, author:profiles(first_name, last_name, role))
      `)
      .eq('id', id)
      .eq('school_id', profile.school_id)
      .single()

    if (blackMarkError || !blackMark) {
      return NextResponse.json({ error: 'Black mark not found' }, { status: 404 })
    }

    return NextResponse.json({ blackMark })

  } catch (error) {
    console.error('Error fetching black mark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { status, resolutionNotes } = body

    // Update black mark
    const updateData: any = {}
    if (status) updateData.status = status
    if (resolutionNotes) updateData.resolution_notes = resolutionNotes
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
      updateData.resolved_by = user.id
    }

    const { data: blackMark, error: updateError } = await supabase
      .from('black_marks')
      .update(updateData)
      .eq('id', id)
      .eq('school_id', profile.school_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating black mark:', updateError)
      return NextResponse.json({ error: 'Failed to update black mark' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Black mark updated successfully',
      blackMark
    })

  } catch (error) {
    console.error('Error updating black mark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
