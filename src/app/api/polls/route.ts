import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
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
    
    // Get current user using cookie-based auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Auth error in polls API:', authError)
      return NextResponse.json({ error: 'Unauthorized', details: authError?.message }, { status: 401 })
    }

    // Get user profile using supabaseAdmin to bypass RLS
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const userProfile = profiles?.[0]

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Check cache first for this user's polls
    const cacheKey = createCacheKey('polls', { 
      schoolId: userProfile.school_id, 
      role: userProfile.role,
      userId: user.id 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [POLLS-API] Returning cached polls for user:', user.id)
      return NextResponse.json(cachedData)
    }

    // Get active polls for user's school and role using supabaseAdmin
    console.log('Student polls API - User profile:', userProfile)
    console.log('Student polls API - Fetching polls for school_id:', userProfile.school_id, 'role:', userProfile.role)
    
    // First, let's see ALL active polls for this school to debug target_audience filtering
    const { data: allActivePolls, error: allPollsError } = await supabaseAdmin
      .from('polls')
      .select('id, title, status, target_audience, school_id')
      .eq('school_id', userProfile.school_id)
      .eq('status', 'active')
    
    console.log('Student polls API - All active polls for school:', allActivePolls)
    
    // Build target audience filter - handle both singular and plural forms
    const targetAudienceFilters = ['all', userProfile.role]
    if (userProfile.role === 'student') {
      targetAudienceFilters.push('students')
    } else if (userProfile.role === 'teacher') {
      targetAudienceFilters.push('teachers')
    } else if (userProfile.role === 'parent') {
      targetAudienceFilters.push('parents')
    }

    const { data: polls, error: pollsError } = await supabaseAdmin
      .from('polls')
      .select(`
        *,
        poll_questions(*)
      `)
      .eq('school_id', userProfile.school_id)
      .eq('status', 'active')
      .in('target_audience', targetAudienceFilters)
      .order('created_at', { ascending: false })
      
    console.log('Student polls API - Found polls after target_audience filter:', polls?.length || 0)
    console.log('Student polls API - Filtered polls data:', polls)

    if (pollsError) {
      console.error('Error fetching polls:', pollsError)
      return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 })
    }

    // Check which polls the user has already responded to (from analytics table workaround)
    const pollIds = polls.map(p => p.id)
    const { data: analyticsResponses } = await supabaseAdmin
      .from('poll_analytics')
      .select('poll_id, metric_value')
      .in('poll_id', pollIds)
      .eq('metric_name', 'response_data')

    // Extract poll IDs where this user has already responded
    const respondedPollIds = new Set()
    analyticsResponses?.forEach((item: any) => {
      const responseData = item.metric_value
      if (responseData.respondent_id === userProfile.id) {
        respondedPollIds.add(item.poll_id)
      }
    })

    // Transform polls data
    const transformedPolls = polls.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      type: poll.type,
      endDate: poll.end_date,
      hasResponded: respondedPollIds.has(poll.id),
      allowMultipleResponses: poll.allow_multiple_responses,
      questions: poll.poll_questions.map((q: any) => ({
        id: q.id,
        text: q.question_text,
        type: q.question_type,
        options: q.options,
        required: q.is_required
      }))
    }))

    const responseData = { polls: transformedPolls }
    
    // Cache the response for 3 minutes to reduce database load
    apiCache.set(cacheKey, responseData, 3)
    console.log('✅ [POLLS-API] Polls cached for user:', user.id)

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in polls API:', error)
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
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile and verify admin role using supabaseAdmin
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, id')
      .eq('user_id', user.id)

    const userProfile = profiles?.[0]

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, type, targetAudience, questions, startDate, endDate, isAnonymous, allowMultipleResponses } = body

    // Validate required fields
    if (!title || !type || !targetAudience || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create poll using supabaseAdmin
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .insert({
        title,
        description,
        type,
        target_audience: targetAudience,
        school_id: userProfile.school_id,
        created_by: userProfile.id,
        start_date: startDate,
        end_date: endDate,
        is_anonymous: isAnonymous || false,
        allow_multiple_responses: allowMultipleResponses || false,
        status: 'active'
      })
      .select()
      .single()

    if (pollError) {
      console.error('Error creating poll:', pollError)
      return NextResponse.json({ error: 'Failed to create poll' }, { status: 500 })
    }

    // Create questions using supabaseAdmin
    const questionsData = questions.map((q: any, index: number) => ({
      poll_id: poll.id,
      question_text: q.text,
      question_type: q.type,
      options: q.options || [],
      is_required: q.required !== false,
      order_index: index
    }))

    const { error: questionsError } = await supabaseAdmin
      .from('poll_questions')
      .insert(questionsData)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      // Clean up poll if questions failed
      await supabaseAdmin.from('polls').delete().eq('id', poll.id)
      return NextResponse.json({ error: 'Failed to create poll questions' }, { status: 500 })
    }

    return NextResponse.json({ poll: { id: poll.id, ...poll } })
  } catch (error) {
    console.error('Error in polls POST API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
