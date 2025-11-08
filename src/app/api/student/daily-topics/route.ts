import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

/**
 * GET /api/student/daily-topics
 * Fetch today's topics for student's classes
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

    // Get student profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id, class_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    console.log('[Daily Topics] Profile:', { 
      userId: user.id, 
      role: profile?.role, 
      classId: profile?.class_id,
      name: `${profile?.first_name} ${profile?.last_name}`
    })

    if (profileError || !profile || profile.role !== 'student') {
      console.error('[Daily Topics] Profile error:', profileError)
      return NextResponse.json(
        { error: 'Only students can access this endpoint', details: profileError?.message },
        { status: 403 }
      )
    }

    if (!profile.class_id) {
      console.warn('[Daily Topics] Student has no class_id assigned')
      return NextResponse.json({
        success: true,
        todayTopics: [],
        recentTopics: [],
        hasTopicsToday: false,
        message: 'No class assigned to student',
        studentClass: { id: null, name: 'No Class Assigned' }
      })
    }

    const today = new Date().toISOString().split('T')[0]
    console.log('[Daily Topics] Fetching topics for:', { 
      classId: profile.class_id, 
      date: today 
    })

    // Fetch today's topics for student's class
    const { data: topics, error: topicsError } = await supabase
      .from('daily_topics')
      .select(`
        id,
        topic,
        topic_date,
        teacher_id,
        classes (
          id,
          class_name,
          subject,
          room_number
        ),
        profiles!daily_topics_teacher_id_fkey (
          first_name,
          last_name
        )
      `)
      .eq('class_id', profile.class_id)
      .eq('topic_date', today)

    console.log('[Daily Topics] Query result:', {
      topicsFound: topics?.length || 0,
      error: topicsError?.message,
      topics: topics
    })

    if (topicsError) {
      console.error('[Daily Topics] Error fetching topics:', topicsError)
      return NextResponse.json(
        { error: 'Failed to fetch topics', details: topicsError.message },
        { status: 500 }
      )
    }

    // Also fetch recent topics (last 7 days) for context
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const { data: recentTopics, error: recentError } = await supabase
      .from('daily_topics')
      .select(`
        id,
        topic,
        topic_date,
        classes (
          class_name,
          subject
        )
      `)
      .eq('class_id', profile.class_id)
      .gte('topic_date', sevenDaysAgo)
      .lt('topic_date', today)
      .order('topic_date', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      todayTopics: topics || [],
      recentTopics: recentTopics || [],
      hasTopicsToday: (topics?.length || 0) > 0,
      studentClass: {
        id: profile.class_id,
        name: (topics && topics[0] && (topics[0].classes as any)?.class_name) || 'Your Class'
      }
    })

  } catch (error: any) {
    console.error('Daily topics GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
