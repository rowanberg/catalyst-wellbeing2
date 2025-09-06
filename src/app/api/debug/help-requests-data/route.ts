import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

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
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !adminProfile) {
      return NextResponse.json({ 
        error: 'Admin profile not found',
        details: profileError?.message 
      }, { status: 403 })
    }

    // Get all help requests for debugging
    const { data: allHelpRequests, error: allError } = await supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        student_id,
        school_id,
        message,
        urgency,
        status,
        created_at,
        profiles!help_requests_student_id_fkey (
          first_name,
          last_name,
          school_id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get help requests for admin's school only
    const { data: schoolHelpRequests, error: schoolError } = await supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        student_id,
        school_id,
        message,
        urgency,
        status,
        created_at,
        profiles!help_requests_student_id_fkey (
          first_name,
          last_name,
          school_id
        )
      `)
      .eq('school_id', adminProfile.school_id)
      .order('created_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      adminInfo: {
        id: user.id,
        email: user.email,
        name: `${adminProfile.first_name} ${adminProfile.last_name}`,
        role: adminProfile.role,
        school_id: adminProfile.school_id
      },
      allHelpRequests: {
        count: allHelpRequests?.length || 0,
        data: allHelpRequests || [],
        error: allError?.message
      },
      schoolFilteredHelpRequests: {
        count: schoolHelpRequests?.length || 0,
        data: schoolHelpRequests || [],
        error: schoolError?.message
      },
      debug: {
        timestamp: new Date().toISOString(),
        filteringBy: `school_id = ${adminProfile.school_id}`
      }
    })

  } catch (error) {
    console.error('Debug help requests error:', error)
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
