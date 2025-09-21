import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to verify they are a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    // Get black marks for this teacher's school
    const { data: blackMarks, error: blackMarksError } = await supabase
      .rpc('get_teacher_black_marks', { 
        teacher_uuid: user.id,
        target_school_id: profile.school_id 
      })

    if (blackMarksError) {
      console.error('Error fetching black marks:', blackMarksError)
      return NextResponse.json({ error: 'Failed to fetch black marks' }, { status: 500 })
    }

    return NextResponse.json({
      blackMarks: blackMarks || [],
      total: blackMarks?.length || 0
    })

  } catch (error) {
    console.error('Error in teacher black marks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to verify they are a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      studentId,
      title,
      description,
      category,
      severity,
      remedyDescription,
      remedyType,
      remedyDueDate
    } = body

    // Validate required fields
    if (!studentId || !title || !description || !category || !severity || !remedyDescription || !remedyType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify student exists and is in the same school
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('id', studentId)
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found or not in your school' }, { status: 404 })
    }

    // Create the black mark
    const { data: blackMark, error: createError } = await supabase
      .from('black_marks')
      .insert({
        student_id: studentId,
        teacher_id: user.id,
        school_id: profile.school_id,
        title,
        description,
        category,
        severity,
        remedy_description: remedyDescription,
        remedy_type: remedyType,
        remedy_due_date: remedyDueDate || null,
        status: 'active'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating black mark:', createError)
      return NextResponse.json({ error: 'Failed to create black mark' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Black mark created successfully',
      blackMark
    }, { status: 201 })

  } catch (error) {
    console.error('Error in create black mark API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
