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
    const studentId = searchParams.get('student_id')

    if (!teacherId && !studentId) {
      return NextResponse.json(
        { message: 'Either teacher_id or student_id is required' },
        { status: 400 }
      )
    }

    const result: any = {
      timestamp: new Date().toISOString(),
      debug_info: {}
    }

    if (teacherId) {
      // Debug teacher's class assignments
      const { data: teacherClasses, error: teacherError } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select(`
          class_id,
          is_primary_teacher,
          assigned_at,
          classes:class_id (
            id,
            class_name,
            subject
          )
        `)
        .eq('teacher_id', teacherId)

      result.debug_info.teacher_classes = {
        data: teacherClasses,
        error: teacherError,
        count: teacherClasses?.length || 0
      }

      if (teacherClasses && teacherClasses.length > 0) {
        const classIds = teacherClasses.map(tc => tc.class_id)
        
        // Get students in teacher's classes
        const { data: studentsInClasses, error: studentsError } = await supabaseAdmin
          .from('student_class_assignments')
          .select(`
            student_id,
            class_id,
            profiles:student_id (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .in('class_id', classIds)

        result.debug_info.students_in_teacher_classes = {
          data: studentsInClasses,
          error: studentsError,
          count: studentsInClasses?.length || 0
        }
      }
    }

    if (studentId) {
      // Debug student's class assignments
      const { data: studentClasses, error: studentError } = await supabaseAdmin
        .from('student_class_assignments')
        .select(`
          class_id,
          classes:class_id (
            id,
            class_name,
            subject
          )
        `)
        .eq('student_id', studentId)

      result.debug_info.student_classes = {
        data: studentClasses,
        error: studentError,
        count: studentClasses?.length || 0
      }

      if (studentClasses && studentClasses.length > 0) {
        const classIds = studentClasses.map(sc => sc.class_id)
        
        // Get teachers for student's classes
        const { data: teachersForClasses, error: teachersError } = await supabaseAdmin
          .from('teacher_class_assignments')
          .select(`
            teacher_id,
            class_id,
            is_primary_teacher,
            profiles:teacher_id (
              id,
              first_name,
              last_name,
              email,
              role
            )
          `)
          .in('class_id', classIds)

        result.debug_info.teachers_for_student_classes = {
          data: teachersForClasses,
          error: teachersError,
          count: teachersForClasses?.length || 0
        }
      }
    }

    // Get overall statistics
    const { count: totalTeacherAssignments } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('*', { count: 'exact', head: true })

    const { count: totalStudentAssignments } = await supabaseAdmin
      .from('student_class_assignments')
      .select('*', { count: 'exact', head: true })

    result.debug_info.overall_stats = {
      total_teacher_assignments: totalTeacherAssignments || 0,
      total_student_assignments: totalStudentAssignments || 0
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
