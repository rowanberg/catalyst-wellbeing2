import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, schoolId } = await request.json()

    if (!email || !password || !firstName || !lastName || !schoolId) {
      return NextResponse.json({ 
        error: 'Missing required fields: email, password, firstName, lastName, schoolId' 
      }, { status: 400 })
    }

    // Check if environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.json({ 
        error: 'Server configuration error - missing Supabase credentials',
        details: 'Please configure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
      }, { status: 500 })
    }

    console.log('Creating admin user:', { email, firstName, lastName, schoolId })

    // Create user account using Supabase Admin
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    if (userError) {
      console.error('Error creating user:', userError)
      console.error('Full error details:', JSON.stringify(userError, null, 2))
      return NextResponse.json({ 
        error: 'Failed to create user account',
        details: userError.message,
        code: userError.code
      }, { status: 500 })
    }

    // Create admin profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        user_id: user.user.id,
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        school_id: schoolId,
        xp: 0,
        gems: 0,
        level: 1
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Clean up user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(user.user.id)
      return NextResponse.json({ 
        error: 'Failed to create admin profile',
        details: profileError.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.user.id,
        email: user.user.email,
        profile: {
          firstName: profile.first_name,
          lastName: profile.last_name,
          role: profile.role,
          schoolId: profile.school_id
        }
      }
    })

  } catch (error) {
    console.error('Create admin user API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
