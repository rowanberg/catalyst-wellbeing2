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

    if (!schoolId || !classId) {
      return NextResponse.json(
        { message: 'School ID and Class ID are required' },
        { status: 400 }
      )
    }

    // Try to get students from the database
    let students = []
    
    try {
      // First try with the database function
      const { data: dbStudents, error: rpcError } = await supabaseAdmin
        .rpc('get_class_students', { 
          p_school_id: schoolId,
          p_class_id: classId 
        })
      
      if (!rpcError && dbStudents) {
        students = dbStudents
      } else {
        console.warn('Database function failed, trying direct table query:', rpcError?.message)
        
        // Fallback: try direct table query with proper class filtering
        // First try to get students through student_class_assignments
        const { data: classAssignments, error: assignmentError } = await supabaseAdmin
          .from('student_class_assignments')
          .select(`
            student_id,
            profiles!inner(*)
          `)
          .eq('class_id', classId)
          .eq('is_active', true)
        
        if (!assignmentError && classAssignments) {
          students = classAssignments.map(assignment => assignment.profiles)
        } else {
          console.warn('Class assignments query failed, trying profiles with class_id:', assignmentError?.message)
          
          // Final fallback: try profiles table with class_id column (if it exists)
          const { data: directStudents, error: directError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('school_id', schoolId)
            .eq('role', 'student')
            .eq('class_id', classId) // This will only work if profiles table has class_id column
          
          if (!directError && directStudents) {
            students = directStudents
          } else {
            console.warn('Direct table query failed:', directError?.message)
            students = []
          }
        }
        
        // No sample data - only show real students
        if (!students || students.length === 0) {
          console.log('No students found for this class - admin needs to assign students')
          students = []
        }
      }
    } catch (dbError) {
      console.warn('Database error:', dbError)
      students = []
    }

    return NextResponse.json({
      students: students || [],
      total: students?.length || 0
    })

  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
