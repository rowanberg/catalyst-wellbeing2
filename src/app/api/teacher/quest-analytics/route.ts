import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use the database function to get analytics
    const { data: analyticsResult, error } = await supabase
      .rpc('get_quest_analytics', {
        p_school_id: profile.school_id,
        p_teacher_id: profile.role === 'teacher' ? user.id : null
      })

    if (error) {
      console.error('Error fetching quest analytics:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Get top performing quests separately for more detailed info
    const { data: topQuests } = await supabase
      .from('quests')
      .select(`
        id,
        title,
        difficulty,
        category,
        xp_reward,
        gem_reward,
        quest_attempts(
          status,
          completed_at,
          time_spent
        )
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)
      .limit(10)

    const processedTopQuests = topQuests?.map(quest => {
      const attempts = quest.quest_attempts || []
      const completed = attempts.filter(a => a.status === 'completed')
      const successRate = attempts.length > 0 ? (completed.length / attempts.length) * 100 : 0
      
      return {
        id: quest.id,
        title: quest.title,
        difficulty: quest.difficulty,
        category: quest.category,
        xpReward: quest.xp_reward,
        gemReward: quest.gem_reward,
        totalAttempts: attempts.length,
        successRate: Math.round(successRate),
        averageCompletionTime: completed.length > 0 
          ? Math.round(completed.reduce((sum, a) => sum + (a.time_spent || 0), 0) / completed.length)
          : 0
      }
    }).sort((a, b) => b.successRate - a.successRate).slice(0, 5) || []

    const analytics = {
      ...analyticsResult,
      topPerformingQuests: processedTopQuests,
      strugglingStudents: [], // TODO: Implement struggling students detection
      difficultyDistribution: {
        easy: 0,
        medium: 0,
        hard: 0,
        expert: 0
      }
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    console.error('Error in GET /api/teacher/quest-analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
