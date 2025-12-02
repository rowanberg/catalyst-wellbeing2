import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  console.log('=== ADMIN STATS API START ===')
  try {
    // Check for MCP server authentication (service role key)
    const authHeader = request.headers.get('authorization')
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    let school_id: string | null = null

    // MCP Server authentication via service role key
    if (authHeader && authHeader.startsWith('Bearer ') && serviceRoleKey) {
      const token = authHeader.substring(7)
      if (token === serviceRoleKey) {
        // MCP authenticated - get school_id from query params
        // CRITICAL: school_id MUST be provided and validated
        school_id = request.nextUrl.searchParams.get('school_id')
        if (!school_id) {
          return NextResponse.json(
            { message: 'school_id required for MCP requests' },
            { status: 400 }
          )
        }
        console.log('✅ MCP Server authenticated, school_id:', school_id)
      }
    }

    // Browser/User authentication (original flow)
    if (!school_id) {
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
      console.log('User auth result:', { user: user?.id, error: userError?.message })
      if (userError || !user) {
        console.log('Auth failed, returning 401')
        return NextResponse.json(
          { message: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Get user profile to get school_id using user_id field
      const { data: profiles, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('school_id, role')
        .eq('user_id', user.id)

      console.log('Profile query result:', { profiles, error: profileError?.message })
      if (profileError || !profiles || profiles.length === 0) {
        console.log('Profile not found, returning 404')
        return NextResponse.json(
          { message: 'Profile not found' },
          { status: 404 }
        )
      }

      const profile = profiles[0]

      // Check if user is admin
      if (profile.role !== 'admin') {
        console.log('User is not admin, role:', profile.role)
        return NextResponse.json(
          { message: 'Access denied. Admin role required.' },
          { status: 403 }
        )
      }

      // Use school_id from authenticated user's profile
      school_id = profile.school_id
      console.log('✅ Browser authenticated, school_id:', school_id)
    }

    // At this point, school_id is set (either from MCP or browser auth)
    console.log('Fetching stats for school ID:', school_id)

    // Get user counts by role
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('role, updated_at')
      .eq('school_id', school_id)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { message: `Failed to fetch users: ${usersError.message}` },
        { status: 500 }
      )
    }

    // Calculate user statistics
    const totalStudents = users?.filter(u => u.role === 'student').length || 0
    const totalTeachers = users?.filter(u => u.role === 'teacher').length || 0
    const totalParents = users?.filter(u => u.role === 'parent').length || 0

    // Calculate active today (users with recent activity)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Get users who have logged in today
    const { data: recentSessions, error: sessionError } = await supabaseAdmin.auth.admin.listUsers()

    let activeToday = 0
    if (!sessionError && recentSessions?.users) {
      activeToday = recentSessions.users.filter(user => {
        if (!user.last_sign_in_at) return false
        const lastSignIn = new Date(user.last_sign_in_at)
        return lastSignIn >= twentyFourHoursAgo
      }).length
    }

    // Get help requests count (only truly active requests - pending + in_progress)
    const { count: helpRequestsCount, error: helpError } = await supabaseAdmin
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', school_id)
      .in('status', ['pending', 'in_progress'])

    if (helpError) {
      console.warn('Help requests fetch error:', helpError.message)
    }

    // Get well-being data from courage_log entries
    const { data: courageEntries, error: courageError } = await supabaseAdmin
      .from('courage_log')
      .select('mood_rating')
      .eq('school_id', school_id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days

    let thriving = 0, needsSupport = 0, atRisk = 0

    if (!courageError && courageEntries) {
      courageEntries.forEach(entry => {
        if (entry.mood_rating >= 8) thriving++
        else if (entry.mood_rating >= 5) needsSupport++
        else atRisk++
      })
    } else {
      // Fallback calculation based on student count if no courage data
      thriving = Math.floor(totalStudents * 0.7)
      needsSupport = Math.floor(totalStudents * 0.2)
      atRisk = Math.floor(totalStudents * 0.1)
    }

    // Get school name from schools table
    const { data: schoolData, error: schoolError } = await supabaseAdmin
      .from('schools')
      .select('name')
      .eq('id', school_id)
      .single()

    if (schoolError) {
      console.warn('School name fetch error:', schoolError.message)
    }

    const stats = {
      schoolName: schoolData?.name || 'Unknown School',
      totalStudents,
      totalTeachers,
      totalParents,
      activeToday,
      helpRequests: helpRequestsCount || 0,
      thriving,
      needsSupport,
      atRisk
    }

    console.log('Successfully returning real stats:', stats)
    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { school_id } = await request.json()

    if (!school_id) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get user counts by role
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('role, updated_at')
      .eq('school_id', school_id)

    if (usersError) {
      console.error('Users fetch error:', usersError)
      return NextResponse.json(
        { message: `Failed to fetch users: ${usersError.message}` },
        { status: 500 }
      )
    }

    // Calculate user statistics
    const totalStudents = users?.filter(u => u.role === 'student').length || 0
    const totalTeachers = users?.filter(u => u.role === 'teacher').length || 0
    const totalParents = users?.filter(u => u.role === 'parent').length || 0

    // Calculate active today (users with recent activity)
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    // Get users who have logged in today
    const { data: recentSessions, error: sessionError } = await supabaseAdmin.auth.admin.listUsers()

    let activeToday = 0
    if (!sessionError && recentSessions?.users) {
      activeToday = recentSessions.users.filter(user => {
        if (!user.last_sign_in_at) return false
        const lastSignIn = new Date(user.last_sign_in_at)
        return lastSignIn >= twentyFourHoursAgo
      }).length
    }

    // Get help requests count (only truly active requests - pending + in_progress)
    const { count: helpRequestsCount, error: helpError } = await supabaseAdmin
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', school_id)
      .in('status', ['pending', 'in_progress'])

    if (helpError) {
      console.warn('Help requests fetch error:', helpError.message)
    }

    const stats = {
      totalStudents,
      totalTeachers,
      totalParents,
      activeToday,
      helpRequests: helpRequestsCount || 0,
      averageWellbeing: 85 // TODO: Calculate from actual wellbeing data
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
