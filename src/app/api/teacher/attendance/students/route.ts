import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Create Supabase client with cookie-based auth
async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}

// GET - Fetch students in a specific class for attendance
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only teachers and admins can access attendance
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify teacher has access to this class
    const { data: teacherAccess, error: accessError } = await supabase
      .from('teacher_class_assignments')
      .select('id')
      .eq('teacher_id', profile.id)
      .eq('class_id', classId)
      .eq('is_active', true)
      .single()

    if (accessError || !teacherAccess) {
      return NextResponse.json({ error: 'Access denied to this class' }, { status: 403 })
    }

    // Get students directly from student_class_assignments
    const { data: classStudents, error: studentsError } = await supabase
      .from('student_class_assignments')
      .select(`
        student_id,
        profiles!inner (
          id,
          first_name,
          last_name,
          student_number
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true)

    if (studentsError) {
      console.error('Error fetching class students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch class students' }, { status: 500 })
    }

    // Get class information
    const { data: classInfo, error: classInfoError } = await supabase
      .from('classes')
      .select(`
        id,
        name,
        grade_levels (
          id,
          name,
          level
        )
      `)
      .eq('id', classId)
      .single()

    if (classInfoError) {
      console.error('Error fetching class info:', classInfoError)
    }

    // Get attendance records for the date
    const studentIds = classStudents?.map((s: any) => s.student_id) || []
    const { data: attendanceRecords } = await supabase
      .from('attendance')
      .select('student_id, attendance_status, notes, created_at')
      .in('student_id', studentIds)
      .eq('attendance_date', date)

    // Create attendance map
    const attendanceMap = new Map()
    attendanceRecords?.forEach((record: any) => {
      attendanceMap.set(record.student_id, record)
    })

    // Process student data with attendance
    const processedStudents = classStudents?.map((assignment: any) => {
      const attendance = attendanceMap.get(assignment.student_id)
      return {
        id: assignment.profiles.id,
        first_name: assignment.profiles.first_name,
        last_name: assignment.profiles.last_name,
        student_number: assignment.profiles.student_number,
        attendance: attendance ? {
          status: attendance.attendance_status,
          notes: attendance.notes,
          marked_at: attendance.created_at
        } : null
      }
    }) || []

    // Calculate attendance summary
    const totalStudents = processedStudents.length
    const presentCount = processedStudents.filter(s => s.attendance?.status === 'present').length
    const absentCount = processedStudents.filter(s => s.attendance?.status === 'absent').length
    const lateCount = processedStudents.filter(s => s.attendance?.status === 'late').length
    const excusedCount = processedStudents.filter(s => s.attendance?.status === 'excused').length
    const attendanceRate = totalStudents > 0 ? Math.round(((presentCount + lateCount) / totalStudents) * 100) : 0

    return NextResponse.json({
      students: processedStudents,
      class_info: classInfo ? {
        id: classInfo.id,
        name: classInfo.name,
        grade: classInfo.grade_levels
      } : null,
      summary: {
        total_students: totalStudents,
        present_count: presentCount,
        absent_count: absentCount,
        late_count: lateCount,
        excused_count: excusedCount,
        attendance_rate: attendanceRate
      },
      date: date,
      teacher: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        school_id: profile.school_id
      }
    })

  } catch (error) {
    console.error('Error in teacher attendance students GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark attendance for multiple students
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    const { class_id, attendance_data, date } = body

    if (!class_id || !attendance_data || !Array.isArray(attendance_data)) {
      return NextResponse.json({ error: 'Class ID and attendance data are required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Only teachers and admins can mark attendance
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify teacher has access to this class
    const { data: teacherAccess, error: accessError } = await supabase
      .from('teacher_class_assignments')
      .select('id')
      .eq('teacher_id', profile.id)
      .eq('class_id', class_id)
      .eq('is_active', true)
      .single()

    if (accessError || !teacherAccess) {
      return NextResponse.json({ error: 'Access denied to this class' }, { status: 403 })
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0]

    // Prepare attendance records for upsert
    const attendanceRecords = attendance_data.map((record: { student_id: string; status: string; notes?: string }) => ({
      student_id: record.student_id,
      teacher_id: profile.id,
      school_id: profile.school_id,
      attendance_date: attendanceDate,
      attendance_status: record.status,
      notes: record.notes || null,
      updated_at: new Date().toISOString()
    }))

    // Upsert attendance records
    const { error: upsertError } = await supabase
      .from('attendance')
      .upsert(attendanceRecords, {
        onConflict: 'student_id,attendance_date'
      })

    if (upsertError) {
      console.error('Error upserting attendance:', upsertError)
      return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Attendance marked for ${attendanceRecords.length} students`,
      date: attendanceDate,
      class_id: class_id
    })

  } catch (error) {
    console.error('Error in teacher attendance students POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
