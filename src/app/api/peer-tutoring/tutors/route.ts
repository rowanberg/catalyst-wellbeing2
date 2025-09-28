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

    const { searchParams } = new URL(request.url)
    const subject = searchParams.get('subject')
    const gradeLevel = searchParams.get('grade_level')

    // Check cache first
    const cacheKey = createCacheKey('peer-tutors', { 
      schoolId: profile.school_id, 
      subject, 
      gradeLevel,
      userId: profile.id 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [PEER-TUTORS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Build query for active tutors in the same school
    let query = supabase
      .from('tutor_profiles')
      .select(`
        *,
        user_info:profiles!tutor_profiles_user_id_fkey(id, first_name, last_name, avatar_url, grade_level),
        tutor_subjects(subject, grade_levels, proficiency_level, is_primary),
        tutoring_reviews(overall_rating, communication_rating, knowledge_rating)
      `)
      .eq('school_id', profile.school_id)
      .eq('status', 'active')

    const { data: tutors, error } = await query.order('average_rating', { ascending: false })

    if (error) {
      console.error('Error fetching tutors:', error)
      return NextResponse.json({ error: 'Failed to fetch tutors' }, { status: 500 })
    }

    // Process tutors to match the frontend interface
    const processedTutors = tutors?.map((tutor: any) => {
      const userInfo = tutor.user_info
      const subjects = tutor.tutor_subjects?.map((ts: any) => ts.subject) || []
      const specialties = tutor.tutor_subjects
        ?.filter((ts: any) => ts.is_primary)
        ?.map((ts: any) => `${ts.subject} (${ts.proficiency_level})`) || []

      // Filter by subject if specified
      if (subject && subject !== 'All' && !subjects.includes(subject)) {
        return null
      }

      // Filter by grade level if specified
      if (gradeLevel) {
        const hasGradeLevel = tutor.tutor_subjects?.some((ts: any) => 
          ts.grade_levels.includes(gradeLevel)
        )
        if (!hasGradeLevel) return null
      }

      return {
        id: tutor.id,
        name: userInfo ? `${userInfo.first_name} ${userInfo.last_name}` : 'Unknown',
        avatar: userInfo ? `${userInfo.first_name[0]}${userInfo.last_name[0]}` : 'U',
        grade: `Grade ${userInfo?.grade_level || 'N/A'}`,
        subjects: subjects,
        specialties: specialties,
        rating: tutor.average_rating || 0,
        reviewCount: tutor.total_ratings || 0,
        sessionsCompleted: tutor.total_sessions || 0,
        hourlyRate: parseFloat(tutor.hourly_rate) || 0,
        isVolunteer: parseFloat(tutor.hourly_rate) === 0,
        availability: tutor.availability_schedule || [],
        bio: tutor.bio || 'No bio available',
        achievements: [], // Will be populated from separate query if needed
        responseTime: `< ${tutor.response_time_hours || 24} hours`,
        languages: tutor.languages || ['English'],
        isOnline: true, // Will be determined by real-time status
        nextAvailable: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Mock next available
      }
    }).filter(Boolean) || []

    const responseData = { tutors: processedTutors }

    // Cache the response for 5 minutes
    apiCache.set(cacheKey, responseData, 5)
    console.log('✅ [PEER-TUTORS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Peer tutors API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
