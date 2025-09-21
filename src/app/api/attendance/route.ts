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

// GET - Fetch attendance records for a specific date
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

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

    // Get all students in the school
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, grade_level')
      .eq('school_id', profile.school_id)
      .eq('role', 'student')
      .order('grade_level', { ascending: true })
      .order('first_name', { ascending: true })

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Get existing attendance records for the date (handle table not existing)
    let attendanceRecords: any[] = []
    try {
      const { data, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, attendance_status, notes, created_at')
        .eq('school_id', profile.school_id)
        .eq('attendance_date', date)

      if (attendanceError) {
        if (attendanceError.message.includes('does not exist')) {
          console.log('Attendance table does not exist yet, returning empty records')
          attendanceRecords = []
        } else {
          console.error('Error fetching attendance:', attendanceError)
          return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
        }
      } else {
        attendanceRecords = data || []
      }
    } catch (error) {
      console.log('Attendance table not found, continuing with empty records')
      attendanceRecords = []
    }

    // Create attendance map for quick lookup
    const attendanceMap = new Map()
    attendanceRecords?.forEach(record => {
      attendanceMap.set(record.student_id, record)
    })

    // Combine student data with attendance status
    const studentsWithAttendance = students?.map(student => ({
      id: student.id,
      first_name: student.first_name,
      last_name: student.last_name,
      grade_level: student.grade_level,
      attendance: attendanceMap.get(student.id) || null
    })) || []

    // Get attendance summary for the date (handle table not existing)
    let summary = null
    try {
      const { data, error: summaryError } = await supabase
        .from('attendance_summary')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('date', date)
        .single()

      if (summaryError) {
        if (summaryError.message.includes('does not exist')) {
          console.log('Attendance summary table does not exist yet')
          summary = null
        } else if (summaryError.code === 'PGRST116') {
          // No rows found - this is normal for new dates
          summary = null
        } else {
          console.error('Error fetching attendance summary:', summaryError)
        }
      } else {
        summary = data
      }
    } catch (error) {
      console.log('Attendance summary table not found')
      summary = null
    }

    return NextResponse.json({
      students: studentsWithAttendance,
      summary: summary || null,
      date: date
    })

  } catch (error) {
    console.error('Error in attendance GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Mark attendance for students
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    const { attendanceData, date } = body

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ error: 'Invalid attendance data' }, { status: 400 })
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

    const attendanceDate = date || new Date().toISOString().split('T')[0]

    // Prepare attendance records for upsert
    const attendanceRecords = attendanceData.map((record: { student_id: string; status: string; notes?: string }) => ({
      student_id: record.student_id,
      teacher_id: profile.id,
      school_id: profile.school_id,
      date: attendanceDate,
      status: record.status,
      notes: record.notes || null,
      updated_at: new Date().toISOString()
    }))

    // Upsert attendance records (handle table not existing)
    try {
      const { error: upsertError } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, {
          onConflict: 'student_id,date'
        })

      if (upsertError) {
        if (upsertError.message.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'Attendance tables not created yet. Please run the database migration first.' 
          }, { status: 500 })
        } else {
          console.error('Error upserting attendance:', upsertError)
          return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error)
      return NextResponse.json({ 
        error: 'Attendance system not initialized. Please contact administrator.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Attendance marked for ${attendanceRecords.length} students`,
      date: attendanceDate
    })

  } catch (error) {
    console.error('Error in attendance POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update specific attendance record
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const body = await request.json()
    const { student_id, status, notes, date } = body

    if (!student_id || !status) {
      return NextResponse.json({ error: 'Student ID and status are required' }, { status: 400 })
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

    // Only teachers and admins can update attendance
    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const attendanceDate = date || new Date().toISOString().split('T')[0]

    // Update attendance record (handle table not existing)
    try {
      const { error: updateError } = await supabase
        .from('attendance')
        .upsert({
          student_id,
          teacher_id: profile.id,
          school_id: profile.school_id,
          date: attendanceDate,
          status,
          notes: notes || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'student_id,date'
        })

      if (updateError) {
        if (updateError.message.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'Attendance tables not created yet. Please run the database migration first.' 
          }, { status: 500 })
        } else {
          console.error('Error updating attendance:', updateError)
          return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
        }
      }
    } catch (error) {
      console.error('Error updating attendance:', error)
      return NextResponse.json({ 
        error: 'Attendance system not initialized. Please contact administrator.' 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Attendance updated successfully'
    })

  } catch (error) {
    console.error('Error in attendance PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
