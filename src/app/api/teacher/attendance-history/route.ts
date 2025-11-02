import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

// GET /api/teacher/attendance-history - Get attendance history for teacher
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '7', 10) // Default to 7 days
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query to get attendance records with pagination
    // Note: attendance table doesn't have class_id column
    const { data: attendanceRecords, error: fetchError } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('teacher_id', profile.id)
      .order('date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (fetchError) {
      console.error('Error fetching attendance history:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch attendance history' }, { status: 500 })
    }

    // Group by date and calculate statistics
    const historyMap = new Map<string, {
      date: string
      class_id: string | null
      class_name: string
      total_students: number
      present_count: number
      absent_count: number
      late_count: number
      excused_count: number
    }>()

    attendanceRecords?.forEach((record: any) => {
      const dateKey = record.date
      
      if (!historyMap.has(dateKey)) {
        historyMap.set(dateKey, {
          date: record.date,
          class_id: null,
          class_name: 'All Students',
          total_students: 0,
          present_count: 0,
          absent_count: 0,
          late_count: 0,
          excused_count: 0
        })
      }

      const stats = historyMap.get(dateKey)!
      stats.total_students++

      switch (record.status) {
        case 'present':
          stats.present_count++
          break
        case 'absent':
          stats.absent_count++
          break
        case 'late':
          stats.late_count++
          break
        case 'excused':
          stats.excused_count++
          break
      }
    })

    // Convert map to array
    const history = Array.from(historyMap.values()).map((item, index) => ({
      id: `${item.date}-${item.class_id || index}`,
      class_id: item.class_id,
      class_name: item.class_name,
      attendance_date: item.date,
      total_students: item.total_students,
      present_count: item.present_count,
      absent_count: item.absent_count,
      late_count: item.late_count,
      excused_count: item.excused_count
    }))

    return NextResponse.json({
      success: true,
      history,
      count: history.length,
      hasMore: history.length === limit,
      nextOffset: offset + limit
    })

  } catch (error: any) {
    console.error('Error in attendance history API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
