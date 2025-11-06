import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { invalidateGrades } from '@/lib/redis'

export async function POST(request: NextRequest) {
  try {
    const { schoolId } = await request.json()

    if (!schoolId) {
      return NextResponse.json(
        { message: 'School ID is required' },
        { status: 400 }
      )
    }

    // Get grade levels with student and class counts
    const { data: gradeLevels, error } = await supabaseAdmin
      .from('grade_levels')
      .select(`
        id,
        grade_level,
        grade_name,
        is_active,
        created_at,
        updated_at
      `)
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('grade_level', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // Get counts for each grade level
    const gradeLevelsWithCounts = await Promise.all(
      (gradeLevels || []).map(async (grade: any) => {
        // Get student count from profiles table
        const { count: studentCount } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('grade_level', grade.grade_level)
          .eq('role', 'student')

        // Get class count using grade_level_id
        const { count: classCount } = await supabaseAdmin
          .from('classes')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .eq('grade_level_id', grade.id)
          .eq('is_active', true)

        return {
          ...grade,
          student_count: studentCount || 0,
          class_count: classCount || 0
        }
      })
    )

    return NextResponse.json({
      gradeLevels: gradeLevelsWithCounts || []
    })
  } catch (error) {
    console.error('Grade levels API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { schoolId, gradeLevel } = await request.json()

    if (!schoolId || !gradeLevel) {
      return NextResponse.json(
        { message: 'School ID and grade level data are required' },
        { status: 400 }
      )
    }

    const { data: newGradeLevel, error } = await supabaseAdmin
      .from('grade_levels')
      .insert({
        school_id: schoolId,
        grade_level: gradeLevel.grade_level,
        grade_name: gradeLevel.grade_name || `Grade ${gradeLevel.grade_level}`,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // CRITICAL: Invalidate grades cache for this school
    // Teachers/students will see new grade level on next request
    await invalidateGrades(schoolId)
    console.log(`🗑️ [Grade Management] Invalidated grades cache after creating grade: ${gradeLevel.grade_level}`)

    return NextResponse.json({
      gradeLevel: newGradeLevel
    })
  } catch (error) {
    console.error('Create grade level API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { schoolId, gradeId } = await request.json()

    if (!schoolId || !gradeId) {
      return NextResponse.json(
        { message: 'School ID and grade ID are required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('grade_levels')
      .delete()
      .eq('id', gradeId)
      .eq('school_id', schoolId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { message: `Database error: ${error.message}` },
        { status: 500 }
      )
    }

    // CRITICAL: Invalidate grades cache for this school
    // Teachers/students won't see deleted grade on next request
    await invalidateGrades(schoolId)
    console.log(`🗑️ [Grade Management] Invalidated grades cache after deleting grade: ${gradeId}`)

    return NextResponse.json({
      message: 'Grade level deleted successfully'
    })
  } catch (error) {
    console.error('Delete grade level API error:', error)
    return NextResponse.json(
      { message: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}
