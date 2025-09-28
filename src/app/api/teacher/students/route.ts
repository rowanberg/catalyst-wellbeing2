import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const classId = searchParams.get('class_id')

    console.log('🔍 Students API called with:', { schoolId, classId })

    if (!schoolId || !classId) {
      return NextResponse.json(
        { message: 'School ID and Class ID are required' },
        { status: 400 }
      )
    }

    // Get students through student_class_assignments table with class information
    const { data: classAssignments, error: assignmentError } = await supabaseAdmin
      .from('student_class_assignments')
      .select(`
        student_id,
        class_id,
        profiles!inner(*),
        classes!inner(
          id,
          class_name,
          subject,
          room_number
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true)
    
    if (assignmentError) {
      console.error('❌ Class assignments query failed:', assignmentError.message)
      return NextResponse.json({
        students: [],
        total: 0,
        error: 'Failed to fetch class assignments'
      })
    }

    if (!classAssignments || classAssignments.length === 0) {
      console.log('⚠️ No students assigned to this class')
      return NextResponse.json({
        students: [],
        total: 0
      })
    }

    console.log('✅ Found', classAssignments.length, 'class assignments')
    console.log('📋 Raw assignments:', classAssignments)
    
    // Debug: Check what fields are available in profiles
    if (classAssignments.length > 0) {
      const sampleProfile = Array.isArray(classAssignments[0].profiles) ? classAssignments[0].profiles[0] : classAssignments[0].profiles
      console.log('🔍 Sample profile fields:', Object.keys(sampleProfile || {}))
      console.log('🔍 Sample profile data:', sampleProfile)
    }

    // Get student IDs to fetch emails separately
    const studentIds = classAssignments.map(assignment => assignment.student_id).filter(Boolean)
    
    // Fetch emails from users table using student IDs
    console.log('🔍 Attempting to fetch emails for student IDs:', studentIds)
    
    let usersData = null
    let usersError = null
    
    // Try to fetch from custom users table first
    const customUsersResult = await supabaseAdmin
      .from('users')
      .select('id, email')
      .in('id', studentIds)
    
    if (customUsersResult.error) {
      console.error('⚠️ Failed to fetch from custom users table:', customUsersResult.error.message)
      
      // Try to fetch from auth.users table as fallback
      try {
        const authUsersResult = await supabaseAdmin.auth.admin.listUsers()
        if (authUsersResult.data?.users) {
          // Filter users by student IDs and map to our format
          usersData = authUsersResult.data.users
            .filter((user: any) => studentIds.includes(user.id))
            .map((user: any) => ({ id: user.id, email: user.email }))
          console.log('📧 Fetched emails from auth.users:', usersData)
        }
      } catch (authError) {
        console.error('⚠️ Failed to fetch from auth.users:', authError)
        usersError = authError
      }
    } else {
      usersData = customUsersResult.data
      usersError = customUsersResult.error
    }
    
    console.log('📧 Final user emails fetched:', usersData)
    console.log('📧 Users query result count:', usersData?.length || 0)

    // Create a map of user ID to email for quick lookup
    const emailMap = new Map()
    if (usersData) {
      usersData.forEach(user => {
        emailMap.set(user.id, user.email)
      })
    }
    
    console.log('🔗 Email mapping:', Array.from(emailMap.entries()))

    const students = classAssignments.map(assignment => {
      const profile = Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles
      const classInfo = Array.isArray(assignment.classes) ? assignment.classes[0] : assignment.classes
      const email = emailMap.get(assignment.student_id) || profile?.email
      
      return {
        id: profile?.id || assignment.student_id,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        email: email || profile?.email || 'No email', // Try multiple sources for email
        student_number: profile?.student_number,
        role: profile?.role,
        school_id: profile?.school_id,
        // Gamification data - try multiple field names
        xp: profile?.xp || profile?.xp_points || profile?.points || profile?.experience_points || 0,
        level: profile?.level || profile?.user_level || profile?.current_level || 1,
        streak_days: profile?.streak_days || profile?.streak || profile?.daily_streak || 0,
        // Wellbeing data
        current_mood: profile?.current_mood || profile?.mood || 'neutral',
        wellbeing_status: profile?.wellbeing_status || profile?.status || 'managing',
        // Class information from the join
        class_id: assignment.class_id,
        class_name: classInfo?.class_name || `Class ${assignment.class_id?.substring(0, 8) || 'Unknown'}`,
        class_subject: classInfo?.subject,
        class_room: classInfo?.room_number,
        // Additional fields that might be useful
        grade_level: profile?.grade_level,
        created_at: profile?.created_at,
        updated_at: profile?.updated_at,
        // Debug: include raw profile for inspection
        _debug_profile: profile
      }
    }).filter(student => student.id) // Only include students with valid IDs

    console.log('📊 Final processed students:', students.length, students)
    console.log('📧 Student emails check:', students.map(s => ({ name: `${s.first_name} ${s.last_name}`, email: s.email })))

    return NextResponse.json({
      students: students,
      total: students.length
    })

  } catch (error: any) {
    console.error('❌ Error fetching students:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
