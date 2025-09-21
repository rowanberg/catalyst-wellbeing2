import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get classes with grade level information
    const { data: classes, error } = await supabaseAdmin
      .from('classes')
      .select(`
        id,
        class_name,
        class_code,
        subject,
        room_number,
        max_students,
        current_students,
        is_active,
        grade_levels (
          id,
          grade_level,
          grade_name
        )
      `)
      .eq('school_id', schoolId)
      .order('grade_levels(grade_level)', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      classes: classes || []
    })
  } catch (error) {
    console.error('Classes API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { schoolId, gradeLevelId, className, roomNumber, maxStudents } = await request.json()

    if (!schoolId || !gradeLevelId || !className) {
      return NextResponse.json(
        { message: 'School ID, grade level ID, and class name are required' },
        { status: 400 }
      )
    }

    const { data: newClass, error } = await supabaseAdmin
      .from('classes')
      .insert({
        school_id: schoolId,
        grade_level_id: gradeLevelId,
        class_name: className,
        room_number: roomNumber || null,
        max_students: maxStudents || 25,
        is_active: true
      })
      .select(`
        id,
        class_name,
        class_code,
        subject,
        room_number,
        max_students,
        current_students,
        is_active,
        grade_levels (
          id,
          grade_level,
          grade_name
        )
      `)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      class: newClass
    })
  } catch (error) {
    console.error('Create class API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { schoolId, classId } = await request.json()

    if (!schoolId || !classId) {
      return NextResponse.json(
        { message: 'School ID and class ID are required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('classes')
      .delete()
      .eq('id', classId)
      .eq('school_id', schoolId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Class deleted successfully'
    })
  } catch (error) {
    console.error('Delete class API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
