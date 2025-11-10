import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
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

    const body = await request.json()
    const { seatingChartId, layoutTemplateId, layoutName, rows, cols, totalSeats, seatPattern } = body

    if (!seatingChartId || !layoutTemplateId || !layoutName || !rows || !cols || !totalSeats || !seatPattern) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get profile to verify ownership
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Verify ownership
    const { data: chart, error: chartError } = await supabase
      .from('seating_charts')
      .select('id')
      .eq('id', seatingChartId)
      .eq('teacher_id', profile.id)
      .single()

    if (chartError || !chart) {
      return NextResponse.json({ error: 'Seating chart not found' }, { status: 404 })
    }

    // Update the seating chart layout
    console.log('🔄 Updating seating chart layout:', seatingChartId)
    const { error: updateError } = await supabase
      .from('seating_charts')
      .update({
        layout_template_id: layoutTemplateId,
        layout_name: layoutName,
        rows,
        cols,
        total_seats: totalSeats,
        seat_pattern: seatPattern,
        updated_at: new Date().toISOString()
      })
      .eq('id', seatingChartId)

    if (updateError) {
      console.error('❌ Error updating seating chart:', updateError)
      return NextResponse.json({ error: 'Failed to update seating chart' }, { status: 500 })
    }

    console.log('✅ Seating chart layout updated successfully')
    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Error in PUT /api/teacher/seating/update-layout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
