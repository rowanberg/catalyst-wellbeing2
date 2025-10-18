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

// GET /api/teacher/attendance-details - Get detailed attendance for a specific date
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
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 })
    }

    // Fetch attendance records for the specific date
    // Note: attendance table doesn't have class_id column
    const { data: attendanceRecords, error: fetchError } = await supabase
      .from('attendance')
      .select(`
        id,
        student_id,
        date,
        status,
        notes,
        profiles:student_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('teacher_id', profile.id)
      .eq('date', date)

    if (fetchError) {
      console.error('Error fetching attendance details:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch attendance details' }, { status: 500 })
    }

    // Format the response
    const details = attendanceRecords?.map((record: any) => ({
      id: record.id,
      student_id: record.student_id,
      student_name: `${record.profiles?.first_name || ''} ${record.profiles?.last_name || ''}`.trim() || 'Unknown Student',
      student_email: record.profiles?.email || 'No email',
      attendance_status: record.status,
      attendance_date: record.date,
      notes: record.notes
    })) || []

    return NextResponse.json({
      success: true,
      details,
      count: details.length,
      date
    })

  } catch (error: any) {
    console.error('Error in attendance details API:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 })
  }
}
