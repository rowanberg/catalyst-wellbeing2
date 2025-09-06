import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST HELP REQUESTS API START ===')
    
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
    
    // Test 1: Check raw help_requests table
    const { data: allHelpRequests, error: allError } = await supabaseAdmin
      .from('help_requests')
      .select('*')
      .limit(10)

    // Test 2: Check profiles table for admin
    let adminProfile = null
    let profileError = null
    if (user) {
      const { data: profile, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      adminProfile = profile
      profileError = pError
    }

    // Test 3: Check schools table
    const { data: allSchools, error: schoolsError } = await supabaseAdmin
      .from('schools')
      .select('*')

    // Test 4: Try to get help requests with joins
    const { data: helpRequestsWithJoins, error: joinError } = await supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        message,
        urgency,
        status,
        created_at,
        student_id,
        school_id,
        profiles!help_requests_student_id_fkey (
          first_name,
          last_name,
          grade_level,
          school_id
        )
      `)
      .limit(5)

    console.log('Test results:', {
      userAuth: !!user,
      allHelpRequestsCount: allHelpRequests?.length || 0,
      adminProfile: !!adminProfile,
      schoolsCount: allSchools?.length || 0,
      helpRequestsWithJoinsCount: helpRequestsWithJoins?.length || 0
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      authentication: {
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        userError: userError?.message
      },
      adminProfile: {
        profile: adminProfile,
        error: profileError?.message
      },
      database: {
        allHelpRequests: {
          count: allHelpRequests?.length || 0,
          data: allHelpRequests || [],
          error: allError?.message
        },
        schools: {
          count: allSchools?.length || 0,
          data: allSchools || [],
          error: schoolsError?.message
        },
        helpRequestsWithJoins: {
          count: helpRequestsWithJoins?.length || 0,
          data: helpRequestsWithJoins || [],
          error: joinError?.message
        }
      },
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
