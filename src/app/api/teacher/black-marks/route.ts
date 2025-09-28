import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Fetching black marks...')

    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      console.log('❌ No authorization found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client for user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ User authentication failed:', userError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    console.log('👤 Authenticated user:', user.email)

    // Get user profile to check role and school
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

    // Try to get black marks, return empty array if table doesn't exist
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

    console.log('✅ Black marks fetched successfully:', blackMarks?.length || 0)

    return NextResponse.json({
      blackMarks: blackMarks || [],
      total: blackMarks?.length || 0
    })

  } catch (error) {
    console.error('❌ Error in teacher black marks API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 Creating black mark...')

    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      console.log('❌ No authorization found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client for user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ User authentication failed:', userError)
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get user profile to check role and school
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
    const { data: student, error: studentError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', studentId)
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .single()

    if (studentError || !student) {
      console.log('❌ Student not found:', studentError)
      return NextResponse.json({ error: 'Student not found or not in your school' }, { status: 404 })
    }

    // Create the black mark
    const { data: blackMark, error: createError } = await supabaseAdmin
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
