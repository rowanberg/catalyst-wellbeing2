import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin-client'

// GET - Fetch attendance records for admin with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const classId = searchParams.get('class_id')
    const gradeFilter = searchParams.get('grade')
    const statusFilter = searchParams.get('status')
    const searchTerm = searchParams.get('search')

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Calculate offset for pagination
    const offset = (page - 1) * limit

    // Build query with filters - fetch attendance records without complex joins
    let query = supabase
      .from('attendance')
      .select(`
        id,
        date,
        status,
        notes,
        student_id,
        teacher_id,
        created_at
      `, { count: 'exact' })
      .eq('school_id', schoolId)
      .eq('date', date)

    // Apply filters
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data: attendanceRecords, error: attendanceError, count } = await query
      .order('student_id', { ascending: true })
      .range(offset, offset + limit - 1)

    if (attendanceError) {
      console.error('Error fetching attendance:', attendanceError)
      return NextResponse.json({ error: 'Failed to fetch attendance records' }, { status: 500 })
    }

    // If no attendance records, still show all classes with 0 attendance
    if (!attendanceRecords || attendanceRecords.length === 0) {
      // Fetch all classes to show even with no attendance
      const { data: allClasses } = await supabase
        .from('classes')
        .select('id, class_name, class_code, grade_level_id')
        .eq('school_id', schoolId)
        .order('grade_level_id', { ascending: true })
        .order('class_name', { ascending: true })

      const classes = allClasses || []
      const allClassIds = classes.map((c: any) => c.id)

      // Fetch grade levels
      const gradeLevelIds = Array.from(new Set(classes.map((c: any) => c.grade_level_id).filter(Boolean)))
      let gradeLevelsData: any[] = []
      if (gradeLevelIds.length > 0) {
        const { data: gradeLevels } = await supabase
          .from('grade_levels')
          .select('id, grade_level, level')
          .in('id', gradeLevelIds)
        gradeLevelsData = gradeLevels || []
      }
      const gradeLevelMap = new Map(gradeLevelsData.map((g: any) => [g.id, g]))

      // Fetch teacher assignments
      const { data: allTeacherAssignments } = await supabase
        .from('teacher_class_assignments')
        .select(`
          class_id,
          teacher_id,
          is_primary_teacher,
          profiles (
            id,
            first_name,
            last_name
          )
        `)
        .in('class_id', allClassIds)
        .eq('school_id', schoolId)

      const classPrimaryTeacherMap = new Map()
      allTeacherAssignments?.forEach((assignment: any) => {
        if (assignment.is_primary_teacher && assignment.profiles) {
          classPrimaryTeacherMap.set(assignment.class_id, {
            id: assignment.profiles.id,
            name: `${assignment.profiles.first_name || ''} ${assignment.profiles.last_name || ''}`.trim()
          })
        }
      })

      // Build class list with 0 attendance
      const classesData = classes.map((classData: any) => {
        const gradeLevel = gradeLevelMap.get(classData.grade_level_id)
        const primaryTeacher = classPrimaryTeacherMap.get(classData.id)
        
        return {
          className: classData.class_name || `Class ${classData.class_code || 'Unknown'}`,
          grade: gradeLevel?.level?.toString() || gradeLevel?.grade_level || 'N/A',
          teacher: primaryTeacher?.name || 'No Primary Teacher',
          totalStudents: 0,
          presentCount: 0,
          absentCount: 0,
          lateCount: 0,
          attendanceRate: 0
        }
      })

      return NextResponse.json({
        data: {
          attendance: [],
          classes: classesData,
          summary: {
            total_students: 0,
            present_count: 0,
            absent_count: 0,
            late_count: 0,
            excused_count: 0,
            attendance_rate: 0
          },
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        }
      })
    }

    // Fetch related data separately
    const studentIds = Array.from(new Set(attendanceRecords.map((r: any) => r.student_id)))
    const teacherIds = Array.from(new Set(attendanceRecords.map((r: any) => r.teacher_id).filter(Boolean)))

    // Fetch students
    const { data: students } = await supabase
      .from('profiles')
      .select('id, user_id, first_name, last_name, student_number')
      .in('id', studentIds)

    console.log('Student profile IDs:', studentIds)
    console.log('Students data:', students?.map(s => ({ id: s.id, user_id: s.user_id })))

    // Try both profile IDs and user IDs for class assignments (handle ID confusion)
    const userIds = students?.map((s: any) => s.user_id).filter(Boolean) || []
    const profileIds = students?.map((s: any) => s.id).filter(Boolean) || []
    const allPossibleIds = Array.from(new Set([...userIds, ...profileIds]))

    console.log('Querying class assignments with IDs:', allPossibleIds.length, 'ids')

    // Get student class assignments - try with all possible IDs
    let studentClassAssignments: any[] = []
    if (allPossibleIds.length > 0) {
      const { data, error: classAssignError } = await supabase
        .from('student_class_assignments')
        .select('student_id, class_id, school_id, is_primary')
        .in('student_id', allPossibleIds)
        .eq('school_id', schoolId)
        .eq('is_active', true)

      if (classAssignError) {
        console.error('Error fetching class assignments:', classAssignError)
      } else {
        studentClassAssignments = data || []
        console.log('Class assignments found:', studentClassAssignments.length)
      }
    }

    // ===== FETCH ALL CLASSES IN SCHOOL (not just those with attendance) =====
    const { data: allClasses, error: classesError } = await supabase
      .from('classes')
      .select('id, class_name, class_code, grade_level_id')
      .eq('school_id', schoolId)
      .order('grade_level_id', { ascending: true })
      .order('class_name', { ascending: true })

    if (classesError) {
      console.error('Error fetching all classes:', classesError)
    }

    const classes = allClasses || []
    const allClassIds = classes.map((c: any) => c.id)

    // Fetch grade levels separately
    const gradeLevelIds = Array.from(new Set(classes.map((c: any) => c.grade_level_id).filter(Boolean)))
    let gradeLevelsData: any[] = []
    
    if (gradeLevelIds.length > 0) {
      const { data: gradeLevels } = await supabase
        .from('grade_levels')
        .select('id, grade_level, level')
        .in('id', gradeLevelIds)
      
      gradeLevelsData = gradeLevels || []
    }

    // Create grade level map
    const gradeLevelMap = new Map(gradeLevelsData.map((g: any) => [g.id, g]))

    // Fetch ALL teacher assignments for these classes
    const { data: allTeacherAssignments } = await supabase
      .from('teacher_class_assignments')
      .select(`
        class_id,
        teacher_id,
        is_primary_teacher,
        profiles (
          id,
          first_name,
          last_name
        )
      `)
      .in('class_id', allClassIds)
      .eq('school_id', schoolId)

    // Create map of class to primary teacher with full info
    const classPrimaryTeacherMap = new Map()
    allTeacherAssignments?.forEach((assignment: any) => {
      if (assignment.is_primary_teacher && assignment.profiles) {
        classPrimaryTeacherMap.set(assignment.class_id, {
          id: assignment.profiles.id,
          name: `${assignment.profiles.first_name || ''} ${assignment.profiles.last_name || ''}`.trim()
        })
      }
    })

    // Get unique class IDs from attendance records
    const classIds = Array.from(new Set(studentClassAssignments?.map((sca: any) => sca.class_id).filter(Boolean) || []))

    // Fetch teachers
    const { data: teachers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('id', teacherIds)

    // Create lookup maps
    const studentMap = new Map(students?.map((s: any) => [s.id, s]) || [])
    const teacherMap = new Map(teachers?.map((t: any) => [t.id, t]) || [])
    const classMap = new Map(classes?.map((c: any) => [c.id, c]) || [])
    
    // Create a comprehensive ID mapping (handle both user_id and profile.id)
    const idToClassMap = new Map()
    studentClassAssignments?.forEach((sca: any) => {
      const existing = idToClassMap.get(sca.student_id)
      if (!existing || sca.is_primary) {
        idToClassMap.set(sca.student_id, sca)
      }
    })
    
    // Map student profile ID to class assignment
    const studentClassMap = new Map()
    students?.forEach((student: any) => {
      // Try both user_id and profile id
      const classAssignment = idToClassMap.get(student.user_id) || idToClassMap.get(student.id)
      if (classAssignment) {
        studentClassMap.set(student.id, classAssignment)
      }
    })

    // Format records for frontend
    let formattedRecords = attendanceRecords.map((record: any) => {
      const student = studentMap.get(record.student_id)
      const teacher = teacherMap.get(record.teacher_id)
      const studentClass = studentClassMap.get(record.student_id)
      const classInfo = studentClass ? classMap.get(studentClass.class_id) : null
      const gradeLevel = classInfo ? gradeLevelMap.get(classInfo.grade_level_id) : null

      return {
        id: record.id,
        studentName: student ? `${student.first_name || ''} ${student.last_name || ''}`.trim() : 'Unknown',
        studentNumber: student?.student_number,
        grade: gradeLevel?.level?.toString() || gradeLevel?.grade_level || 'N/A',
        className: classInfo?.class_name || 'N/A',
        date: record.date,
        status: record.status,
        timeIn: record.created_at ? new Date(record.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : undefined,
        reason: record.notes,
        teacher: teacher ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() : 'N/A',
        parentNotified: false
      }
    })

    // Filter by search term if provided (client-side)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      formattedRecords = formattedRecords.filter((record: any) => 
        record.studentName?.toLowerCase().includes(lowerSearch) ||
        record.className?.toLowerCase().includes(lowerSearch)
      )
    }

    // Filter by grade if provided
    if (gradeFilter && gradeFilter !== 'all') {
      formattedRecords = formattedRecords.filter((record: any) => 
        record.grade === gradeFilter
      )
    }

    // Get summary statistics
    const summaryQuery = supabase
      .from('attendance')
      .select('status', { count: 'exact' })
      .eq('school_id', schoolId)
      .eq('date', date)

    const { data: allRecords, error: summaryError } = await summaryQuery

    let summary = {
      total_students: 0,
      present_count: 0,
      absent_count: 0,
      late_count: 0,
      excused_count: 0,
      attendance_rate: 0
    }

    if (!summaryError && allRecords) {
      summary.total_students = allRecords.length
      summary.present_count = allRecords.filter((r: any) => r.status === 'present').length
      summary.absent_count = allRecords.filter((r: any) => r.status === 'absent').length
      summary.late_count = allRecords.filter((r: any) => r.status === 'late').length
      summary.excused_count = allRecords.filter((r: any) => r.status === 'excused').length
      summary.attendance_rate = summary.total_students > 0 
        ? Math.round(((summary.present_count + summary.late_count) / summary.total_students) * 100) 
        : 0
    }

    // ===== BUILD CLASS ATTENDANCE SUMMARY FOR ALL CLASSES =====
    // Start with ALL classes in the school
    const classAttendanceMap = new Map()
    
    classes.forEach((classData: any) => {
      const gradeLevel = gradeLevelMap.get(classData.grade_level_id)
      const primaryTeacher = classPrimaryTeacherMap.get(classData.id)
      
      classAttendanceMap.set(classData.id, {
        className: classData.class_name || `Class ${classData.class_code || 'Unknown'}`,
        grade: gradeLevel?.level?.toString() || gradeLevel?.grade_level || 'N/A',
        teacher: primaryTeacher?.name || 'No Primary Teacher',
        totalStudents: 0,
        presentCount: 0,
        absentCount: 0,
        lateCount: 0,
        attendanceRate: 0
      })
    })

    // ===== NOW OVERLAY ATTENDANCE DATA ON ALL CLASSES =====
    const { data: classSummaries, error: classError } = await supabase
      .from('attendance')
      .select('student_id, status, teacher_id')
      .eq('school_id', schoolId)
      .eq('date', date)

    if (!classError && classSummaries && classSummaries.length > 0) {
      // Get student class info for summaries
      const summaryStudentIds = Array.from(new Set(classSummaries.map((r: any) => r.student_id)))
      
      const { data: summaryProfiles } = await supabase
        .from('profiles')
        .select('id, user_id')
        .in('id', summaryStudentIds)
      
      // Get all possible IDs (both user_id and profile.id)
      const summaryUserIds = summaryProfiles?.map((p: any) => p.user_id).filter(Boolean) || []
      const summaryProfileIds = summaryProfiles?.map((p: any) => p.id).filter(Boolean) || []
      const allSummaryIds = Array.from(new Set([...summaryUserIds, ...summaryProfileIds]))
      
      const { data: summaryClassAssignments } = await supabase
        .from('student_class_assignments')
        .select('student_id, class_id, is_primary')
        .in('student_id', allSummaryIds)
        .eq('school_id', schoolId)
        .eq('is_active', true)
      
      // Create comprehensive ID mapping
      const idToSummaryClassMap = new Map()
      summaryClassAssignments?.forEach((sca: any) => {
        const existing = idToSummaryClassMap.get(sca.student_id)
        if (!existing || sca.is_primary) {
          idToSummaryClassMap.set(sca.student_id, sca)
        }
      })
      
      // Map profile ID to class assignment
      const summaryStudentClassMap = new Map()
      summaryProfiles?.forEach((profile: any) => {
        const classAssignment = idToSummaryClassMap.get(profile.user_id) || idToSummaryClassMap.get(profile.id)
        if (classAssignment) {
          summaryStudentClassMap.set(profile.id, classAssignment)
        }
      })

      // Update attendance counts for classes that have attendance
      classSummaries.forEach((record: any) => {
        const studentClass = summaryStudentClassMap.get(record.student_id)
        const classId = studentClass?.class_id
        
        if (!classId || !classAttendanceMap.has(classId)) {
          return
        }
        
        const classData = classAttendanceMap.get(classId)
        classData.totalStudents++
        if (record.status === 'present') classData.presentCount++
        if (record.status === 'absent') classData.absentCount++
        if (record.status === 'late') classData.lateCount++
      })

      // Calculate attendance rates
      classAttendanceMap.forEach((classData) => {
        classData.attendanceRate = classData.totalStudents > 0
          ? Math.round(((classData.presentCount + classData.lateCount) / classData.totalStudents) * 100)
          : 0
      })
    }

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      data: {
        attendance: formattedRecords,
        classes: Array.from(classAttendanceMap.values()),
        summary,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages
        }
      }
    })

  } catch (error: any) {
    console.error('=== ERROR IN ADMIN ATTENDANCE GET ===')
    console.error('Error object:', error)
    console.error('Error message:', error?.message)
    console.error('Error code:', error?.code)
    console.error('Error stack:', error?.stack)
    
    try {
      return NextResponse.json({ 
        error: 'Internal server error',
        details: error?.message || 'Unknown error',
        code: error?.code || 'UNKNOWN'
      }, { status: 500 })
    } catch (jsonError) {
      console.error('Error serializing error response:', jsonError)
      return new NextResponse('Internal server error', { status: 500 })
    }
  }
}
