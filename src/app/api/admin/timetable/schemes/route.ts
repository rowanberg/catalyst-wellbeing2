import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/timetable/schemes - Get all timetable schemes for school
export async function GET(request: NextRequest) {
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

    // Get user profile with school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Get all schemes with their time slots
    const { data: schemes, error: schemesError } = await supabase
      .from('timetable_schemes')
      .select(`
        *,
        time_slots:timetable_time_slots(*)
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('name')

    if (schemesError) {
      console.error('Error fetching schemes:', schemesError)
      return NextResponse.json({ error: 'Failed to fetch schemes' }, { status: 500 })
    }

    // Transform data to match frontend format
    const formattedSchemes = (schemes || []).map(scheme => ({
      id: scheme.id,
      name: scheme.name,
      description: scheme.description,
      workingDays: scheme.working_days || [],
      periodsPerDay: scheme.periods_per_day,
      isDefault: scheme.is_default,
      timeSlots: (scheme.time_slots || [])
        .sort((a: any, b: any) => a.slot_order - b.slot_order)
        .map((slot: any) => ({
          id: slot.id,
          startTime: slot.start_time,
          endTime: slot.end_time,
          label: slot.label,
          type: slot.slot_type
        }))
    }))

    return NextResponse.json({ schemes: formattedSchemes })
  } catch (error) {
    console.error('Error in schemes GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/timetable/schemes - Create or update scheme
export async function POST(request: NextRequest) {
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, description, workingDays, periodsPerDay, isDefault, timeSlots } = body

    if (!name || !workingDays || !timeSlots) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create scheme
    const { data: scheme, error: createError } = await supabase
      .from('timetable_schemes')
      .insert({
        school_id: profile.school_id,
        name,
        description,
        working_days: workingDays,
        periods_per_day: periodsPerDay || timeSlots.filter((s: any) => s.type === 'period').length,
        is_default: isDefault || false,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating scheme:', createError)
      return NextResponse.json({ error: 'Failed to create scheme' }, { status: 500 })
    }

    // Create time slots
    const slotsToInsert = timeSlots.map((slot: any, index: number) => ({
      scheme_id: scheme.id,
      slot_type: slot.type,
      label: slot.label,
      start_time: slot.startTime,
      end_time: slot.endTime,
      slot_order: index + 1
    }))

    const { error: slotsError } = await supabase
      .from('timetable_time_slots')
      .insert(slotsToInsert)

    if (slotsError) {
      console.error('Error creating time slots:', slotsError)
      // Rollback - delete the scheme
      await supabase.from('timetable_schemes').delete().eq('id', scheme.id)
      return NextResponse.json({ error: 'Failed to create time slots' }, { status: 500 })
    }

    return NextResponse.json({ scheme })
  } catch (error) {
    console.error('Error in schemes POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
