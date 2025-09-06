import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { userId, firstName, lastName, role, schoolCode, email, password } = await request.json()

    let user = null
    let shouldCreateUser = false

    // Check if we need to create the user (for regular signups)
    if (email && password) {
      // Create user with admin client - auto-confirm email for development
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email to bypass email verification
      })

      if (authError) {
        console.error('User creation error:', authError)
        return NextResponse.json(
          { message: `Failed to create user: ${authError.message}` },
          { status: 500 }
        )
      }

      user = authData.user
      shouldCreateUser = true
    } else {
      // Use provided userId (for admin-created users)
      user = { id: userId }
    }

    if (!user) {
      return NextResponse.json(
        { message: 'Failed to get user information' },
        { status: 400 }
      )
    }

    // Get the school ID from the school code
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('school_code', schoolCode)
      .single()

    if (schoolError || !school) {
      console.error('School lookup error:', schoolError)
      return NextResponse.json(
        { message: 'Invalid school code' },
        { status: 400 }
      )
    }

    // Create the user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        role,
        school_id: school.id,
        xp: 0,
        gems: 0,
        level: 1,
      })
      .select()
      .single()

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return NextResponse.json(
        { message: `Failed to create profile: ${profileError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      user: shouldCreateUser ? user : null, 
      profile,
      message: 'Profile created successfully'
    })
  } catch (error) {
    console.error('Create profile API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
