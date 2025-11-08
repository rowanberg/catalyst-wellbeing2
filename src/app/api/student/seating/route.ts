import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Only students can view seating' }, { status: 403 })
    }

    console.log('👤 Student profile ID:', profile.id)

    // Get seat assignment from ACTIVE seating chart only
    const { data: seatAssignment, error: assignmentError } = await supabase
      .from('seat_assignments')
      .select(`
        *,
        seating_charts!inner (
          id,
          is_active,
          class_id
        )
      `)
      .eq('student_id', profile.id)
      .eq('seating_charts.is_active', true)
      .maybeSingle()

    if (assignmentError || !seatAssignment) {
      console.log('⚠️ No seat assignment found')
      return NextResponse.json({ 
        hasSeating: false,
        isAssigned: false,
        message: 'No seat assignment found for this student'
      })
    }

    console.log('✅ Found seat assignment:', seatAssignment.seat_id)

    // Get full seating chart details
    const { data: seatingChart, error: chartError } = await supabase
      .from('seating_charts')
      .select('*')
      .eq('id', seatAssignment.seating_chart_id)
      .single()

    if (chartError || !seatingChart) {
      console.log('⚠️ Seating chart not found')
      return NextResponse.json({ 
        hasSeating: false,
        isAssigned: false,
        message: 'Seating chart not found'
      })
    }

    console.log('✅ Seating chart:', seatingChart.layout_name)

    // Get class details
    const { data: classInfo, error: classError } = await supabase
      .from('classes')
      .select('id, class_name, grade_level, section')
      .eq('id', seatingChart.class_id)
      .single()

    if (classError || !classInfo) {
      console.log('⚠️ Class not found')
      return NextResponse.json({ 
        hasSeating: false,
        isAssigned: false,
        message: 'Class information not found'
      })
    }

    console.log('✅ Student seat found:', seatAssignment.seat_id)
    console.log('✅ Class:', classInfo.class_name)
    console.log('✅ Layout:', seatingChart.layout_name)

    // Get all seat assignments for the class (for visualization)
    const { data: allAssignments } = await supabase
      .from('seat_assignments')
      .select(`
        seat_id,
        row_index,
        col_index,
        student_id,
        profiles:student_id (
          first_name,
          last_name
        )
      `)
      .eq('seating_chart_id', seatingChart.id)

    return NextResponse.json({
      hasSeating: true,
      isAssigned: true,
      studentSeat: {
        seat_id: seatAssignment.seat_id,
        row_index: seatAssignment.row_index,
        col_index: seatAssignment.col_index
      },
      seatingChart: {
        id: seatingChart.id,
        layout_name: seatingChart.layout_name,
        rows: seatingChart.rows,
        cols: seatingChart.cols,
        total_seats: seatingChart.total_seats,
        seat_pattern: seatingChart.seat_pattern
      },
      allAssignments: allAssignments || [],
      classInfo: {
        id: classInfo.id,
        name: classInfo.class_name,
        grade_level: classInfo.grade_level,
        section: classInfo.section
      }
    })

  } catch (error: any) {
    console.error('Error in GET /api/student/seating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
