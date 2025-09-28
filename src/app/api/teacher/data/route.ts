import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teacherId = searchParams.get('teacher_id')
    const schoolId = searchParams.get('school_id')
    const includeStudents = searchParams.get('include_students') === 'true'
    const classId = searchParams.get('class_id')

    if (!teacherId || !schoolId) {
      return NextResponse.json(
        { message: 'Teacher ID and School ID are required' },
        { status: 400 }
      )
    }

    console.log('🔍 Teacher Data API called with:', { teacherId, schoolId, includeStudents, classId })

    // Initialize response data structure
    const responseData: any = {
      teacher: null,
      school: null,
      assignedClasses: [],
      grades: [],
      classes: [],
      students: [],
      analytics: null
    }

    try {
      // Parallel API calls for better performance
      const [
        analyticsResponse,
        assignedClassesResponse,
        gradesResponse
      ] = await Promise.all([
        // Get teacher analytics and school info
        fetch(`${request.nextUrl.origin}/api/teacher/dashboard-analytics?teacher_id=${teacherId}`),
        // Get assigned classes
        fetch(`${request.nextUrl.origin}/api/teacher/class-assignments?teacher_id=${teacherId}`),
        // Get grades
        fetch(`${request.nextUrl.origin}/api/teacher/grades?school_id=${schoolId}`)
      ])

      // Process analytics data
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json()
        responseData.analytics = analyticsData
        if (analyticsData.school_id) {
          responseData.school = { id: analyticsData.school_id }
        }
      }

      // Process assigned classes
      if (assignedClassesResponse.ok) {
        const assignedData = await assignedClassesResponse.json()
        if (assignedData.success && assignedData.assignments) {
          responseData.assignedClasses = assignedData.assignments
            .filter((assignment: any) => assignment.classes?.id)
            .map((assignment: any) => {
              const classData = assignment.classes
              const gradeLevel = classData.grade_levels?.grade_level || 'Unknown'
              
              return {
                id: classData.id,
                class_name: classData.class_name || 'Unnamed Class',
                class_code: classData.class_code || 'N/A',
                subject: classData.subject || assignment.subject || 'General',
                room_number: classData.room_number || 'TBD',
                current_students: classData.current_students || 0,
                total_students: classData.current_students || 0,
                max_students: classData.max_students || 30,
                grade_level: gradeLevel,
                grade_name: `Grade ${gradeLevel}`,
                is_primary_teacher: assignment.is_primary_teacher || false,
                assigned_at: assignment.assigned_at
              }
            })
        }
      }

      // Process grades
      if (gradesResponse.ok) {
        const gradesData = await gradesResponse.json()
        responseData.grades = gradesData.grades || []
      }

      // If specific class data is requested, get classes and students
      if (classId) {
        // Find the grade level for the selected class
        const selectedClass = responseData.assignedClasses.find((cls: any) => cls.id === classId)
        if (selectedClass) {
          const gradeLevel = selectedClass.grade_level
          
          // Get classes for this grade level
          const classesResponse = await fetch(
            `${request.nextUrl.origin}/api/teacher/classes?school_id=${schoolId}&grade_level_id=${gradeLevel}&teacher_id=${teacherId}`
          )
          
          if (classesResponse.ok) {
            const classesData = await classesResponse.json()
            responseData.classes = classesData.classes || []
          }

          // Get students if requested
          if (includeStudents) {
            const studentsResponse = await fetch(
              `${request.nextUrl.origin}/api/teacher/students?school_id=${schoolId}&class_id=${classId}`
            )
            
            if (studentsResponse.ok) {
              const studentsData = await studentsResponse.json()
              responseData.students = studentsData.students || []
            }
          }
        }
      }

      console.log('✅ Teacher Data API response prepared:', {
        assignedClasses: responseData.assignedClasses.length,
        grades: responseData.grades.length,
        classes: responseData.classes.length,
        students: responseData.students.length
      })

      return NextResponse.json({
        success: true,
        data: responseData,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Error in teacher data API:', error)
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to fetch teacher data',
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Error in teacher data API:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
