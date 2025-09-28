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
      .select('id, school_id, role, grade_level')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const eventType = searchParams.get('event_type')

    // Check cache first
    const cacheKey = createCacheKey('school-events', { 
      schoolId: profile.school_id, 
      category, 
      eventType,
      userId: profile.id 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [SCHOOL-EVENTS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Build query for published events in the same school
    let query = supabase
      .from('school_events')
      .select(`
        *,
        organizer_info:profiles!school_events_organizer_id_fkey(id, first_name, last_name, avatar_url, role),
        event_registrations(count, user_id, status)
      `)
      .eq('school_id', profile.school_id)
      .eq('status', 'published')
      .gte('end_datetime', new Date().toISOString()) // Only future/ongoing events

    // Add filters
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }
    if (eventType && eventType !== 'All') {
      query = query.eq('event_type', eventType)
    }

    // Filter by target grades if user is a student
    if (profile.role === 'student' && profile.grade_level) {
      query = query.contains('target_grades', [profile.grade_level])
    }

    const { data: events, error } = await query.order('start_datetime', { ascending: true })

    if (error) {
      console.error('Error fetching school events:', error)
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    // Process events to match frontend interface
    const processedEvents = events?.map((event: any) => {
      const organizerInfo = event.organizer_info
      const registrations = event.event_registrations || []
      const currentRegistrations = registrations.filter((r: any) => 
        r.status === 'confirmed' || r.status === 'pending'
      ).length
      
      const userRegistration = registrations.find((r: any) => r.user_id === profile.id)
      const isRegistered = !!userRegistration && 
        (userRegistration.status === 'confirmed' || userRegistration.status === 'pending')

      // Map database fields to frontend interface
      return {
        id: event.id,
        title: event.title,
        description: event.description,
        category: event.event_type, // Map event_type to category for frontend
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
        currentParticipants: currentRegistrations,
        isRegistered: isRegistered,
        registrationDeadline: event.registration_end,
        requirements: event.prerequisites || [],
        tags: event.tags || [],
        image: event.event_image_url,
        status: 'upcoming' as const,
        isPopular: event.featured || false,
        rating: undefined, // Will be calculated from feedback if needed
        reviewCount: undefined
      }
    }) || []

    const responseData = { events: processedEvents }

    // Cache the response for 5 minutes
    apiCache.set(cacheKey, responseData, 5)
    console.log('✅ [SCHOOL-EVENTS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('School events API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
