import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface AssignedClass {
  id: string
  class_name: string
  class_code: string
  subject: string
  room_number: string
  current_students: number
  max_students: number
  grade_level: string | number
  grade_name: string
  is_primary_teacher: boolean
  assigned_at: string
}

interface ApiResponse {
  classes: AssignedClass[]
  success: boolean
  message?: string
}

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('Authentication failed:', userError)
      return NextResponse.json(
        { classes: [], success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('API called for teacher:', user.id)

    // Get teacher's school_id from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', user.id)
      .single()

    const schoolId = profile?.school_id

    // Always use manual query for better reliability
    console.log('Using manual query for teacher:', user.id)
    return await handleManualQuery(supabase, user.id, schoolId)

  } catch (error) {
    console.error('Error in assigned-classes-v2 API:', error)
    return NextResponse.json(
      { classes: [], success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleManualQuery(supabase: any, teacherId: string, schoolId?: string): Promise<NextResponse<ApiResponse>> {
  try {
    console.log('Manual query for teacher:', teacherId)
    
    // Get raw assignments
    const { data: rawAssignments, error: rawError } = await supabase
      .from('teacher_class_assignments')
      .select('id, class_id, is_primary_teacher, assigned_at')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)
      .order('assigned_at', { ascending: false })

    console.log('Raw assignments found:', rawAssignments?.length || 0)
    console.log('Raw assignments error:', rawError)

    if (rawError || !rawAssignments || rawAssignments.length === 0) {
      return NextResponse.json({
        classes: [],
        success: true,
        message: 'No class assignments found'
      })
    }

    // Get class details for each assignment
    const classIds = rawAssignments.map((a: any) => a.class_id)
    console.log('Looking for classes with IDs:', classIds)
    
    const { data: classesData, error: classesError } = await supabase
      .from('classes')
      .select(`
        id,
        class_name,
        class_code,
        subject,
        room_number,
        current_students,
        max_students,
        grade_level_id
      `)
      .in('id', classIds)

    console.log('Classes found:', classesData?.length || 0)
    console.log('Classes error:', classesError)

    if (classesError) {
      return NextResponse.json(
        { classes: [], success: false, message: 'Failed to fetch class details' },
        { status: 500 }
      )
    }

    // Get grade levels for the classes
    const gradeLevelIds = classesData
      ?.filter((c: any) => c.grade_level_id)
      .map((c: any) => c.grade_level_id) || []

    let gradeLevelsData: any[] = []
    if (gradeLevelIds.length > 0) {
      const { data: grades } = await supabase
        .from('grade_levels')
        .select('id, grade_level')
        .in('id', gradeLevelIds)
      
      gradeLevelsData = grades || []
    }

    // Combine all data
    const transformedClasses: AssignedClass[] = rawAssignments
      .map((assignment: any) => {
        const classData = classesData?.find((c: any) => c.id === assignment.class_id)
        if (!classData) return null

        const gradeData = gradeLevelsData.find(g => g.id === classData.grade_level_id)
        const gradeLevel = gradeData?.grade_level || 'Unknown'

        return {
          id: classData.id,
          class_name: classData.class_name || 'Unnamed Class',
          class_code: classData.class_code || 'N/A',
          subject: classData.subject || 'General',
          room_number: classData.room_number || 'TBD',
          current_students: classData.current_students || 0,
          max_students: classData.max_students || 30,
          grade_level: gradeLevel,
          grade_name: `Grade ${gradeLevel}`,
          is_primary_teacher: assignment.is_primary_teacher || false,
          assigned_at: assignment.assigned_at
        }
      })
      .filter(Boolean) as AssignedClass[]

    return NextResponse.json({
      classes: transformedClasses,
      success: true
    })

  } catch (error) {
    console.error('Error in manual query:', error)
    return NextResponse.json(
      { classes: [], success: false, message: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
}
