import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, schoolName } = await request.json()

    // Create auth client
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current user
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('Creating/updating profile for user:', user.id)

    // First, create or get school
    let schoolId: string
    
    const { data: existingSchool } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('name', schoolName)
      .single()

    if (existingSchool) {
      schoolId = existingSchool.id
    } else {
      // Create new school
      const { data: newSchool, error: schoolError } = await supabaseAdmin
        .from('schools')
        .insert({
          name: schoolName,
          address: '123 Main St',
          phone: '555-0123',
          email: 'admin@school.edu',
          admin_id: user.id,
          school_code: `SCH${Date.now().toString().slice(-6)}`
        })
        .select('id')
        .single()

      if (schoolError) {
        console.error('School creation error:', schoolError)
        return NextResponse.json({ error: 'Failed to create school' }, { status: 500 })
      }

      schoolId = newSchool.id
    }

    // Check if profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          school_id: schoolId,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Profile update error:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        profile: updatedProfile,
        message: 'Profile updated successfully'
      })
    } else {
      // Create new profile
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          school_id: schoolId
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Profile creation error:', createError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        profile: newProfile,
        message: 'Profile created successfully'
      })
    }

  } catch (error) {
    console.error('Create admin profile error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
