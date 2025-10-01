import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      studentIds = [...new Set(studentAssignmentsResult.value.data.map((sa: any) => sa.student_id))]
    }

    // Fetch student profiles if we have student IDs
    let studentProfiles: any[] = []
    if (studentIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select(`
          id, user_id, first_name, last_name, xp, level, gems, 
          streak_days, current_mood, updated_at, grade_level
        `)
        .in('user_id', studentIds)
      
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

    // Create student overview with class information
    const students = studentProfiles.map((profile: any) => {
      const assignment = studentAssignmentsResult.status === 'fulfilled' && studentAssignmentsResult.value.data
        ? studentAssignmentsResult.value.data.find((sa: any) => sa.student_id === profile.user_id)
        : null
      
      const studentClass = assignment 
        ? classInfo.find((c: any) => c.id === assignment.class_id)
        : null

      return {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        xp: profile.xp || 0,
        level: profile.level || 1,
        gems: profile.gems || 0,
        streak_days: profile.streak_days || 0,
        current_mood: profile.current_mood || 'neutral',
        grade_level: profile.grade_level,
        class_name: studentClass?.class_name || 'Unknown Class',
        class_subject: studentClass?.subject || 'General',
        class_room: studentClass?.room_number || 'TBD',
        updated_at: profile.updated_at
      }
    })

    // Set cache headers for better performance
    const response = NextResponse.json({
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
    })

    // Cache for 30 seconds with stale-while-revalidate
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    
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
