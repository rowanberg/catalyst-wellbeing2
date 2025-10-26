import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, gradeLevel, classSection, schoolCode } = await request.json()
    console.log('[fix-orphaned] Request for email:', email)

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Find the existing auth user
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = authUsers?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase())

    if (!existingUser) {
      return NextResponse.json({ error: 'No auth user found with this email' }, { status: 404 })
    }

    console.log('[fix-orphaned] Found auth user:', existingUser.id)

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', existingUser.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({ 
        success: true,
        message: 'Profile already exists',
        studentId: existingProfile.id 
      })
    }

    // Find school by code
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('school_code', schoolCode)
      .single()

    if (schoolError || !school) {
      return NextResponse.json({ error: 'Invalid school code' }, { status: 400 })
    }

    // Create the profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: existingUser.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: 'student',
        school_id: school.id,
        grade_level: gradeLevel,
        class_section: classSection,
      })
      .select('id')
      .single()

    if (profileError) {
      console.error('[fix-orphaned] Profile creation error:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    console.log('[fix-orphaned] Profile created:', profile.id)

    // Update auth user password if provided
    if (password) {
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password })
    }

    return NextResponse.json({
      success: true,
      message: 'Student account fixed successfully',
      studentId: profile.id,
      userId: existingUser.id
    })

  } catch (error: any) {
    console.error('[fix-orphaned] Error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
