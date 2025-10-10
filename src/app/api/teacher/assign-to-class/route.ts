import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { teacherId, createSampleClass } = await request.json()

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Teacher ID is required' },
        { status: 400 }
      )
    }

    console.log('🔍 Assigning teacher to class:', teacherId)

    // Get teacher's school
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('profiles')
      .select('school_id, first_name, last_name')
      .eq('id', teacherId)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher not found' },
        { status: 404 }
      )
    }

    console.log('✅ Teacher found:', teacher)

    // Check for existing classes in the school
    const { data: existingClasses, error: classesError } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        class_name,
        subject,
        room_number,
        grade_levels (
          grade_level
        )
      `)
      .eq('school_id', teacher.school_id)
      .limit(5)

    console.log('📋 Existing classes:', existingClasses)

    let classToAssign: { id: any; class_name: any; subject: any; room_number: any; grade_levels: { grade_level: any; }[]; } | null = null

    if (existingClasses && existingClasses.length > 0) {
      // Use existing class
      classToAssign = existingClasses[0]
      console.log('✅ Using existing class:', classToAssign)
    } else if (createSampleClass) {
      // Create a sample class
      console.log('🏗️ Creating sample class...')

      // First get a grade level
      const { data: gradeLevels } = await supabaseAdmin
        .from('grade_levels')
        .select('id, grade_level')
        .eq('school_id', teacher.school_id)
        .limit(1)

      const gradeLevel = gradeLevels?.[0]

      if (gradeLevel) {
        const { data: newClass, error: createClassError } = await supabaseAdmin
          .from('classes')
          .insert({
            class_name: 'Sample Class 5A',
            subject: 'General Studies',
            room_number: 'Room 101',
            school_id: teacher.school_id,
            grade_level_id: gradeLevel.id,
            current_students: 0,
            max_students: 30
          })
          .select(`
            id,
            class_name,
            subject,
            room_number,
            grade_levels (
              grade_level
            )
          `)
          .single()

        if (createClassError) {
          console.error('❌ Error creating class:', createClassError)
          return NextResponse.json(
            { error: 'Failed to create sample class' },
            { status: 500 }
          )
        }

        classToAssign = newClass
        console.log('✅ Created new class:', classToAssign)
      }
    }

    if (!classToAssign) {
      return NextResponse.json(
        { 
          error: 'No classes available. Please create classes first or set createSampleClass=true',
          teacherInfo: teacher
        },
        { status: 404 }
      )
    }

    // Check if teacher is already assigned to this class
    const { data: existingAssignment } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('class_id', classToAssign.id)
      .eq('is_active', true)
      .single()

    if (existingAssignment) {
      return NextResponse.json({
        success: true,
        message: 'Teacher already assigned to this class',
        assignment: existingAssignment,
        classInfo: classToAssign
      })
    }

    // Assign teacher to class
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .insert({
        teacher_id: teacherId,
        class_id: classToAssign.id,
        is_primary_teacher: true,
        subject: classToAssign.subject,
        is_active: true,
        assigned_at: new Date().toISOString()
      })
      .select('*')
      .single()

    if (assignmentError) {
      console.error('❌ Error creating assignment:', assignmentError)
      return NextResponse.json(
        { error: 'Failed to assign teacher to class' },
        { status: 500 }
      )
    }

    console.log('✅ Teacher assigned successfully:', assignment)

    return NextResponse.json({
      success: true,
      message: 'Teacher assigned to class successfully',
      assignment,
      classInfo: classToAssign,
      teacherInfo: teacher
    })

  } catch (error) {
    console.error('❌ Error in assign-to-class API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
