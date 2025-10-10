import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const type = searchParams.get('type') // 'slots' or 'bookings'

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (type === 'bookings') {
      // Get meeting bookings
      let query = supabase
        .from('meeting_bookings')
        .select(`
          id,
          subject,
          agenda,
          status,
          meeting_notes,
          follow_up_required,
          created_at,
          slot:meeting_slots(
            id,
            date,
            start_time,
            end_time,
            meeting_type,
            location,
            virtual_meeting_link
          ),
          parent:parents(id, full_name, email, phone),
          student:students(id, full_name)
        `)
        .eq('slot.teacher_id', teacher.id)
        .order('slot.date', { ascending: true })

      if (startDate && endDate) {
        query = query
          .gte('slot.date', startDate)
          .lte('slot.date', endDate)
      }

      const { data: bookings, error } = await query

      if (error) {
        console.error('Error fetching bookings:', error)
        return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
      }

      return NextResponse.json({ bookings })
    } else {
      // Get meeting slots
      let query = supabase
        .from('meeting_slots')
        .select(`
          id,
          date,
          start_time,
          end_time,
          meeting_type,
          location,
          virtual_meeting_link,
          is_available,
          notes,
          booking:meeting_bookings(
            id,
            subject,
            status,
            parent:parents(full_name),
            student:students(full_name)
          )
        `)
        .eq('teacher_id', teacher.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (startDate && endDate) {
        query = query
          .gte('date', startDate)
          .lte('date', endDate)
      }

      const { data: slots, error } = await query

      if (error) {
        console.error('Error fetching slots:', error)
        return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 })
      }

      return NextResponse.json({ slots })
    }
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { 
      date, 
      start_time, 
      end_time, 
      meeting_type = 'conference',
      location,
      virtual_meeting_link,
      notes,
      recurring = false,
      recurring_weeks = 1
    } = body

    // Validate required fields
    if (!date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const slotsToCreate: { school_id: any; teacher_id: any; date: string; start_time: any; end_time: any; meeting_type: any; location: any; virtual_meeting_link: any; notes: any; }[] = []
    const baseDate = new Date(date)

    // Create slots (recurring if specified)
    for (let week = 0; week < (recurring ? recurring_weeks : 1); week++) {
      const slotDate = new Date(baseDate)
      slotDate.setDate(baseDate.getDate() + (week * 7))

      slotsToCreate.push({
        school_id: teacher.school_id,
        teacher_id: teacher.id,
        date: slotDate.toISOString().split('T')[0],
        start_time,
        end_time,
        meeting_type,
        location,
        virtual_meeting_link,
        notes
      })
    }

    // Insert slots
    const { data: newSlots, error: insertError } = await supabase
      .from('meeting_slots')
      .insert(slotsToCreate)
      .select()

    if (insertError) {
      console.error('Error inserting slots:', insertError)
      return NextResponse.json({ error: 'Failed to create meeting slots' }, { status: 500 })
    }

    return NextResponse.json({ slots: newSlots }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { slot_id, booking_id, action, ...updates } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (slot_id) {
      // Update meeting slot
      const { data: updatedSlot, error: updateError } = await supabase
        .from('meeting_slots')
        .update(updates)
        .eq('id', slot_id)
        .eq('teacher_id', teacher.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating slot:', updateError)
        return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
      }

      return NextResponse.json({ slot: updatedSlot })
    } else if (booking_id) {
      // Update meeting booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from('meeting_bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', booking_id)
        .select(`
          *,
          slot:meeting_slots!inner(teacher_id)
        `)
        .single()

      if (updateError) {
        console.error('Error updating booking:', updateError)
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
      }

      return NextResponse.json({ booking: updatedBooking })
    }

    return NextResponse.json({ error: 'No valid ID provided' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { slot_id, booking_id, action, ...updates } = body

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (slot_id) {
      // Update meeting slot
      const { data: updatedSlot, error: updateError } = await supabase
        .from('meeting_slots')
        .update(updates)
        .eq('id', slot_id)
        .eq('teacher_id', teacher.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating slot:', updateError)
        return NextResponse.json({ error: 'Failed to update slot' }, { status: 500 })
      }

      return NextResponse.json({ slot: updatedSlot })
    } else if (booking_id) {
      // Update meeting booking
      const { data: updatedBooking, error: updateError } = await supabase
        .from('meeting_bookings')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', booking_id)
        .select(`
          *,
          slot:meeting_slots!inner(teacher_id)
        `)
        .single()

      if (updateError) {
        console.error('Error updating booking:', updateError)
        return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
      }

      return NextResponse.json({ booking: updatedBooking })
    }

    return NextResponse.json({ error: 'No valid ID provided' }, { status: 400 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const slotId = searchParams.get('slot_id')

    if (!slotId) {
      return NextResponse.json({ error: 'Slot ID required' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher info
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (teacherError || !teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    // Check if slot has bookings
    const { data: bookings, error: bookingError } = await supabase
      .from('meeting_bookings')
      .select('id')
      .eq('slot_id', slotId)
      .neq('status', 'cancelled')

    if (bookingError) {
      console.error('Error checking bookings:', bookingError)
      return NextResponse.json({ error: 'Failed to check bookings' }, { status: 500 })
    }

    if (bookings && bookings.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete slot with active bookings. Cancel bookings first.' 
      }, { status: 400 })
    }

    // Delete slot
    const { error: deleteError } = await supabase
      .from('meeting_slots')
      .delete()
      .eq('id', slotId)
      .eq('teacher_id', teacher.id)

    if (deleteError) {
      console.error('Error deleting slot:', deleteError)
      return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
