import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Get admin's session
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

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    
    console.log('Authentication debug:', {
      user: !!user,
      userError: userError?.message,
      cookies: Object.keys(cookieStore.getAll().reduce((acc, cookie) => ({ ...acc, [cookie.name]: cookie.value }), {}))
    })
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        debug: {
          userError: userError?.message,
          availableCookies: cookieStore.getAll().map(c => c.name),
          message: 'Auth session missing!'
        }
      }, { status: 401 })
    }

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get admin profile with school info
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        role, 
        school_id,
        school_code,
        first_name,
        last_name,
        schools!profiles_school_id_fkey (
          id,
          school_code,
          name,
          messaging_encryption_key
        )
      `)
      .eq('user_id', user.id)
      .single()

    // Get all schools for reference
    const { data: allSchools, error: schoolsError } = await supabaseAdmin
      .from('schools')
      .select('id, school_code, name')
      .order('name')

    // Get help requests with school info
    const { data: helpRequestsWithSchools, error: helpError } = await supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        student_id,
        school_id,
        school_code,
        message,
        urgency,
        status,
        created_at,
        schools!help_requests_school_id_fkey (
          id,
          school_code,
          name
        ),
        profiles!help_requests_student_id_fkey (
          first_name,
          last_name,
          school_id,
          school_code
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      adminInfo: {
        id: user.id,
        email: user.email,
        profile: adminProfile,
        profileError: profileError?.message
      },
      schoolsData: {
        allSchools: allSchools || [],
        schoolsError: schoolsError?.message
      },
      helpRequestsData: {
        requests: helpRequestsWithSchools || [],
        helpError: helpError?.message
      },
      debug: {
        timestamp: new Date().toISOString(),
        note: "Check school_code values and help_requests.school_id relationships"
      }
    })

  } catch (error) {
    console.error('Debug school data error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
