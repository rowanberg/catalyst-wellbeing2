import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { apiCache } from '@/lib/utils/apiCache'

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
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id, role, grade_level')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { event_id } = body

    if (!event_id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Check if event exists and user can register
    const { data: event, error: eventError } = await supabase
      .from('school_events')
      .select(`
        id, title, school_id, max_participants, registration_end, 
        target_grades, target_roles, status, start_datetime,
        current_registrations
      `)
      .eq('id', event_id)
      .eq('status', 'published')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user is in the same school
    if (event.school_id !== profile.school_id) {
      return NextResponse.json({ error: 'You can only register for events in your school' }, { status: 403 })
    }

    // Check if registration is still open
    if (event.registration_end && new Date(event.registration_end) < new Date()) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 })
    }

    // Check if event has already started
    if (new Date(event.start_datetime) < new Date()) {
      return NextResponse.json({ error: 'Cannot register for events that have already started' }, { status: 400 })
    }

    // Check if user is eligible (grade level and role)
    if (event.target_grades && event.target_grades.length > 0 && profile.grade_level) {
      if (!event.target_grades.includes(profile.grade_level)) {
        return NextResponse.json({ error: 'This event is not available for your grade level' }, { status: 403 })
      }
    }

    if (event.target_roles && event.target_roles.length > 0) {
      if (!event.target_roles.includes(profile.role)) {
        return NextResponse.json({ error: 'This event is not available for your role' }, { status: 403 })
      }
    }

    // Check if already registered
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', profile.id)
      .single()

    if (existingRegistration && existingRegistration.status !== 'cancelled') {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 })
    }

    // Check capacity
    if (event.max_participants && event.current_registrations >= event.max_participants) {
      return NextResponse.json({ error: 'This event is full' }, { status: 400 })
    }

    // Register for the event
    const { error: registerError } = await supabase
      .from('event_registrations')
      .insert({
        event_id,
        user_id: profile.id,
        registration_type: 'registered',
        status: 'confirmed'
      })

    if (registerError) {
      console.error('Error registering for event:', registerError)
      return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 })
    }

    // Update event registration count
    const { error: updateError } = await supabase
      .from('school_events')
      .update({ 
        current_registrations: (event.current_registrations || 0) + 1 
      })
      .eq('id', event_id)

    if (updateError) {
      console.error('Error updating registration count:', updateError)
      // Don't fail the request, just log the error
    }

    // Clear cache
    apiCache.clear()

    return NextResponse.json({ 
      message: `Successfully registered for ${event.title}!` 
    })
  } catch (error) {
    console.error('Register for event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // Check if user is registered
    const { data: registration } = await supabase
      .from('event_registrations')
      .select('id, event_id')
      .eq('event_id', eventId)
      .eq('user_id', profile.id)
      .neq('status', 'cancelled')
      .single()

    if (!registration) {
      return NextResponse.json({ error: 'You are not registered for this event' }, { status: 400 })
    }

    // Cancel registration
    const { error: cancelError } = await supabase
      .from('event_registrations')
      .update({ 
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'User requested cancellation'
      })
      .eq('id', registration.id)

    if (cancelError) {
      console.error('Error cancelling registration:', cancelError)
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 })
    }

    // Update event registration count
    const { data: event } = await supabase
      .from('school_events')
      .select('current_registrations')
      .eq('id', eventId)
      .single()

    if (event) {
      await supabase
        .from('school_events')
        .update({ 
          current_registrations: Math.max(0, (event.current_registrations || 1) - 1)
        })
        .eq('id', eventId)
    }

    // Clear cache
    apiCache.clear()

    return NextResponse.json({ 
      message: 'Successfully unregistered from the event' 
    })
  } catch (error) {
    console.error('Unregister from event error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
