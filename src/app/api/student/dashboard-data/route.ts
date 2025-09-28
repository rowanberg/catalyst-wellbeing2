import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  try {
    // Get pagination parameters
    const { searchParams } = new URL(request.url)
    const announcementsLimit = Math.min(parseInt(searchParams.get('announcements_limit') || '5'), 20)
    const pollsLimit = Math.min(parseInt(searchParams.get('polls_limit') || '5'), 20)
    
    // Enhanced authentication
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
    let user = null
    let authError = null
    
    try {
      const authResult = await supabase.auth.getUser()
      user = authResult.data?.user
      authError = authResult.error
    } catch (error) {
      console.error('Auth error:', error)
      authError = error
    }
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required',
        details: (authError as any)?.message || 'No user session found'
      }, { status: 401 })
    }

    // Get student profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (profile.role !== 'student') {
      return NextResponse.json({ error: 'Student access required' }, { status: 403 })
    }

    // Fetch all data in parallel for maximum performance
    const [announcementsResult, pollsResult, schoolInfoResult] = await Promise.all([
      // Fetch announcements
      supabaseAdmin
        .from('school_announcements')
        .select(`
          id,
          title,
          content,
          priority,
          author_name,
          target_audience,
          created_at,
          expires_at,
          created_by,
          profiles:created_by (
            first_name,
            last_name
          )
        `)
        .eq('school_id', profile.school_id)
        .eq('is_active', true)
        .in('target_audience', ['all', 'students'])
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(announcementsLimit),

      // Fetch polls
      supabaseAdmin
        .from('polls')
        .select(`
          id,
          title,
          description,
          type,
          status,
          target_audience,
          school_id,
          created_by,
          created_at,
          updated_at,
          start_date,
          end_date,
          is_anonymous,
          allow_multiple_responses,
          require_authentication,
          settings,
          poll_questions (
            id,
            question_text,
            question_type,
            options,
            required,
            order_index
          )
        `)
        .eq('school_id', profile.school_id)
        .eq('status', 'active')
        .in('target_audience', ['all', 'students'])
        .order('created_at', { ascending: false })
        .limit(pollsLimit),

      // Fetch school info
      supabaseAdmin
        .from('schools')
        .select('id, name, address, phone, email')
        .eq('id', profile.school_id)
        .single()
    ])

    // Process announcements
    const announcements = (announcementsResult.data || []).map(announcement => ({
      id: announcement.id,
      title: announcement.title,
      content: announcement.content,
      type: 'general',
      priority: announcement.priority || 'medium',
      author: announcement.author_name || 
              ((announcement as any).profiles ? `${(announcement as any).profiles.first_name} ${(announcement as any).profiles.last_name}` : 'School Admin'),
      created_at: announcement.created_at,
      expires_at: announcement.expires_at
    }))

    // Check user responses for polls (using correct column name)
    const pollIds = (pollsResult.data || []).map(poll => poll.id)
    let userResponses: { poll_id: string }[] = []
    
    if (pollIds.length > 0) {
      const responsesResult = await supabaseAdmin
        .from('poll_responses')
        .select('poll_id')
        .eq('respondent_id', user.id) // Using correct column name
        .in('poll_id', pollIds)
      
      userResponses = responsesResult.data || []
    }

    // Process polls with response status
    const polls = (pollsResult.data || []).map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      questions: poll.poll_questions || [],
      endDate: poll.end_date,
      hasResponded: userResponses.some(response => response.poll_id === poll.id),
      allowMultipleResponses: poll.allow_multiple_responses,
      type: poll.type
    }))

    // Combine all data
    const dashboardData = {
      profile: {
        id: user.id,
        firstName: profile.first_name,
        lastName: profile.last_name,
        role: profile.role,
        schoolId: profile.school_id
      },
      announcements: {
        data: announcements,
        total: announcements.length,
        limit: announcementsLimit
      },
      polls: {
        data: polls,
        total: polls.length,
        limit: pollsLimit
      },
      schoolInfo: schoolInfoResult.data || null,
      timestamp: new Date().toISOString()
    }

    // Add performance headers
    const response = NextResponse.json(dashboardData)
    response.headers.set('Cache-Control', 's-maxage=180, stale-while-revalidate=300') // 3min cache, 5min stale
    response.headers.set('CDN-Cache-Control', 'max-age=180')
    response.headers.set('Vary', 'Cookie')
    response.headers.set('X-API-Performance', 'optimized-combined-endpoint')
    
    return response

  } catch (error) {
    console.error('Combined dashboard API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
