import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    const supabase = await createSupabaseServerClient()
    
    // Step 1: Authenticate user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      console.log('Authentication failed:', userError)
      return NextResponse.json(
        { classes: [], success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Step 2: Get teacher profile and verify role
    const { data, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !data) {
      return NextResponse.json(
        { classes: [], success: false, message: 'Profile not found' },
        { status: 404 }
      )
    }

    const teacherProfile = data as { id: string; role: string; school_id: string }

    if (teacherProfile.role !== 'teacher') {
      return NextResponse.json(
        { classes: [], success: false, message: 'Forbidden - Teacher access only' },
        { status: 403 }
      )
    }

    // Use authenticated user's ID for teacher_class_assignments (uses user_id)
    const teacherId = user.id  // ← Use user.id, not profile.id
    const schoolId = teacherProfile.school_id

    console.log('API called for teacher:', teacherId)

    // Always use manual query for better reliability
    console.log('Using manual query for teacher:', teacherId)
    return await handleManualQuery(supabase, teacherId, schoolId)

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

    // Get class details for each assignment - use admin client to bypass RLS
    const classIds = rawAssignments.map((a: any) => a.class_id)
    console.log('Looking for classes with IDs:', classIds)
    
    const { data: classesData, error: classesError } = await supabaseAdmin
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
      const { data: grades } = await supabaseAdmin
        .from('grade_levels')
        .select('id, grade_level')
        .in('id', gradeLevelIds)
      
      gradeLevelsData = grades || []
    }

    // Combine all data
    const transformedClasses: AssignedClass[] = rawAssignments
      .map((assignment: any) => {
        const classData = classesData?.find((c: any) => c.id === assignment.class_id)
        
        // If class data not found, create fallback data
        if (!classData) {
          console.warn(`Class ${assignment.class_id} not found in classes table, using fallback data`)
          return {
            id: assignment.class_id,
            class_name: `Class ${assignment.class_id.substring(0, 8)}`,
            class_code: 'N/A',
            subject: 'General',
            room_number: 'TBD',
            current_students: 0,
            max_students: 30,
            grade_level: 'Unknown',
            grade_name: 'Grade Unknown',
            is_primary_teacher: assignment.is_primary_teacher || false,
            assigned_at: assignment.assigned_at
          }
        }

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
      }) as AssignedClass[]

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
