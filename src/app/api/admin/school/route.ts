import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  console.log('=== ADMIN SCHOOL API START ===')
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('User auth result:', { 
      userId: user?.id, 
      userEmail: user?.email,
      error: userError?.message 
    })
    
    if (userError || !user) {
      console.log('Auth failed, returning 401')
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile using user_id field
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, role, first_name, last_name, id')
      .eq('user_id', user.id)

    console.log('Profile query result:', { 
      searchingForUserId: user.id,
      profilesFound: profiles?.length,
      profiles, 
      error: profileError?.message
    })
    
    if (profileError || !profiles || profiles.length === 0) {
      console.log('Profile not found, returning 404')
      return NextResponse.json(
        { message: 'Profile not found', userId: user.id, error: profileError?.message },
        { status: 404 }
      )
    }

    // Use the first profile if multiple exist
    const profile = profiles[0]
    if (profiles.length > 1) {
      console.log('Warning: Multiple profiles found for user, using first one')
    }

    // Check if user is admin
    if (profile.role !== 'admin') {
      console.log('User is not admin, role:', profile.role)
      return NextResponse.json(
        { message: 'Access denied. Admin role required.' },
        { status: 403 }
      )
    }

    console.log('Fetching school with ID:', profile.school_id)
    // Get school information using supabaseAdmin for better access
    const { data: school, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('*')
      .eq('id', profile.school_id)
      .single()

    console.log('School query result:', { school: school?.name, error: schoolError?.message })
    if (schoolError) {
      console.error('School fetch error:', schoolError)
      return NextResponse.json(
        { message: `Failed to fetch school: ${schoolError.message}` },
        { status: 500 }
      )
    }

    if (!school) {
      console.log('School not found for ID:', profile.school_id)
      return NextResponse.json(
        { message: 'School not found' },
        { status: 404 }
      )
    }

    console.log('Successfully returning school data:', school.name)
    return NextResponse.json({ school })
  } catch (error) {
    console.error('Admin school API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
