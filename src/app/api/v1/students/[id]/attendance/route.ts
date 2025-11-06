import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCachedAttendance, setCachedAttendance } from '@/lib/redis/parent-cache'

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

// GET /api/v1/students/[id]/attendance - Get student's attendance for parent view
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()
    const { id: studentId } = await params
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get parent profile
    const { data: parentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, user_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 403 })
    }

    if (parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 })
    }

    // Get student profile to get their user_id
    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('id', studentId)
      .single()

    if (studentError || !studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Verify parent-child relationship using user_ids
    // parent_child_relationships table stores user_ids, not profile ids
    const { data: relationship, error: relationshipError } = await supabase
      .from('parent_child_relationships')
      .select('id')
      .eq('parent_id', user.id)  // parent user_id
      .eq('child_id', studentProfile.user_id)  // student user_id
      .single()

    if (relationshipError || !relationship) {
      return NextResponse.json({ 
        error: 'Access denied - not your child'
      }, { status: 403 })
    }

    // Get query parameters for date range (default to current month)
    const { searchParams } = new URL(request.url)
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString(), 10)
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString(), 10)
    
    // Check local cache first (15min TTL)
    const cachedData = getCachedAttendance(studentId, year, month)
    if (cachedData) {
      return NextResponse.json(cachedData)
    }
    
    // Calculate date range for the month
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0) // Last day of month
    
    // Format dates as YYYY-MM-DD for PostgreSQL
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    // Fetch attendance records for the month
    console.log('Querying attendance with:', { studentId, startDateStr, endDateStr })
    
    const { data: attendanceRecords, error: fetchError } = await supabase
      .from('attendance')
      .select('id, date, status, notes')
      .eq('student_id', studentId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })

    console.log('Attendance query result:', { 
      recordCount: attendanceRecords?.length || 0,
      records: attendanceRecords,
      error: fetchError 
    })

    if (fetchError) {
      console.error('Error fetching attendance:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch attendance', details: fetchError.message }, { status: 500 })
    }

    // Calculate statistics
    const stats = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: attendanceRecords?.length || 0
    }

    // Format attendance data for calendar view
    const attendanceByDate = attendanceRecords?.map(record => {
      // Update stats
      switch(record.status) {
        case 'present':
          stats.present++
          break
        case 'absent':
          stats.absent++
          break
        case 'late':
          stats.late++
          break
        case 'excused':
          stats.excused++
          break
      }

      return {
        day: new Date(record.date).getDate(),
        status: record.status,
        notes: record.notes
      }
    }) || []

    // Calculate attendance percentage
    const attendancePercentage = stats.total > 0 
      ? Math.round(((stats.present + stats.late) / stats.total) * 100)
      : 0

    const responseData = {
      success: true,
      data: {
        month: month,
        year: year,
        monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long' }),
        attendance: attendanceByDate,
        stats: {
          ...stats,
          percentage: attendancePercentage
        },
        studentId: studentId
      }
    }

    // Cache the result (15min TTL, local-only)
    setCachedAttendance(studentId, year, month, responseData)

    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('Error in student attendance API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
