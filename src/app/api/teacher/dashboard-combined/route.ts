import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// In-memory cache for teacher dashboard data (5 minutes TTL)
const dashboardCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')

    if (!teacherId) {
      return NextResponse.json(
        { message: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `teacher-dashboard-${teacherId}`
    const cached = dashboardCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const response = NextResponse.json(cached.data)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
      return response
    }

    // Start all queries in parallel for better performance
    const [
      teacherClassesResult,
      teacherProfileResult
    ] = await Promise.allSettled([
      supabaseAdmin
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId),
      supabaseAdmin
        .from('profiles')
        .select('school_id, first_name, last_name')
        .eq('user_id', teacherId)
        .single()
    ])

    // Handle teacher classes
    let classIds: string[] = []
    let teacherSchoolId: string | null = null

    if (teacherClassesResult.status === 'fulfilled' && teacherClassesResult.value.data) {
      classIds = teacherClassesResult.value.data.map((tc: any) => tc.class_id)
    }

    // Handle teacher profile
    if (teacherProfileResult.status === 'fulfilled' && teacherProfileResult.value.data) {
      teacherSchoolId = teacherProfileResult.value.data.school_id
    }

    if (classIds.length === 0) {
      return NextResponse.json({
        analytics: {
          totalStudents: 0,
          averageXP: 0,
          activeToday: 0,
          helpRequests: 0,
          moodDistribution: { happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0 },
          averageStreak: 0
        },
        students: [],
        teacherInfo: {
          name: teacherProfileResult.status === 'fulfilled' ? 
            `${teacherProfileResult.value.data?.first_name || ''} ${teacherProfileResult.value.data?.last_name || ''}`.trim() : 
            'Teacher',
          schoolId: teacherSchoolId
        }
      })
    }

    // Fetch all required data in parallel
    const [
      studentAssignmentsResult,
      classInfoResult,
      helpRequestsResult
    ] = await Promise.allSettled([
      supabaseAdmin
        .from('student_class_assignments')
        .select('student_id, class_id')
        .in('class_id', classIds)
        .eq('is_active', true),
      supabaseAdmin
        .from('classes')
        .select('id, class_name, subject, room_number, grade_level_id')
        .in('id', classIds),
      supabaseAdmin
        .from('help_requests')
        .select('id, urgency_level, status, created_at')
        .eq('school_id', teacherSchoolId)
        .eq('status', 'pending')
    ])

    // Process student assignments
    let studentIds: string[] = []
    if (studentAssignmentsResult.status === 'fulfilled' && studentAssignmentsResult.value.data) {
      studentIds = Array.from(new Set(studentAssignmentsResult.value.data.map((sa: any) => sa.student_id)))
    }

    // Fetch student profiles if we have student IDs (limit to 100 for performance)
    let studentProfiles: any[] = []
    if (studentIds.length > 0) {
      const limitedStudentIds = studentIds.slice(0, 100) // Prevent massive queries
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select(`
          user_id, first_name, last_name, xp, level, gems, 
          streak_days, current_mood, updated_at, grade_level
        `)
        .in('user_id', limitedStudentIds)
        .order('updated_at', { ascending: false })
        .limit(100)
      
      studentProfiles = profiles || []
    }

    // Calculate analytics
    const totalStudents = studentProfiles.length
    const averageXP = totalStudents > 0 
      ? Math.round(studentProfiles.reduce((sum: number, s: any) => sum + (s.xp || 0), 0) / totalStudents) 
      : 0

    // Calculate active today (students active in last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const activeToday = studentProfiles.filter((s: any) => {
      const lastActive = new Date(s.updated_at)
      return lastActive >= yesterday
    }).length

    // Calculate average streak
    const averageStreak = totalStudents > 0
      ? Math.round(studentProfiles.reduce((sum: number, s: any) => sum + (s.streak_days || 0), 0) / totalStudents)
      : 0

    // Calculate mood distribution
    const moodDistribution = {
      happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0
    }
    
    studentProfiles.forEach((student: any) => {
      const mood = student.current_mood || 'neutral'
      if (mood in moodDistribution) {
        moodDistribution[mood as keyof typeof moodDistribution]++
      }
    })

    // Process help requests
    const helpRequests = helpRequestsResult.status === 'fulfilled' && helpRequestsResult.value.data 
      ? helpRequestsResult.value.data.length 
      : 0

    // Process class information
    const classInfo = classInfoResult.status === 'fulfilled' && classInfoResult.value.data 
      ? classInfoResult.value.data 
      : []

    // Create lookup maps for O(1) access instead of O(n) searches
    const assignmentMap = new Map(
      studentAssignmentsResult.status === 'fulfilled' && studentAssignmentsResult.value.data
        ? studentAssignmentsResult.value.data.map((sa: any) => [sa.student_id, sa])
        : []
    )
    const classMap = new Map(
      classInfo.map((c: any) => [c.id, c])
    )

    // Create student overview with class information (optimized)
    const students = studentProfiles.map((profile: any) => {
      const assignment = assignmentMap.get(profile.user_id)
      const studentClass = assignment ? classMap.get(assignment.class_id) : null

      return {
        id: profile.user_id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        xp: profile.xp || 0,
        level: profile.level || 1,
        gems: profile.gems || 0,
        streak_days: profile.streak_days || 0,
        current_mood: profile.current_mood || 'neutral',
        grade_level: profile.grade_level,
        class_name: studentClass?.class_name || 'Unknown',
        class_subject: studentClass?.subject || 'General',
        class_room: studentClass?.room_number || 'TBD'
      }
    })

    // Prepare response data
    const responseData = {
      analytics: {
        totalStudents,
        averageXP,
        activeToday,
        helpRequests,
        moodDistribution,
        averageStreak
      },
      students,
      teacherInfo: {
        name: teacherProfileResult.status === 'fulfilled' ? 
          `${teacherProfileResult.value.data?.first_name || ''} ${teacherProfileResult.value.data?.last_name || ''}`.trim() : 
          'Teacher',
        schoolId: teacherSchoolId
      },
      classes: classInfo
    }

    // Store in cache
    dashboardCache.set(cacheKey, { data: responseData, timestamp: Date.now() })
    
    // Clean old cache entries (keep last 50)
    if (dashboardCache.size > 50) {
      const entries = Array.from(dashboardCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      dashboardCache.clear()
      entries.slice(0, 50).forEach(([key, value]) => dashboardCache.set(key, value))
    }

    const response = NextResponse.json(responseData)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    
    return response

  } catch (error: any) {
    console.error('Error in combined teacher dashboard API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
