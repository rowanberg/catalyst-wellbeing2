import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/admin/timetable/entries?classId=xxx - Get timetable for a class
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get classId from query params
    const searchParams = request.nextUrl.searchParams
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    }

    // Use the database function to get timetable
    const { data: entries, error: entriesError } = await supabase
      .rpc('get_timetable_for_class', {
        p_class_id: classId,
        p_school_id: profile.school_id
      })

    if (entriesError) {
      console.error('Error fetching timetable entries:', entriesError)
      return NextResponse.json({ error: 'Failed to fetch timetable' }, { status: 500 })
    }

    // Transform to frontend format
    const formattedEntries = (entries || []).map((entry: any) => ({
      id: entry.entry_id,
      classId: entry.class_id,
      subjectId: entry.subject_id,
      teacherId: entry.teacher_id,
      slotId: entry.time_slot_id,
      day: entry.day_of_week,
      roomNumber: entry.room_number,
      subject: {
        id: entry.subject_id,
        name: entry.subject_name,
        code: entry.subject_code,
        color: entry.subject_color
      },
      teacher: entry.teacher_id ? {
        id: entry.teacher_id,
        name: entry.teacher_name,
        email: entry.teacher_email
      } : null,
      timeSlot: {
        id: entry.time_slot_id,
        label: entry.slot_label,
        startTime: entry.start_time,
        endTime: entry.end_time,
        type: entry.slot_type
      }
    }))

    return NextResponse.json({ entries: formattedEntries })
  } catch (error) {
    console.error('Error in entries GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/timetable/entries - Create new timetable entry
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
    const { classId, subjectId, teacherId, timeSlotId, dayOfWeek, roomNumber, notes } = body

    if (!classId || !subjectId || !timeSlotId || !dayOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Use the database function to create entry with validation
    const { data: entryId, error: createError } = await supabase
      .rpc('create_timetable_entry', {
        p_school_id: profile.school_id,
        p_class_id: classId,
        p_subject_id: subjectId,
        p_teacher_id: teacherId || null,
        p_time_slot_id: timeSlotId,
        p_day_of_week: dayOfWeek,
        p_room_number: roomNumber || null,
        p_notes: notes || null,
        p_created_by: user.id
      })

    if (createError) {
      console.error('Error creating timetable entry:', createError)
      return NextResponse.json({ 
        error: createError.message || 'Failed to create timetable entry' 
      }, { status: 500 })
    }

    return NextResponse.json({ entryId, success: true })
  } catch (error: any) {
    console.error('Error in entries POST:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

// PUT /api/admin/timetable/entries - Update timetable entry
export async function PUT(request: NextRequest) {
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
    const { entryId, subjectId, teacherId, roomNumber, notes } = body

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    // Use the database function to update entry
    const { data: success, error: updateError } = await supabase
      .rpc('update_timetable_entry', {
        p_entry_id: entryId,
        p_subject_id: subjectId || null,
        p_teacher_id: teacherId || null,
        p_room_number: roomNumber || null,
        p_notes: notes || null,
        p_updated_by: user.id
      })

    if (updateError) {
      console.error('Error updating timetable entry:', updateError)
      return NextResponse.json({ error: 'Failed to update timetable entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in entries PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/timetable/entries?entryId=xxx - Delete timetable entry
export async function DELETE(request: NextRequest) {
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

    // Get entryId from query params
    const searchParams = request.nextUrl.searchParams
    const entryId = searchParams.get('entryId')

    if (!entryId) {
      return NextResponse.json({ error: 'entryId is required' }, { status: 400 })
    }

    // Use the database function to delete entry (soft delete)
    const { data: success, error: deleteError } = await supabase
      .rpc('delete_timetable_entry', {
        p_entry_id: entryId
      })

    if (deleteError) {
      console.error('Error deleting timetable entry:', deleteError)
      return NextResponse.json({ error: 'Failed to delete timetable entry' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in entries DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
