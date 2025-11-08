import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { unstable_cache } from 'next/cache'

// Cache daily topics query results (2 minutes)
const getCachedDailyTopics = unstable_cache(
  async (teacherId: string, days: number, supabase: any) => {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    // Query VIEW with indexes
    const { data: topics, error } = await supabase
      .from('daily_topics_with_details')
      .select('*')
      .eq('teacher_id', teacherId)
      .gte('topic_date', cutoffDate)
      .order('topic_date', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) throw error
    return topics || []
  },
  ['daily-topics-list'],
  {
    revalidate: 120, // 2 minutes
    tags: ['daily-topics']
  }
)

/**
 * GET /api/teacher/daily-topics
 * Fetch teacher's daily topics (today + recent) - OPTIMIZED
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // Get cached topics
    const topics = await getCachedDailyTopics(user.id, days, supabase)

    // Group topics by date for easier frontend consumption
    const topicsByDate: Record<string, any[]> = {}
    topics.forEach(topic => {
      const date = topic.topic_date
      if (!topicsByDate[date]) {
        topicsByDate[date] = []
      }
      topicsByDate[date].push(topic)
    })

    const response = NextResponse.json({
      success: true,
      topics,
      topicsByDate,
      todayTopics: topicsByDate[new Date().toISOString().split('T')[0]] || []
    })

    // Aggressive caching: 2 minutes cache, 1 minute stale-while-revalidate
    response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=60, must-revalidate')
    return response

  } catch (error: any) {
    console.error('Daily topics GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Cache teacher authorization data (profile + class assignments)
const getCachedTeacherAuth = unstable_cache(
  async (userId: string, classId: string, supabase: any) => {
    // Parallel fetch: profile + class assignment verification
    const [profileRes, assignmentRes] = await Promise.allSettled([
      supabase
        .from('profiles')
        .select('role, school_id')
        .eq('user_id', userId)
        .maybeSingle(),
      
      supabase
        .from('teacher_class_assignments')
        .select('id')
        .eq('teacher_id', userId)
        .eq('class_id', classId)
        .maybeSingle()
    ])

    const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : null
    const assignment = assignmentRes.status === 'fulfilled' ? assignmentRes.value.data : null

    return { profile, assignment }
  },
  ['teacher-auth'],
  {
    revalidate: 300, // 5 minutes - teacher assignments rarely change
    tags: ['teacher-assignments']
  }
)

/**
 * POST /api/teacher/daily-topics
 * Create or update a daily topic (upsert) - OPTIMIZED
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { class_id, topic, topic_date } = body

    // Validation
    if (!class_id || !topic) {
      return NextResponse.json(
        { error: 'class_id and topic are required' },
        { status: 400 }
      )
    }

    if (topic.length < 3 || topic.length > 1000) {
      return NextResponse.json(
        { error: 'Topic must be between 3 and 1000 characters' },
        { status: 400 }
      )
    }

    // Get cached teacher auth data (profile + assignment verification)
    const { profile, assignment } = await getCachedTeacherAuth(user.id, class_id, supabase)

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create daily topics' },
        { status: 403 }
      )
    }

    if (!assignment) {
      return NextResponse.json(
        { error: 'You are not assigned to this class' },
        { status: 403 }
      )
    }

    const dateToUse = topic_date || new Date().toISOString().split('T')[0]

    // OPTIMIZED UPSERT: No JOIN, just insert/update
    const { data: savedTopic, error: saveError } = await supabase
      .from('daily_topics')
      .upsert({
        teacher_id: user.id,
        class_id,
        school_id: profile.school_id,
        topic: topic.trim(),
        topic_date: dateToUse,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'teacher_id,class_id,topic_date',
        ignoreDuplicates: false
      })
      .select('id,teacher_id,class_id,topic,topic_date,created_at,updated_at')
      .single()

    if (saveError) {
      console.error('Error saving daily topic:', saveError)
      return NextResponse.json(
        { error: 'Failed to save topic', details: saveError.message },
        { status: 500 }
      )
    }

    const response = NextResponse.json({
      success: true,
      message: 'Topic saved successfully',
      topic: savedTopic
    })

    // Cache response for 1 minute
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=30')
    return response

  } catch (error: any) {
    console.error('Daily topics POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/teacher/daily-topics
 * Delete a specific daily topic
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const topicId = searchParams.get('id')

    if (!topicId) {
      return NextResponse.json(
        { error: 'Topic ID is required' },
        { status: 400 }
      )
    }

    // Delete topic (RLS ensures only owner can delete)
    const { error: deleteError } = await supabase
      .from('daily_topics')
      .delete()
      .eq('id', topicId)
      .eq('teacher_id', user.id) // Extra safety check

    if (deleteError) {
      console.error('Error deleting daily topic:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete topic', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully'
    })

  } catch (error: any) {
    console.error('Daily topics DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
