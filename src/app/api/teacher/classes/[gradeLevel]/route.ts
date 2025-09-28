import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest, { params }: { params: Promise<{ gradeLevel: string }> }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to verify they are a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.school_id) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    if (profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Access denied. Teacher role required.' }, { status: 403 })
    }

    const resolvedParams = await params
    const { gradeLevel } = resolvedParams

    // Get the grade level ID first
    const { data: gradeLevelData, error: gradeLevelError } = await supabase
      .from('grade_levels')
      .select('id')
      .eq('school_id', profile.school_id)
      .eq('grade_level', gradeLevel)
      .eq('is_active', true)
      .single()

    if (gradeLevelError || !gradeLevelData) {
      return NextResponse.json({ error: 'Grade level not found' }, { status: 404 })
    }

    // Get all classes for this grade level
    const { data: classes, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        class_name,
        class_code,
        subject,
        room_number,
        max_students,
        current_students,
        is_active
      `)
      .eq('school_id', profile.school_id)
      .eq('grade_level_id', gradeLevelData.id)
      .eq('is_active', true)
      .order('class_name')

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
    }

    // Get teacher's current assignments for this grade level
    const { data: currentAssignments, error: assignmentsError } = await supabase
      .from('teacher_class_assignments')
      .select('class_id, is_primary_teacher, subject')
      .eq('teacher_id', user.id)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)

    if (assignmentsError) {
      console.error('Error fetching current assignments:', assignmentsError)
    }

    // Mark which classes the teacher is already assigned to
    const assignedClassIds = new Set(currentAssignments?.map(a => a.class_id) || [])
    
    const classesWithAssignmentStatus = (classes || []).map(cls => ({
      ...cls,
      is_assigned: assignedClassIds.has(cls.id),
      teacher_assignment: currentAssignments?.find(a => a.class_id === cls.id)
    }))

    return NextResponse.json({ 
      classes: classesWithAssignmentStatus,
      gradeLevel,
      success: true 
    })

  } catch (error) {
    console.error('Error in classes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
