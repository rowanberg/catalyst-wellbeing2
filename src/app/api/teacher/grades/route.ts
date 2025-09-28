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
    const teacherId = searchParams.get('teacher_id')

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get teacher's assigned grade levels
    let grades = []
    
    try {
      // If teacherId is provided, get only assigned grades
      if (teacherId) {
        // Get teacher's assigned classes first
        const { data: teacherClasses, error: classError } = await supabaseAdmin
          .from('teacher_class_assignments')
          .select(`
            classes!inner(
              id,
              grade_level_id,
              grade_levels!inner(
                id,
                grade_level,
                description,
                school_id
              )
            )
          `)
          .eq('teacher_id', teacherId)
        
        if (!classError && teacherClasses) {
          // Extract unique grade levels from teacher's classes
          const gradeMap = new Map()
          teacherClasses.forEach((assignment: any) => {
            const gradeLevel = assignment.classes.grade_levels
            if (gradeLevel && gradeLevel.school_id === schoolId) {
              gradeMap.set(gradeLevel.id, gradeLevel)
            }
          })
          grades = Array.from(gradeMap.values())
        }
      }
      
      // If no teacherId or no assignments found, try database functions
      if (grades.length === 0) {
        const { data: dbGrades, error: rpcError } = await supabaseAdmin
          .rpc('get_school_grade_levels', { p_school_id: schoolId })
        
        if (!rpcError && dbGrades) {
          grades = dbGrades
        } else {
          console.warn('Database function failed, trying direct table query:', rpcError?.message)
          
          // Fallback: try direct table query
          const { data: directGrades, error: directError } = await supabaseAdmin
            .from('grade_levels')
            .select('*')
            .eq('school_id', schoolId)
          
          if (!directError && directGrades) {
            grades = directGrades
          }
        }
      }
      
      // No sample data - only show real grades
      if (grades.length === 0) {
        console.log('No grades found for this school - admin needs to create grade levels')
        grades = []
      }
      
    } catch (dbError) {
      console.warn('Database error:', dbError)
      grades = []
    }

    return NextResponse.json({ grades: grades || [], school_id: schoolId })
    
  } catch (error) {
    console.error('Error fetching grades:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
