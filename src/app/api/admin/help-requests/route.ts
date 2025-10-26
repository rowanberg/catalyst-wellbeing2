import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// export const dynamic = 'force-dynamic' // Removed for Capacitor static export

export async function GET(request: Request) {
  try {
    // Parse URL parameters
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') || 'active' // 'active', 'resolved', or 'all'
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
        school_code,
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

    // Check if admin has school_code (preferred) or fallback to school_id
    let adminSchoolCode = adminProfile.school_code
    let adminSchoolId = adminProfile.school_id
    
    if (!adminSchoolCode && adminProfile.schools) {
      adminSchoolCode = (adminProfile.schools as any).school_code
    }
    
    if (!adminSchoolCode && !adminSchoolId) {
      console.log('Admin has no school association:', adminProfile)
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    console.log('Admin school identifiers:', { schoolCode: adminSchoolCode, schoolId: adminSchoolId })
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    )
    
    // Build query based on status filter - use school_code if available, otherwise school_id
    let helpRequestsQuery = supabaseAdmin
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
        school_code,
        resolved_at,
        resolver,
        notes
      `)
      .order('created_at', { ascending: false })

    // Filter by school_code if available, otherwise by school_id
    if (adminSchoolCode) {
      helpRequestsQuery = helpRequestsQuery.eq('school_code', adminSchoolCode)
      console.log('Filtering by school_code:', adminSchoolCode)
    } else if (adminSchoolId) {
      helpRequestsQuery = helpRequestsQuery.eq('school_id', adminSchoolId)
      console.log('Filtering by school_id:', adminSchoolId)
    }

    // Apply status filter
    if (statusFilter === 'resolved') {
      helpRequestsQuery = helpRequestsQuery.eq('status', 'resolved')
    } else if (statusFilter === 'active') {
      helpRequestsQuery = helpRequestsQuery.neq('status', 'resolved')
    }
    // 'all' means no additional filter

    let { data: helpRequests, error: helpRequestsError } = await Promise.race([
      helpRequestsQuery,
      timeoutPromise
    ]) as any

    console.log('Help requests query result:', {
      count: helpRequests?.length || 0,
      error: helpRequestsError?.message,
      filterUsed: adminSchoolCode ? 'school_code' : 'school_id',
      filterValue: adminSchoolCode || adminSchoolId,
      sampleRequest: helpRequests?.[0]
    })

    // No need to filter in JavaScript since we're now filtering in SQL
    console.log('Help requests filtered in SQL:', { 
      filterType: adminSchoolCode ? 'school_code' : 'school_id',
      filterValue: adminSchoolCode || adminSchoolId,
      count: helpRequests?.length || 0 
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

    // Transform data for frontend - simplified without profile joins
    const transformedRequests = helpRequests?.map((request: any) => {
      return {
        id: request.id,
        type: 'help_request',
        content: request.message,
        sender: `Student ID: ${request.student_id}`,
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
        studentInfo: {
          school_code: request.school_code,
          school_id: request.school_id
        },
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
    console.log('=== PATCH HELP REQUEST START ===')
    
    const body = await request.json()
    console.log('Request body:', body)
    
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
    console.log('User auth result:', { user: !!user, error: userError })
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile to verify role and school (matching GET endpoint structure)
    const { data: adminProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        role,
        school_code,
        school_id,
        first_name,
        last_name,
        schools!profiles_school_id_fkey (
          id,
          name,
          school_code
        )
      `)
      .eq('user_id', user.id)
      .single()

    console.log('Admin profile result:', { adminProfile, error: profileError })

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      console.log('Admin access denied:', { profileError, role: adminProfile?.role })
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    if (!adminProfile.school_id) {
      return NextResponse.json({ error: 'Admin not associated with a school' }, { status: 400 })
    }

    const { id, status, notes, followUpRequired } = body

    if (!id || !status) {
      console.log('Missing required fields:', { id, status })
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

    // Use school_code or school_id from admin profile for verification
    const adminSchoolCode = adminProfile.school_code
    const adminSchoolId = adminProfile.school_id

    if (!adminSchoolCode && !adminSchoolId) {
      return NextResponse.json({ error: 'Admin school association not found' }, { status: 403 })
    }

    // Verify the help request belongs to the admin's school using school_code or school_id
    const { data: helpRequestWithSchool, error: schoolVerifyError } = await supabaseAdmin
      .from('help_requests')
      .select('school_code, school_id')
      .eq('id', id)
      .single()

    if (schoolVerifyError || !helpRequestWithSchool) {
      return NextResponse.json({ error: 'Help request not found' }, { status: 404 })
    }

    // Check if help request belongs to admin's school (by school_code or school_id)
    const belongsToSchool = (adminSchoolCode && helpRequestWithSchool.school_code === adminSchoolCode) ||
                           (adminSchoolId && helpRequestWithSchool.school_id === adminSchoolId)

    if (!belongsToSchool) {
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
      
      // Get admin name for resolver field
      const { data: adminProfile } = await supabaseAdmin
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()
      
      if (adminProfile) {
        updateData.resolver = `${adminProfile.first_name} ${adminProfile.last_name}`.trim()
      }
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

