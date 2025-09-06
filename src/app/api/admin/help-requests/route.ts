import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check environment variables first to avoid hanging
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables:', {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
      return NextResponse.json({ 
        error: 'Server configuration error',
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 }
      })
    }

    // Check if we're in development mode with placeholder values
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co') {
      console.log('Using placeholder Supabase - returning mock data')
      return NextResponse.json({
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 }
      })
    }

    // Create client for user authentication
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // No-op for server-side
          },
          remove(name: string, options: any) {
            // No-op for server-side
          },
        },
      }
    )

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('=== ADMIN HELP REQUESTS API START ===')
    
    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    console.log('User authentication result:', { user: !!user, error: userError?.message })
    if (userError || !user) {
      console.log('Authentication failed:', userError?.message)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile and their school information
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        role, 
        school_id,
        schools!profiles_school_id_fkey (
          id,
          school_code,
          name
        )
      `)
      .eq('user_id', user.id)
      .single()

    console.log('Profile query result:', { adminProfile, error: profileError?.message })

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      console.log('Admin access denied:', { 
        profileError: profileError?.message, 
        hasProfile: !!adminProfile, 
        role: adminProfile?.role 
      })
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id || !adminProfile.schools) {
      console.log('Admin has no school association:', adminProfile)
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    const adminSchool = adminProfile.schools as any
    console.log('Admin school info:', { id: adminSchool.id, code: adminSchool.school_code, name: adminSchool.name })
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )
    
    // Get help requests only from students in the admin's school
    const helpRequestsQuery = supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        message,
        urgency,
        status,
        created_at,
        updated_at,
        student_id,
        school_id,
        profiles!help_requests_student_id_fkey (
          user_id,
          first_name,
          last_name,
          grade_level,
          class_name,
          school_id
        )
      `)
      .eq('school_id', adminSchool.id)
      .order('created_at', { ascending: false })

    const { data: helpRequests, error: helpRequestsError } = await Promise.race([
      helpRequestsQuery,
      timeoutPromise
    ]) as any

    console.log('Help requests query result:', {
      count: helpRequests?.length || 0,
      error: helpRequestsError?.message
    })

    if (helpRequestsError) {
      console.error('Error fetching help requests:', helpRequestsError)
      return NextResponse.json({ 
        error: 'Failed to fetch help requests',
        details: helpRequestsError.message,
        helpRequests: [],
        stats: { total: 0, pending: 0, urgent: 0, high: 0, resolved: 0 }
      }, { status: 500 })
    }

    // Transform data for frontend - student profiles are now included in the query
    const transformedRequests = helpRequests?.map((request: any) => {
      const studentProfile = request.profiles

      return {
        id: request.id,
        type: 'help_request',
        content: request.message,
        sender: studentProfile ? 
          `${studentProfile.first_name} ${studentProfile.last_name} (Grade ${studentProfile.grade_level})` : 
          `Student ID: ${request.student_id}`,
        recipient: 'Support Team',
        timestamp: request.created_at,
        severity: request.urgency,
        status: request.status,
        flagReason: `${request.urgency?.toUpperCase() || 'UNKNOWN'} priority help request`,
        priorityScore: request.urgency === 'high' ? 3 : request.urgency === 'medium' ? 2 : 1,
        location: null,
        incidentType: 'help_request',
        followUpRequired: request.urgency === 'high',
        notes: null,
        resolvedAt: null,
        studentInfo: studentProfile ? {
          grade: studentProfile.grade_level,
          class: studentProfile.class_name,
          school: studentProfile.school_id
        } : null,
        resolver: null
      }
    }) || []

    console.log('Transformed requests:', transformedRequests.length)

    const stats = {
      total: transformedRequests.length,
      pending: transformedRequests.filter((r: any) => r.status === 'pending').length,
      urgent: transformedRequests.filter((r: any) => r.severity === 'high').length,
      high: transformedRequests.filter((r: any) => r.severity === 'high').length,
      resolved: transformedRequests.filter((r: any) => r.status === 'resolved').length
    }

    console.log('Stats:', stats)
    console.log('=== ADMIN HELP REQUESTS API END ===')

    return NextResponse.json({
      helpRequests: transformedRequests,
      stats
    })

  } catch (error) {
    console.error('Help requests API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Create client for user authentication
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

    // Create service role client for admin operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile to verify role and school
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id) {
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    const { id, status, notes, followUpRequired } = await request.json()

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // First, verify the help request belongs to the admin's school
    const { data: helpRequest, error: helpRequestError } = await supabaseAdmin
      .from('help_requests')
      .select(`
        id,
        student_id,
        school_id
      `)
      .eq('id', id)
      .single()

    if (helpRequestError || !helpRequest) {
      return NextResponse.json({ error: 'Help request not found' }, { status: 404 })
    }

    // Get admin's school info for verification
    const { data: adminSchoolInfo, error: schoolError } = await supabaseAdmin
      .from('profiles')
      .select(`
        schools!profiles_school_id_fkey (
          id,
          school_code
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (schoolError || !adminSchoolInfo?.schools) {
      return NextResponse.json({ error: 'Admin school not found' }, { status: 403 })
    }

    const adminSchoolData = adminSchoolInfo.schools as any
    
    // Verify the help request belongs to the admin's school
    if (helpRequest.school_id !== adminSchoolData.id) {
      return NextResponse.json({ error: 'Forbidden - Cannot access help requests from other schools' }, { status: 403 })
    }

    // Update help request
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'resolved') {
      updateData.resolved_by = user.id
      updateData.resolved_at = new Date().toISOString()
    }

    if (notes !== undefined) {
      updateData.notes = notes
    }

    if (followUpRequired !== undefined) {
      updateData.follow_up_required = followUpRequired
    }

    const { error } = await supabaseAdmin
      .from('help_requests')
      .update(updateData)
      .eq('id', id)

    if (error) {
      console.error('Error updating help request:', error)
      return NextResponse.json({ error: 'Failed to update help request' }, { status: 500 })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Help requests update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
