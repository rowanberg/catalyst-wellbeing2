import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
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
    const cookieStore = await cookies()
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user ID:', user.id)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('Profile lookup failed:', { 
        userId: user.id, 
        error: profileError,
        hint: 'User may not have a profile record in the profiles table'
      })
      return NextResponse.json({ 
        error: 'Profile not found. Please contact administrator.' 
      }, { status: 403 })
    }

    if (!['teacher', 'admin'].includes(profile.role)) {
      console.error('Invalid role:', { role: profile.role })
      return NextResponse.json({ error: 'Access denied - invalid role' }, { status: 403 })
    }

    console.log('User attempting update:', { userId: user.id, role: profile.role, schoolId: profile.school_id })

    const body = await request.json()
    const { status, resolutionNotes } = body

    // First verify the black mark exists and belongs to this school
    const { data: existingMark, error: fetchError } = await supabase
      .from('black_marks')
      .select('id, school_id, teacher_id')
      .eq('id', id)
      .single()

    if (fetchError || !existingMark) {
      console.error('Black mark not found:', { id, fetchError })
      return NextResponse.json({ error: 'Black mark not found' }, { status: 404 })
    }

    console.log('Black mark details:', { 
      markSchoolId: existingMark.school_id, 
      markTeacherId: existingMark.teacher_id,
      userSchoolId: profile.school_id,
      userId: user.id,
      userRole: profile.role
    })

    // Check if teacher has permission (created it or is admin)
    if (existingMark.school_id !== profile.school_id) {
      console.error('School mismatch:', { markSchool: existingMark.school_id, userSchool: profile.school_id })
      return NextResponse.json({ error: 'Access denied - different school' }, { status: 403 })
    }

    if (profile.role !== 'admin' && existingMark.teacher_id !== user.id) {
      console.error('Permission denied:', { markTeacher: existingMark.teacher_id, currentUser: user.id, role: profile.role })
      return NextResponse.json({ error: 'Access denied - not your black mark' }, { status: 403 })
    }

    console.log('Permission check passed, updating...')

    // Update black mark
    const updateData: any = {}
    if (status) updateData.status = status
    if (resolutionNotes) updateData.resolution_notes = resolutionNotes
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: blackMark, error: updateError } = await supabase
      .from('black_marks')
      .update(updateData)
      .eq('id', id)
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

// PATCH handler - same as PUT for updating black marks
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(request, { params })
}
