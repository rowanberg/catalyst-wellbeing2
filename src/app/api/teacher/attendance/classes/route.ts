import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
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
}

// GET - Fetch teacher's classes for a specific grade
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const gradeId = searchParams.get('grade_id')

    if (!gradeId) {
      return NextResponse.json({ error: 'Grade ID is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only teachers and admins can access attendance
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get classes directly from teacher_class_assignments
    const { data: teacherClasses, error: classesError } = await supabase
      .from('teacher_class_assignments')
      .select(`
        classes!inner (
          id,
          name,
          grade_levels!inner (
            id,
            name,
            level
          )
        )
      `)
      .eq('teacher_id', profile.id)
      .eq('is_active', true)
      .eq('classes.grade_level_id', gradeId)

    if (classesError) {
      console.error('Error fetching teacher classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch teacher classes' }, { status: 500 })
    }

    // Process data and get attendance statistics
    const classIds = teacherClasses?.map((assignment: any) => assignment.classes.id) || []
    const processedClasses: { class_id: any; class_name: any; grade_name: any; total_students: number; present_today: number; absent_today: number; attendance_rate: number; }[] = []

    for (const assignment of teacherClasses || []) {
      const classData = (assignment as any).classes
      const classId = classData.id

      // Get total students in class
      const { data: studentCount } = await supabase
        .from('student_class_assignments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true)

      // Get today's attendance
      const today = new Date().toISOString().split('T')[0]
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('attendance_status')
        .in('student_id', studentCount?.map((s: any) => s.student_id) || [])
        .eq('attendance_date', today)

      const totalStudents = studentCount?.length || 0
      const presentToday = todayAttendance?.filter((a: any) => a.attendance_status === 'present').length || 0
      const absentToday = todayAttendance?.filter((a: any) => a.attendance_status === 'absent').length || 0
      const attendanceRate = totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0

      processedClasses.push({
        class_id: classData.id,
        class_name: classData.name,
        grade_name: classData.grade_levels.name,
        total_students: totalStudents,
        present_today: presentToday,
        absent_today: absentToday,
        attendance_rate: attendanceRate
      })
    }

    return NextResponse.json({
      classes: processedClasses,
      grade_id: gradeId,
      teacher: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        school_id: profile.school_id
      }
    })

  } catch (error) {
    console.error('Error in teacher attendance classes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
