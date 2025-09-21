import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    // Return available grade levels and subjects for teacher assignment
    const gradeSubjects = [
      { id: '1-general', grade_level: '1', subject: 'General', description: 'Primary class for Grade 1 students', name: 'Grade 1 - General' },
      { id: '2-general', grade_level: '2', subject: 'General', description: 'Primary class for Grade 2 students', name: 'Grade 2 - General' },
      { id: '3-general', grade_level: '3', subject: 'General', description: 'Primary class for Grade 3 students', name: 'Grade 3 - General' },
      { id: '4-general', grade_level: '4', subject: 'General', description: 'Elementary class for Grade 4 students', name: 'Grade 4 - General' },
      { id: '5-general', grade_level: '5', subject: 'General', description: 'Elementary class for Grade 5 students', name: 'Grade 5 - General' },
      { id: '6-math', grade_level: '6', subject: 'Mathematics', description: 'Advanced Mathematics for Grade 6', name: 'Grade 6 - Mathematics' },
      { id: '6-science', grade_level: '6', subject: 'Science', description: 'Science class for Grade 6 students', name: 'Grade 6 - Science' },
      { id: '6-english', grade_level: '6', subject: 'English', description: 'English Language Arts for Grade 6', name: 'Grade 6 - English' },
      { id: '7-math', grade_level: '7', subject: 'Mathematics', description: 'Advanced Mathematics for Grade 7', name: 'Grade 7 - Mathematics' },
      { id: '7-science', grade_level: '7', subject: 'Science', description: 'Science class for Grade 7 students', name: 'Grade 7 - Science' },
      { id: '7-english', grade_level: '7', subject: 'English', description: 'English Language Arts for Grade 7', name: 'Grade 7 - English' },
      { id: '8-math', grade_level: '8', subject: 'Mathematics', description: 'Advanced Mathematics for Grade 8', name: 'Grade 8 - Mathematics' },
      { id: '8-science', grade_level: '8', subject: 'Science', description: 'Science class for Grade 8 students', name: 'Grade 8 - Science' },
      { id: '8-english', grade_level: '8', subject: 'English', description: 'English Language Arts for Grade 8', name: 'Grade 8 - English' }
    ]

    // Group by grade level for better organization
    const groupedClasses = gradeSubjects.reduce((acc: Record<string, any[]>, item) => {
      const grade = item.grade_level
      if (!acc[grade]) {
        acc[grade] = []
      }
      acc[grade].push(item)
      return acc
    }, {})

    return NextResponse.json({ 
      classes: gradeSubjects,
      groupedClasses,
      total: gradeSubjects.length
    })

  } catch (error) {
    console.error('Error in classes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint to assign teacher to grade levels
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const body = await request.json()
    const { teacherId, gradeAssignments, primaryGradeId } = body

    console.log('Grade assignment request:', { teacherId, gradeAssignments, primaryGradeId })

    if (!teacherId || !gradeAssignments || !Array.isArray(gradeAssignments) || gradeAssignments.length === 0) {
      console.error('Missing required fields:', { teacherId: !!teacherId, gradeAssignments: !!gradeAssignments, isArray: Array.isArray(gradeAssignments) })
      return NextResponse.json({ error: 'Teacher ID and grade assignments are required' }, { status: 400 })
    }

    // Verify the teacher exists using service role (no auth required during registration)
    const { data: teacher, error: teacherError } = await supabase
      .from('profiles')
      .select('id, school_id, role')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single()

    console.log('Teacher lookup result:', { teacher, teacherError })

    if (teacherError || !teacher) {
      return NextResponse.json({ error: `Teacher not found: ${teacherError?.message}` }, { status: 404 })
    }

    // Check if teacher_grade_assignments table exists, if not, create a simple response
    const { data: tableCheck, error: tableError } = await supabase
      .from('teacher_grade_assignments')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist, return success without database operation
      console.log('teacher_grade_assignments table does not exist, skipping database operations')
      return NextResponse.json({ 
        message: 'Grade levels assigned successfully (table not found, skipped database operations)',
        assignments: gradeAssignments,
        count: gradeAssignments.length,
        warning: 'teacher_grade_assignments table not found'
      })
    }

    // Remove existing assignments for this teacher
    const { error: deleteError } = await supabase
      .from('teacher_grade_assignments')
      .delete()
      .eq('teacher_id', teacherId)

    if (deleteError) {
      console.error('Error removing existing assignments:', deleteError)
      return NextResponse.json({ error: `Failed to update grade assignments: ${deleteError.message}` }, { status: 500 })
    }

    // Create new assignments
    const assignments = gradeAssignments.map((assignment: any) => ({
      teacher_id: teacherId,
      school_id: teacher.school_id,
      grade_level: assignment.grade_level,
      subject: assignment.subject,
      is_primary_teacher: assignment.id === primaryGradeId
    }))

    console.log('Creating assignments:', assignments)

    const { data: newAssignments, error: assignError } = await supabase
      .from('teacher_grade_assignments')
      .insert(assignments)
      .select()

    if (assignError) {
      console.error('Error creating grade assignments:', assignError)
      return NextResponse.json({ error: `Failed to assign grades: ${assignError.message}` }, { status: 500 })
    }

    console.log('Successfully created assignments:', newAssignments)

    return NextResponse.json({ 
      message: 'Grade levels assigned successfully',
      assignments: newAssignments,
      count: newAssignments?.length || 0
    })

  } catch (error) {
    console.error('Error in grade assignment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
