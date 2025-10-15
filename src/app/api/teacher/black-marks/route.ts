import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching black marks...')

    // Create authenticated Supabase client from cookies
    const supabase = await createSupabaseServerClient()

    // Get current user and verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ Auth error:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Authenticated user:', user.email)

    // Verify user is a teacher and get school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'teacher') {
      console.log('❌ Access denied. Teacher role required:', profile.role)
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    console.log('✅ Teacher verified - School:', profile.school_id)

    // Fetch black marks using admin client to bypass RLS
    const { data: blackMarks, error: blackMarksError } = await supabaseAdmin
      .from('black_marks')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    if (blackMarksError) {
      console.log('⚠️ Black marks table may not exist:', blackMarksError)
      return NextResponse.json({
        blackMarks: [],
        total: 0,
        message: 'Black marks system not yet configured for this school'
      })
    }

    // If we have black marks, fetch student profiles separately
    let blackMarksWithNames: any[] = []
    
    if (blackMarks && blackMarks.length > 0) {
      // Get unique student IDs
      const studentIds = Array.from(new Set(blackMarks.map(mark => mark.student_id)))
      
      // Fetch student profiles
      const { data: studentProfiles } = await supabaseAdmin
        .from('profiles')
        .select('user_id, first_name, last_name, email')
        .in('user_id', studentIds)
      
      // Create a map for quick lookup
      const studentMap = new Map(
        studentProfiles?.map(student => [student.user_id, student]) || []
      )
      
      // Transform data to include student_name field
      blackMarksWithNames = blackMarks.map(mark => {
        const student = studentMap.get(mark.student_id)
        return {
          ...mark,
          student_name: student 
            ? `${student.first_name} ${student.last_name}`
            : 'Unknown Student'
        }
      })
    }

    console.log('✅ Black marks fetched successfully:', blackMarksWithNames.length)

    return NextResponse.json({
      blackMarks: blackMarksWithNames,
      total: blackMarksWithNames.length
    })

  } catch (error) {
    console.error('❌ Error in teacher black marks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 Creating black mark...')

    // Create authenticated Supabase client from cookies
    const supabase = await createSupabaseServerClient()

    // Get current user and verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ Auth error:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ Authenticated user:', user.email)

    // Verify user is a teacher and get school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'teacher') {
      console.log('❌ Access denied. Teacher role required:', profile.role)
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    console.log('✅ Teacher verified - School:', profile.school_id)

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

    console.log('🔍 Looking for student profile with ID:', studentId)
    
    // Verify student exists - try both user_id and id fields (same pattern as issue-credits API)
    let { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, id, school_id, role, first_name, last_name')
      .eq('user_id', studentId)
      .single()

    console.log('🔍 Student profile query by user_id:', { student, studentError })

    // If not found by user_id, try by id (profile.id)
    if (!student && studentError?.code === 'PGRST116') {
      console.log('🔍 Not found by user_id, trying by profile.id')
      const { data: studentByProfileId, error: profileIdError } = await supabaseAdmin
        .from('profiles')
        .select('user_id, id, school_id, role, first_name, last_name')
        .eq('id', studentId)
        .single()
      
      console.log('🔍 Student profile query by profile.id:', { studentByProfileId, profileIdError })
      
      if (studentByProfileId) {
        student = studentByProfileId
        studentError = profileIdError
      }
    }

    if (studentError || !student) {
      console.error('❌ Student verification failed:', studentError)
      return NextResponse.json({ error: 'Student not found or invalid' }, { status: 404 })
    }

    // Check if the profile has student role
    if (student.role !== 'student') {
      console.error('❌ Profile found but role is not student:', student.role)
      return NextResponse.json({ error: 'Profile is not a student' }, { status: 403 })
    }

    // Verify student is in the same school
    if (student.school_id !== profile.school_id) {
      console.error('❌ Student not in same school')
      return NextResponse.json({ error: 'Student not in same school' }, { status: 403 })
    }

    console.log('✅ Student verified:', student.first_name, student.last_name)

    // Create the black mark using the actual user_id from profile
    console.log('✅ Creating black mark for student_id:', student.user_id)
    const { data: blackMark, error: createError } = await supabaseAdmin
      .from('black_marks')
      .insert({
        student_id: student.user_id, // Use the actual user_id from profile
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

export async function PATCH(request: NextRequest) {
  try {
    console.log('📋 Updating black mark...')

    // Create authenticated Supabase client from cookies
    const supabase = await createSupabaseServerClient()

    // Get current user and verify authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ Auth error:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a teacher
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('❌ Profile not found:', profileError)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'teacher') {
      console.log('❌ Access denied. Teacher role required:', profile.role)
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    // Get black mark ID from URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const blackMarkId = pathParts[pathParts.length - 1]

    if (!blackMarkId) {
      return NextResponse.json({ error: 'Black mark ID is required' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 })
    }

    // Verify the black mark exists and belongs to this teacher's school
    const { data: existingMark, error: fetchError } = await supabaseAdmin
      .from('black_marks')
      .select('teacher_id, school_id')
      .eq('id', blackMarkId)
      .single()

    if (fetchError || !existingMark) {
      console.log('❌ Black mark not found:', fetchError)
      return NextResponse.json({ error: 'Black mark not found' }, { status: 404 })
    }

    // Verify teacher has access (either created it or in same school)
    if (existingMark.teacher_id !== user.id && existingMark.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update the black mark
    const updateData: any = { status }
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: updatedMark, error: updateError } = await supabaseAdmin
      .from('black_marks')
      .update(updateData)
      .eq('id', blackMarkId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating black mark:', updateError)
      return NextResponse.json({ error: 'Failed to update black mark' }, { status: 500 })
    }

    console.log('✅ Black mark updated successfully')

    return NextResponse.json({
      message: 'Black mark updated successfully',
      blackMark: updatedMark
    })

  } catch (error) {
    console.error('Error in update black mark API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
