/**
 * Debug endpoint to check teacher assignments
 * Temporary endpoint to diagnose assigned classes issue
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get('teacher_id')
  const schoolId = searchParams.get('school_id')

  if (!teacherId || !schoolId) {
    return NextResponse.json({ 
      error: 'Missing teacher_id or school_id',
      teacherId,
      schoolId
    })
  }

  const supabase = getSupabaseAdmin()

  try {
    // Check teacher_class_assignments table
    const { data: assignments, error: assignmentsError } = await supabase
      .from('teacher_class_assignments')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('school_id', schoolId)

    // Check classes table for referenced class_ids
    let classesInfo = null
    if (assignments && assignments.length > 0) {
      const classIds = assignments.map(a => a.class_id)
      const { data: classes, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .in('id', classIds)

      classesInfo = {
        classes,
        classesError: classesError?.message,
        classIds
      }
    }

    // Check if teacher profile exists
    const { data: teacherProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', teacherId)
      .single()

    return NextResponse.json({
      teacherId,
      schoolId,
      assignments: {
        data: assignments,
        count: assignments?.length || 0,
        error: assignmentsError?.message
      },
      classes: classesInfo,
      teacherProfile: {
        found: !!teacherProfile,
        data: teacherProfile,
        error: profileError?.message
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Database error',
      message: error.message,
      teacherId,
      schoolId
    }, { status: 500 })
  }
}
