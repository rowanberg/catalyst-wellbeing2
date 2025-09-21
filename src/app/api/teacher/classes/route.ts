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
    const gradeLevelId = searchParams.get('grade_level_id')
    const teacherId = searchParams.get('teacher_id')

    if (!schoolId || !gradeLevelId) {
      return NextResponse.json(
        { message: 'School ID and Grade Level ID are required' },
        { status: 400 }
      )
    }

    // Get teacher's assigned classes for this grade level
    let classes = []
    
    try {
      // If teacherId is provided, get only assigned classes
      if (teacherId) {
        const { data: teacherClasses, error: classError } = await supabaseAdmin
          .from('teacher_class_assignments')
          .select(`
            classes!inner(
              id,
              class_name,
              subject,
              room_number,
              current_students,
              grade_level_id,
              school_id
            )
          `)
          .eq('teacher_id', teacherId)
          .eq('classes.school_id', schoolId)
          .eq('classes.grade_level_id', gradeLevelId)
        
        if (!classError && teacherClasses) {
          classes = teacherClasses.map((assignment: any) => {
            const cls = assignment.classes
            return {
              id: cls.id,
              class_name: cls.class_name && cls.class_name.length > 0 && !cls.class_name.includes('-') 
                ? cls.class_name 
                : `Class ${cls.id?.substring(0, 8) || 'Unknown'}`,
              subject: cls.subject && cls.subject.length > 0 ? cls.subject : 'General Education',
              room_number: cls.room_number && cls.room_number.length > 0
                ? cls.room_number 
                : null,
              current_students: cls.current_students || 0,
              grade_level_id: cls.grade_level_id,
              school_id: cls.school_id
            }
          })
        }
      }
      
      // If no teacherId or no assignments found, try database functions
      if (classes.length === 0) {
        const { data: dbClasses, error: rpcError } = await supabaseAdmin
          .rpc('get_grade_classes', { 
            p_school_id: schoolId,
            p_grade_level_id: gradeLevelId 
          })
        
        if (!rpcError && dbClasses) {
          // Clean up database function results as well
          classes = dbClasses.map((cls: any) => ({
            id: cls.id,
            class_name: cls.class_name && cls.class_name.length > 0 && !cls.class_name.includes('-') 
              ? cls.class_name 
              : `Class ${cls.id?.substring(0, 8) || 'Unknown'}`,
            subject: cls.subject && cls.subject.length > 0 ? cls.subject : 'General Education',
            room_number: cls.room_number && cls.room_number.length > 0
              ? cls.room_number 
              : null,
            current_students: cls.current_students || 0,
            grade_level_id: cls.grade_level_id,
            school_id: cls.school_id
          }))
        } else {
          console.warn('Database function failed, trying direct table query:', rpcError?.message)
          
          // Fallback: try direct table query
          const { data: directClasses, error: directError } = await supabaseAdmin
            .from('classes')
            .select('*')
            .eq('school_id', schoolId)
            .eq('grade_level_id', gradeLevelId)
          
          if (!directError && directClasses) {
            // Clean up malformed data and provide proper fallbacks
            classes = directClasses.map((cls: any) => ({
              id: cls.id,
              class_name: cls.class_name && cls.class_name.length > 0 && !cls.class_name.includes('-') 
                ? cls.class_name 
                : `Class ${cls.id?.substring(0, 8) || 'Unknown'}`,
              subject: cls.subject && cls.subject.length > 0 ? cls.subject : 'General Education',
              room_number: cls.room_number && cls.room_number.length > 0
                ? cls.room_number 
                : null,
              current_students: cls.current_students || 0,
              grade_level_id: cls.grade_level_id,
              school_id: cls.school_id
            }))
          }
        }
      }
      
      // No fallback sample data - only show admin-created classes
      if (classes.length === 0) {
        console.log('No classes found for this grade level - admin needs to create classes')
        classes = []
      }
      
    } catch (dbError) {
      console.warn('Database error:', dbError)
      classes = []
    }

    // If teacher_id is provided, check which classes the teacher is assigned to
    if (teacherId && classes) {
      const { data: assignments, error: assignmentError } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', teacherId)

      if (!assignmentError && assignments) {
        const assignedClassIds = new Set(assignments.map(a => a.class_id))
        
        // Add is_assigned flag to each class
        const classesWithAssignment = classes.map((cls: any) => ({
          ...cls,
          is_assigned: assignedClassIds.has(cls.id)
        }))
        
        return NextResponse.json({ classes: classesWithAssignment })
      }
    }

    // Add default is_assigned: false if no teacher_id or assignment check failed
    const classesWithAssignment = classes?.map((cls: any) => ({
      ...cls,
      is_assigned: false
    })) || []

    return NextResponse.json({ classes: classesWithAssignment })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
