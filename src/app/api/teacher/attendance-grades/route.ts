import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'


// GET - Fetch teacher's assigned grades for attendance (gets school_id from authenticated user)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to get school_id
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

    // Get grades directly from teacher_class_assignments (primary approach)
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

    if (classesError) {
      console.error('Error fetching teacher classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch teacher assignments' }, { status: 500 })
    }

    // Process data to get unique grades with counts
    const gradesMap = new Map()
    const classIds: string[] = []

    teacherClasses?.forEach((assignment: any) => {
      const gradeLevel = assignment.classes.grade_levels
      const classId = assignment.classes.id
      classIds.push(classId)
      
      if (!gradesMap.has(gradeLevel.id)) {
        gradesMap.set(gradeLevel.id, {
          grade_level_id: gradeLevel.id,
          grade_name: gradeLevel.name,
          grade_level: gradeLevel.level,
          total_classes: 0,
          total_students: 0
        })
      }
      gradesMap.get(gradeLevel.id).total_classes += 1
    })

    // Get student counts for each grade
    if (classIds.length > 0) {
      const { data: studentCounts } = await supabase
        .from('student_class_assignments')
        .select(`
          class_id,
          classes!inner (
            grade_level_id
          )
        `)
        .in('class_id', classIds)
        .eq('is_active', true)

      // Count students per grade
      const studentCountMap = new Map()
      studentCounts?.forEach((assignment: any) => {
        const gradeId = assignment.classes.grade_level_id
        studentCountMap.set(gradeId, (studentCountMap.get(gradeId) || 0) + 1)
      })

      // Update student counts in grades
      gradesMap.forEach((grade: any, gradeId) => {
        grade.total_students = studentCountMap.get(gradeId) || 0
      })
    }

    const processedGrades = Array.from(gradesMap.values()).sort((a: any, b: any) => a.grade_level - b.grade_level)

    return NextResponse.json({
      grades: processedGrades,
      teacher: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        school_id: profile.school_id
      }
    })

  } catch (error) {
    console.error('Error in teacher attendance grades GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
