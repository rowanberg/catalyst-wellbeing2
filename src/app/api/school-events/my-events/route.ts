import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { apiCache, createCacheKey } from '@/lib/utils/apiCache'

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
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check cache first
    const cacheKey = createCacheKey('my-school-events', { userId: profile.id })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [MY-SCHOOL-EVENTS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Get user's registered events
    const { data: myEvents, error } = await supabase
      .from('event_registrations')
      .select(`
        registration_type,
        status,
        registered_at,
        school_events!inner(
          *,
          organizer_info:profiles!school_events_organizer_id_fkey(id, first_name, last_name, avatar_url, role)
        )
      `)
      .eq('user_id', profile.id)
      .in('status', ['pending', 'confirmed'])
      .eq('school_events.status', 'published')
      .order('school_events.start_datetime', { ascending: true })

    if (error) {
      console.error('Error fetching user events:', error)
      return NextResponse.json({ error: 'Failed to fetch your events' }, { status: 500 })
    }

    // Process events to match frontend interface
    const processedEvents = myEvents?.map((registration: any) => {
      const event = registration.school_events
      const organizerInfo = event.organizer_info
      
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.event_type,
        date: event.start_datetime.split('T')[0],
        time: new Date(event.start_datetime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        }),
        endTime: event.end_datetime ? new Date(event.end_datetime).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        }) : undefined,
        location: event.venue_name || event.room_number || 'TBD',
        organizer: {
          name: organizerInfo ? `${organizerInfo.first_name} ${organizerInfo.last_name}` : 'Unknown',
          role: organizerInfo?.role || 'Organizer',
          avatar: organizerInfo ? `${organizerInfo.first_name[0]}${organizerInfo.last_name[0]}` : 'O'
        },
        maxParticipants: event.max_participants,
        currentParticipants: event.current_registrations || 0,
        isRegistered: true,
        registrationDeadline: event.registration_end,
        requirements: event.prerequisites || [],
        tags: event.tags || [],
        image: event.event_image_url,
        status: 'upcoming' as const,
        isPopular: event.featured || false
      }
    }) || []

    const responseData = { events: processedEvents }

    // Cache the response for 2 minutes
    apiCache.set(cacheKey, responseData, 2)
    console.log('✅ [MY-SCHOOL-EVENTS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('My school events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
