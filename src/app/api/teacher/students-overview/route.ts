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

    console.log('Fetching students overview for teacher:', teacherId)

    // Get teacher's assigned classes from teacher_class_assignments table
    const { data: teacherClasses, error: classError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', teacherId)

    if (classError) {
      console.error('Error fetching teacher classes:', classError)
      return NextResponse.json({ students: [] })
    }

    if (!teacherClasses || teacherClasses.length === 0) {
      console.log('No classes assigned to teacher')
      return NextResponse.json({ students: [] })
    }

    const classIds = teacherClasses.map(tc => tc.class_id)
    console.log('Teacher assigned to classes:', classIds)

    // Get students from teacher's assigned classes (avoiding complex joins)
    const { data: studentAssignments, error: studentsError } = await supabaseAdmin
      .from('student_class_assignments')
      .select('student_id, class_id')
      .in('class_id', classIds)

    if (studentsError) {
      return NextResponse.json({ students: [] })
    }

    console.log('Found student assignments:', studentAssignments?.length || 0)

    // Fetch student profiles and class info separately
    let students: any[] = []
    if (studentAssignments && studentAssignments.length > 0) {
      const studentIds = studentAssignments.map(assignment => assignment.student_id)
      const uniqueClassIds = Array.from(new Set(studentAssignments.map(assignment => assignment.class_id)))
      
      // Parallel fetch of profiles and classes
      const [profilesResult, classesResult] = await Promise.allSettled([
        supabaseAdmin
          .from('profiles')
          .select('id, user_id, first_name, last_name, xp, level, gems, streak_days, current_mood, updated_at')
          .in('user_id', studentIds),
        supabaseAdmin
          .from('classes')
          .select(`
            id, class_name, grade_level_id,
            grade_levels (grade_level)
          `)
          .in('id', Array.from(uniqueClassIds))
      ])
      
      const profiles = profilesResult.status === 'fulfilled' ? profilesResult.value.data || [] : []
      const classes = classesResult.status === 'fulfilled' ? classesResult.value.data || [] : []
      
      students = studentAssignments.map((assignment: any) => {
        const profile = profiles.find((p: any) => p.user_id === assignment.student_id)
        const classInfo = classes.find((c: any) => c.id === assignment.class_id)
        
        return {
          id: profile?.id,
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          xp: profile?.xp || 0,
          level: profile?.level || 1,
          gems: profile?.gems || 0,
          streak_days: profile?.streak_days || 0,
          current_mood: profile?.current_mood || 'neutral',
          class_name: classInfo?.class_name,
          grade_level: Array.isArray(classInfo?.grade_levels) ? classInfo?.grade_levels[0]?.grade_level : classInfo?.grade_levels?.grade_level,
          updated_at: profile?.updated_at
        }
      }).filter((student: any) => student.id)
    }

    const response = NextResponse.json({ students })
    
    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
    
    return response

  } catch (error: any) {
    console.error('Error fetching teacher students overview:', error)
    return NextResponse.json({ students: [] })
  }
}
