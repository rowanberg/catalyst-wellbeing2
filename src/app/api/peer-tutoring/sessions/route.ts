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
      .select('id, school_id, role, first_name, last_name, grade_level')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check cache first
    const cacheKey = createCacheKey('my-tutoring-sessions', { userId: profile.id })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [TUTORING-SESSIONS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Get user's tutoring sessions (both as student and tutor)
    const { data: sessions, error } = await supabase
      .from('tutoring_sessions')
      .select(`
        *,
        tutor_info:tutor_profiles!tutoring_sessions_tutor_id_fkey(
          user_info:profiles!tutor_profiles_user_id_fkey(first_name, last_name, avatar_url)
        ),
        student_info:profiles!tutoring_sessions_student_id_fkey(first_name, last_name, avatar_url),
        tutoring_reviews(overall_rating, review_text)
      `)
      .or(`student_id.eq.${profile.id},tutor_id.in.(select id from tutor_profiles where user_id = ${profile.id})`)
      .order('scheduled_start', { ascending: false })

    if (error) {
      console.error('Error fetching tutoring sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Process sessions to match frontend interface
    const processedSessions = sessions?.map((session: any) => {
      const isStudentSession = session.student_id === profile.id
      const otherParty = isStudentSession 
        ? session.tutor_info?.user_info 
        : session.student_info

      const otherPartyName = otherParty 
        ? `${otherParty.first_name} ${otherParty.last_name}`
        : 'Unknown'

      // Determine status based on scheduled times and current status
      let status: 'upcoming' | 'completed' | 'cancelled' = 'upcoming'
      if (session.status === 'completed') status = 'completed'
      else if (session.status === 'cancelled') status = 'cancelled'
      else if (new Date(session.scheduled_start) < new Date()) status = 'completed'

      const userReview = session.tutoring_reviews?.find((review: any) => 
        review.reviewer_id === profile.id
      )

      return {
        id: session.id,
        tutorId: session.tutor_id,
        tutorName: isStudentSession ? otherPartyName : `${profile.first_name || 'Unknown'} ${profile.last_name || 'User'}`,
        subject: session.subject,
        topic: session.title,
        scheduledTime: session.scheduled_start,
        duration: session.duration_minutes || 60,
        status: status,
        rating: userReview?.overall_rating,
        notes: userReview?.review_text || session.session_summary
      }
    }) || []

    const responseData = { sessions: processedSessions }

    // Cache the response for 2 minutes
    apiCache.set(cacheKey, responseData, 2)
    console.log('✅ [TUTORING-SESSIONS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Tutoring sessions API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      .select('id, school_id, role, first_name, last_name, grade_level')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const body = await request.json()
    const { tutor_id, subject, title, scheduled_start, scheduled_end, description } = body

    // Verify tutor exists and is in same school
    const { data: tutorProfile, error: tutorError } = await supabase
      .from('tutor_profiles')
      .select('id, hourly_rate, school_id')
      .eq('id', tutor_id)
      .eq('school_id', profile.school_id)
      .eq('status', 'active')
      .single()

    if (tutorError || !tutorProfile) {
      return NextResponse.json({ error: 'Tutor not found or not available' }, { status: 404 })
    }

    // Calculate session cost
    const startTime = new Date(scheduled_start)
    const endTime = new Date(scheduled_end)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    const totalCost = durationHours * parseFloat(tutorProfile.hourly_rate)

    // Create the tutoring session
    const { data: newSession, error } = await supabase
      .from('tutoring_sessions')
      .insert({
        tutor_id,
        student_id: profile.id,
        school_id: profile.school_id,
        title: title || `${subject} Tutoring Session`,
        subject,
        grade_level: profile.grade_level || '10',
        scheduled_start,
        scheduled_end,
        hourly_rate: tutorProfile.hourly_rate,
        total_cost: totalCost,
        location_type: 'online',
        location_details: { platform: 'zoom' },
        created_by: profile.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tutoring session:', error)
      return NextResponse.json({ error: 'Failed to book session' }, { status: 500 })
    }

    // Clear cache
    apiCache.clear()

    return NextResponse.json({ 
      message: 'Tutoring session booked successfully!', 
      session: newSession 
    }, { status: 201 })
  } catch (error) {
    console.error('Book session error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
