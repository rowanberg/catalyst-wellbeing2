import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const classId = searchParams.get('class_id')

    console.log('🔍 Students API called with:', { schoolId, classId })
    console.log('📍 Request URL:', request.url)

    if (!schoolId || !classId) {
      console.log('❌ Missing required parameters')
      return NextResponse.json(
        { error: 'school_id and class_id are required' },
        { status: 400 }
      )
    }

    // Create authenticated Supabase client for auth verification
    const supabase = await createSupabaseServerClient()

    // Get current user and verify they're a teacher
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('❌ Auth error:', userError?.message || 'No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a teacher in the correct school
    const { data: teacherProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (!teacherProfile || teacherProfile.role !== 'teacher' || teacherProfile.school_id !== schoolId) {
      console.log('❌ Access denied - Teacher role:', teacherProfile?.role, 'School:', teacherProfile?.school_id)
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    console.log('✅ Teacher verified:', user.email, 'School:', schoolId)

    // Try to fetch class assignments, but fallback to all students if table doesn't exist
    let studentProfiles: any[] = []
    let classAssignments: any[] = []
    
    // Use admin client to bypass RLS and get class assignments
    const { data: classAssignmentsData, error: assignmentError } = await supabaseAdmin
      .from('student_class_assignments')
      .select('student_id, class_id')
      .eq('class_id', classId)
      .eq('is_active', true)
    
    if (assignmentError) {
      console.log('⚠️ student_class_assignments query failed, falling back to all students in school')
      console.log('Error details:', assignmentError.message)
      
      // Fallback: Get all students from the same school using admin client
      const { data: allStudentProfiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('school_id', schoolId)
        .eq('role', 'student')
      
      if (profilesError) {
        console.error('❌ Failed to fetch student profiles:', profilesError.message)
        return NextResponse.json({
          students: [],
          total: 0,
          error: 'Failed to fetch students'
        })
      }
      
      studentProfiles = allStudentProfiles || []
      console.log('✅ Fallback: Found', studentProfiles.length, 'students in school')
      
    } else {
      // Successfully got class assignments
      classAssignments = classAssignmentsData || []
      
      if (classAssignments.length === 0) {
        console.log('⚠️ No students assigned to this class')
        return NextResponse.json({
          students: [],
          total: 0
        })
      }

      console.log('✅ Found', classAssignments.length, 'class assignments')
      
      // Get student IDs and fetch their profiles separately
      const studentIds = classAssignments.map(assignment => assignment.student_id).filter(Boolean)
      console.log('👥 Student IDs to fetch:', studentIds)
      
      // Fetch student profiles separately using admin client to bypass RLS
      const { data: studentProfilesData, error: profilesError } = await supabaseAdmin
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
      
      studentProfiles = studentProfilesData || []
    }
    
    console.log('📊 Profiles query result:', { 
      profilesCount: studentProfiles?.length || 0,
      usingFallback: !classAssignments.length
    })

    // Fetch class information separately using admin client
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

    // Map students based on whether we have class assignments or using fallback
    let students: any[] = []
    
    if (classAssignments.length > 0) {
      // Use class assignments mapping
      students = classAssignments.map(assignment => {
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
          current_gems: profile?.current_gems || 0,
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
      }).filter(student => student.id)
    } else {
      // Fallback: Use all student profiles directly
      students = studentProfiles.map(profile => ({
        id: profile?.id || profile?.user_id,
        first_name: profile?.first_name || 'Unknown',
        last_name: profile?.last_name || 'Student', 
        email: profile?.email || 'No email',
        student_number: profile?.student_number,
        role: profile?.role || 'student',
        school_id: profile?.school_id,
        // Gamification data
        xp: profile?.xp || 0,
        level: profile?.level || 1,
        current_gems: profile?.current_gems || 0,
        streak_days: profile?.streak_days || 0,
        // Wellbeing data
        current_mood: profile?.current_mood || 'neutral',
        wellbeing_status: profile?.wellbeing_status || 'managing',
        // Class information (fallback values)
        class_id: classId,
        class_name: classInfo?.class_name || 'General Class',
        class_subject: classInfo?.subject || 'General',
        class_room: classInfo?.room_number || 'TBD',
        // Additional fields
        grade_level: profile?.grade_level,
        created_at: profile?.created_at,
        updated_at: profile?.updated_at
      })).filter(student => student.id)
    }

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
