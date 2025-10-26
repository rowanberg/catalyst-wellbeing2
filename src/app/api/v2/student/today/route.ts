import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
          }
        }
      }
    )

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, school_id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 })
    }

    // Parallel fetch all data needed for Today tab - using EXACT same queries as dashboard-data API
    const [questsRes, examsRes, progressRes, pollsRes, announcementsRes] = await Promise.allSettled([
      // Today's quests
      supabase
        .from('daily_quests')
        .select('*')
        .eq('student_id', profile.id)
        .eq('date', new Date().toISOString().split('T')[0]),
      
      // Upcoming exams (next 7 days)
      supabase
        .from('assessments')
        .select('*')
        .eq('school_id', profile.school_id)
        .gte('due_date', new Date().toISOString())
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
      
      // Weekly progress
      supabase
        .from('student_progress')
        .select('weekly_xp, class_rank, streak_days')
        .eq('student_id', profile.id)
        .single(),
      
      // Polls - EXACT same query as dashboard-data API
      supabase
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
        .limit(2),
      
      // Announcements - EXACT same query as dashboard-data API
      supabase
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
        .or(`expires_at.is.null,expires_at.gte.now()`)
        .order('created_at', { ascending: false })
        .limit(2)
    ])

    // Process results
    const quests = questsRes.status === 'fulfilled' ? questsRes.value.data || [] : []
    const upcomingExams = examsRes.status === 'fulfilled' ? examsRes.value.data || [] : []
    const progress = progressRes.status === 'fulfilled' ? progressRes.value.data : null
    const pollsData = pollsRes.status === 'fulfilled' ? pollsRes.value.data || [] : []
    const announcementsData = announcementsRes.status === 'fulfilled' ? announcementsRes.value.data || [] : []
    
    console.log('📊 Today API - Raw data:', {
      pollsCount: pollsData.length,
      announcementsCount: announcementsData.length,
      pollsError: pollsRes.status === 'rejected' ? pollsRes.reason : null,
      announcementsError: announcementsRes.status === 'rejected' ? announcementsRes.reason : null
    })
    
    // Format polls and announcements exactly like dashboard-data API
    const polls = pollsData.map(poll => ({
      id: poll.id,
      title: poll.title,
      description: poll.description,
      questions: poll.poll_questions || [],
      endDate: poll.end_date,
      hasResponded: false, // Will be checked separately if needed
      allowMultipleResponses: poll.allow_multiple_responses,
      type: poll.type
    }))
    
    const announcements = announcementsData.map(announcement => ({
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
    
    console.log('📊 Today API - Formatted school updates:', {
      polls: polls.length,
      announcements: announcements.length,
      samplePoll: polls[0] || null,
      sampleAnnouncement: announcements[0] || null
    })

    // Format quests data
    const questItems = [
      { id: 'gratitude', type: 'gratitude', title: 'Gratitude Journal', description: 'Write 3 things you\'re grateful for', xp: 15, completed: false },
      { id: 'kindness', type: 'kindness', title: 'Acts of Kindness', description: 'Do one act of kindness', xp: 20, completed: false },
      { id: 'courage', type: 'courage', title: 'Courage Challenge', description: 'Share something brave you did', xp: 25, completed: false },
      { id: 'breathing', type: 'breathing', title: 'Mindful Breathing', description: 'Complete a breathing exercise', xp: 10, completed: false },
      { id: 'water', type: 'water', title: 'Hydration Hero', description: 'Drink 8 glasses of water', xp: 8, completed: false },
      { id: 'sleep', type: 'sleep', title: 'Sleep Champion', description: 'Get 8+ hours of sleep', xp: 12, completed: false }
    ]

    // Check completed quests from database
    if (quests.length > 0) {
      const questData = quests[0]
      questItems.forEach(item => {
        if (questData[item.type]) {
          item.completed = true
        }
      })
    }

    const completedCount = questItems.filter(q => q.completed).length

    return NextResponse.json({
      quests: {
        completed: completedCount,
        total: questItems.length,
        items: questItems
      },
      upcomingExams: upcomingExams.map(exam => ({
        id: exam.id,
        subject: exam.subject,
        type: exam.exam_type || 'Test',
        date: exam.due_date,
        time: exam.exam_time || '9:00 AM'
      })),
      weeklyProgress: {
        xp: progress?.weekly_xp || 0,
        rank: progress?.class_rank || 0,
        streak: progress?.streak_days || 0
      },
      schoolUpdates: {
        polls: polls.length > 0 ? polls : [],
        announcements: announcements.length > 0 ? announcements : []
      }
    })

  } catch (error: any) {
    console.error('Error in /api/v2/student/today:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
