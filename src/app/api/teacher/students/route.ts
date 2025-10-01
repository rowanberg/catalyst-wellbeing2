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
    console.log('📍 Request URL:', request.url)
    console.log('📍 Caller:', request.headers.get('referer'))

    if (!schoolId || !classId) {
      console.log('❌ Missing required parameters - returning empty result')
      return NextResponse.json(
        { 
          students: [],
          total: 0,
          message: 'School ID and Class ID are required' 
        },
        { status: 200 } // Changed to 200 to prevent error spam
      )
    }

    // Get student assignments first (avoiding complex joins)
    const { data: classAssignments, error: assignmentError } = await supabaseAdmin
      .from('student_class_assignments')
      .select('student_id, class_id')
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
    
    // Get student IDs and fetch their profiles separately
    const studentIds = classAssignments.map(assignment => assignment.student_id).filter(Boolean)
    
    // Fetch student profiles separately to avoid join issues
    const { data: studentProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .in('user_id', studentIds)
    
    if (profilesError) {
      console.error('❌ Failed to fetch student profiles:', profilesError.message)
      return NextResponse.json({
        students: [],
        total: 0,
        error: 'Failed to fetch student profiles'
      })
    }

    // Fetch class information separately
    const { data: classInfo, error: classError } = await supabaseAdmin
      .from('classes')
      .select('id, class_name, subject, room_number')
      .eq('id', classId)
      .single()
    
    if (classError) {
      console.error('❌ Failed to fetch class info:', classError.message)
    }

    console.log('✅ Found', studentProfiles?.length || 0, 'student profiles')
    console.log('✅ Class info:', classInfo)

    // Map assignments to students using the separate profile data
    const students = classAssignments.map(assignment => {
      const profile = studentProfiles?.find(p => p.user_id === assignment.student_id)
      
      return {
        id: profile?.id || assignment.student_id,
        first_name: profile?.first_name || 'Unknown',
        last_name: profile?.last_name || 'Student',
        email: profile?.email || 'No email',
        student_number: profile?.student_number,
        role: profile?.role || 'student',
        school_id: profile?.school_id,
        // Gamification data
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        streak_days: profile?.streak_days || 0,
        // Wellbeing data
        current_mood: profile?.current_mood || 'neutral',
        wellbeing_status: profile?.wellbeing_status || 'managing',
        // Class information
        class_id: assignment.class_id,
        class_name: classInfo?.class_name || `Class ${assignment.class_id?.substring(0, 8) || 'Unknown'}`,
        class_subject: classInfo?.subject || 'General',
        class_room: classInfo?.room_number || 'TBD',
        // Additional fields
        grade_level: profile?.grade_level,
        created_at: profile?.created_at,
        updated_at: profile?.updated_at
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
