import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId, timeRange = 'week' } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Calculate date range based on timeRange parameter
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 7)
    }

    // Get total users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)

    // Get active users (logged in within timeframe)
    const { data: recentSessions, error: sessionError } = await supabaseAdmin.auth.admin.listUsers()
    let activeUsers = 0
    if (!sessionError && recentSessions?.users) {
      activeUsers = recentSessions.users.filter((user: any) => {
        if (!user.last_sign_in_at) return false
        const lastSignIn = new Date(user.last_sign_in_at)
        return lastSignIn.getTime() >= startDate.getTime()
      }).length
    }

    // Get engagement metrics
    const [gratitudeResult, kindnessResult, courageResult, helpRequestsResult] = await Promise.all([
      supabaseAdmin
        .from('gratitude_entries')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),
      
      supabaseAdmin
        .from('kindness_counter')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),
      
      supabaseAdmin
        .from('courage_log')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('created_at', startDate.toISOString()),
      
      supabaseAdmin
        .from('help_requests')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'pending')
    ])

    // Get top performers (students with highest XP)
    const { data: topPerformers, error: performersError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name, total_xp, current_streak')
      .eq('school_id', schoolId)
      .eq('role', 'student')
      .order('total_xp', { ascending: false })
      .limit(10)

    const formattedPerformers = topPerformers?.map(student => ({
      name: `${student.first_name} ${student.last_name}`,
      xp: student.total_xp || 0,
      streak: student.current_streak || 0
    })) || []

    // Generate weekly activity data (mock data for now)
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      weeklyActivity.push({
        week: date.toISOString().split('T')[0],
        students: Math.floor(Math.random() * 50) + 20,
        teachers: Math.floor(Math.random() * 10) + 5,
        parents: Math.floor(Math.random() * 30) + 15
      })
    }

    const analyticsData = {
      totalUsers: totalUsers || 0,
      activeUsers,
      wellbeingTrend: [85, 87, 82, 90, 88, 91, 89], // Mock trend data
      engagementMetrics: {
        gratitudeEntries: gratitudeResult.count || 0,
        kindnessActs: kindnessResult.count || 0,
        courageEntries: courageResult.count || 0,
        helpRequests: helpRequestsResult.count || 0
      },
      weeklyActivity,
      topPerformers: formattedPerformers
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
