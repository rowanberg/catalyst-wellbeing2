import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user by email from auth
    const { data: users, error: getUserError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (getUserError) {
      return NextResponse.json({
        error: 'Failed to fetch users',
        details: getUserError.message
      }, { status: 500 })
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json({
        message: 'User not found in auth system'
      }, { status: 404 })
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        message: 'Profile already exists',
        profile: existingProfile
      })
    }

    // Get a default school (first one available)
    const { data: schools, error: schoolsError } = await supabaseAdmin
      .from('schools')
      .select('*')
      .limit(1)

    if (schoolsError || !schools || schools.length === 0) {
      return NextResponse.json({
        message: 'No schools found. Please create a school first.',
        error: schoolsError?.message
      }, { status: 400 })
    }

    const defaultSchool = schools[0]

    // Create profile with default values
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.id,
        first_name: 'User',
        last_name: 'Student',
        role: 'student',
        school_id: defaultSchool.id,
        xp: 0,
        gems: 0,
        level: 1,
      })
      .select()
      .single()

    if (profileError) {
      return NextResponse.json({
        message: 'Failed to create profile',
        error: profileError.message
      }, { status: 500 })
    }

    // Also confirm the user's email if not already confirmed
    if (!user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { 
          email_confirm: true
        }
      )
    }

    return NextResponse.json({
      message: 'Profile created successfully',
      profile: profile,
      school: defaultSchool
    })
  } catch (error) {
    console.error('Fix profile API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
