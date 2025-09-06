import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get user counts by role
    const { data: users, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('role, updated_at')
      .eq('school_id', schoolId)

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

    // Get help requests count
    const { count: helpRequestsCount, error: helpError } = await supabaseAdmin
      .from('help_requests')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'pending')

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
