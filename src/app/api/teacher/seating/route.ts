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

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    if (!classId) {
      return NextResponse.json({ error: 'class_id is required' }, { status: 400 })
    }

    // Get profile first to use profile.id
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ 
        seatingChart: null,
        assignments: []
      })
    }

    // Get active seating chart for the class
    const { data: seatingChart, error: chartError } = await supabase
      .from('seating_charts')
      .select('*')
      .eq('class_id', classId)
      .eq('teacher_id', profile.id)
      .eq('is_active', true)
      .single()

    if (chartError && chartError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching seating chart:', chartError)
      return NextResponse.json({ error: 'Failed to fetch seating chart' }, { status: 500 })
    }

    // If no active chart exists, return null
    if (!seatingChart) {
      return NextResponse.json({ 
        seatingChart: null,
        assignments: []
      })
    }

    // Get seat assignments for this chart
    console.log('📋 Fetching assignments for chart:', seatingChart.id)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('seat_assignments')
      .select('*')
      .eq('seating_chart_id', seatingChart.id)

    if (assignmentsError) {
      console.error('❌ Error fetching seat assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch seat assignments' }, { status: 500 })
    }

    console.log('✅ Assignments fetched:', assignments?.length || 0, 'records')
    if (assignments && assignments.length > 0) {
      console.log('📌 Sample assignment:', assignments[0])
    }

    return NextResponse.json({
      seatingChart,
      assignments: assignments || []
    })

  } catch (error: any) {
    console.error('Error in GET /api/teacher/seating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    console.log('📝 POST /api/teacher/seating called')
    
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
    console.log('👤 User check:', { userId: user?.id, hasError: !!authError })
    
    if (authError || !user) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('📦 Request body:', {
      classId: body.classId,
      layoutTemplateId: body.layoutTemplateId,
      rows: body.rows,
      cols: body.cols,
      totalSeats: body.totalSeats
    })
    
    const { classId, layoutTemplateId, layoutName, rows, cols, totalSeats, seatPattern, name, description } = body

    if (!classId || !layoutTemplateId || !rows || !cols || !totalSeats || !seatPattern) {
      console.error('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user profile exists in profiles table (profiles.user_id = auth.users.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, user_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      console.error('❌ Profile not found for user_id:', user.id, profileError)
      return NextResponse.json({ 
        error: 'User profile not found. Please ensure your profile exists in the database.',
        details: 'Run database/create_teacher_profile.sql to create your profile.',
        userId: user.id
      }, { status: 400 })
    }

    console.log('✅ Profile found:', { profileId: profile.id, userId: profile.user_id, role: profile.role })

    if (profile.role !== 'teacher') {
      console.error('❌ User is not a teacher:', profile.role)
      return NextResponse.json({ 
        error: 'Only teachers can create seating charts.',
        details: `Your role is: ${profile.role}`
      }, { status: 403 })
    }

    console.log('✅ Validations passed. Profile exists, user is teacher, proceeding to create seating chart.')

    // Deactivate any existing active seating charts for this class
    console.log('🔄 Deactivating old charts...')
    const { error: deactivateError } = await supabase
      .from('seating_charts')
      .update({ is_active: false })
      .eq('class_id', classId)
      .eq('teacher_id', profile.id)  // Use profile.id
      .eq('is_active', true)

    if (deactivateError) {
      console.error('⚠️ Error deactivating old charts:', deactivateError)
    }

    // Create new seating chart (use profile.id as teacher_id)
    console.log('✨ Creating new seating chart...')
    const { data: newChart, error: createError } = await supabase
      .from('seating_charts')
      .insert({
        class_id: classId,
        teacher_id: profile.id,  // Use profile.id, not user.id
        layout_template_id: layoutTemplateId,
        layout_name: layoutName,
        rows,
        cols,
        total_seats: totalSeats,
        seat_pattern: seatPattern,
        name: name || `${layoutName} - ${new Date().toLocaleDateString()}`,
        description: description || '',
        is_active: true,
        activated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Error creating seating chart:', createError)
      console.error('Error details:', JSON.stringify(createError, null, 2))
      return NextResponse.json({ 
        error: `Failed to create seating chart: ${createError.message}`,
        details: createError 
      }, { status: 500 })
    }

    console.log('✅ Seating chart created successfully:', newChart.id)
    return NextResponse.json({ seatingChart: newChart })

  } catch (error: any) {
    console.error('❌ Error in POST /api/teacher/seating:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 })
  }
}

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
    const { seatingChartId, assignments, assignmentMethod = 'manual' } = body

    if (!seatingChartId || !assignments || !Array.isArray(assignments)) {
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

    // Delete existing assignments for this chart
    const { error: deleteError } = await supabase
      .from('seat_assignments')
      .delete()
      .eq('seating_chart_id', seatingChartId)

    if (deleteError) {
      console.error('Error deleting old assignments:', deleteError)
      return NextResponse.json({ error: 'Failed to update assignments' }, { status: 500 })
    }

    // Insert new assignments
    if (assignments.length > 0) {
      console.log('💾 Saving', assignments.length, 'assignments...')
      const assignmentsToInsert = assignments.map(assignment => ({
        seating_chart_id: seatingChartId,
        student_id: assignment.studentId,
        seat_id: assignment.seatId,
        row_index: assignment.rowIndex,
        col_index: assignment.colIndex,
        assigned_by: profile.id,  // Use profile.id, not user.id
        assignment_method: assignmentMethod
      }))

      console.log('📝 Sample assignment to insert:', assignmentsToInsert[0])

      const { error: insertError } = await supabase
        .from('seat_assignments')
        .insert(assignmentsToInsert)

      if (insertError) {
        console.error('❌ Error inserting assignments:', insertError)
        console.error('Error details:', JSON.stringify(insertError, null, 2))
        return NextResponse.json({ 
          error: 'Failed to save assignments',
          details: insertError.message 
        }, { status: 500 })
      }

      console.log('✅ Assignments saved successfully')
    } else {
      console.log('📝 No assignments to save (clearing all)')
    }

    // Ensure this chart is active and deactivate others
    // First, deactivate all other charts for this class
    const { data: currentChart } = await supabase
      .from('seating_charts')
      .select('class_id')
      .eq('id', seatingChartId)
      .single()

    if (currentChart) {
      await supabase
        .from('seating_charts')
        .update({ is_active: false })
        .eq('class_id', currentChart.class_id)
        .neq('id', seatingChartId)
    }

    // Update seating chart - set active and update timestamp
    const { error: updateError } = await supabase
      .from('seating_charts')
      .update({ 
        is_active: true,
        updated_at: new Date().toISOString(),
        activated_at: new Date().toISOString()
      })
      .eq('id', seatingChartId)

    if (updateError) {
      console.error('Error updating chart:', updateError)
    } else {
      console.log('✅ Seating chart activated:', seatingChartId)
    }

    return NextResponse.json({ success: true, assignmentsCount: assignments.length })

  } catch (error: any) {
    console.error('Error in PUT /api/teacher/seating:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
