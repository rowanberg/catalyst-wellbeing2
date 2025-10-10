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
          },
        },
      }
    )

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    // Initialize achievements for user if not exists (with error handling)
    try {
      await supabase.rpc('initialize_student_achievements', { p_student_id: user.id })
    } catch (initError) {
      console.log('Achievement initialization skipped (tables may not exist yet):', initError)
    }

    // Get achievement templates with student progress
    let query = supabase
      .from('achievement_templates')
      .select(`
        *,
        student_achievements!left(
          progress,
          is_unlocked,
          unlocked_at,
          is_new
        )
      `)
      .eq('student_achievements.student_id', user.id)
      .eq('is_active', true)

    // Add category filter
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    const { data: achievements, error } = await query.order('rarity', { ascending: false })

    if (error) {
      console.error('Error fetching achievements:', error)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Process achievements to match frontend interface
    const processedAchievements = achievements?.map((achievement: any) => {
      const studentProgress = achievement.student_achievements?.[0] || null
      
      return {
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        category: achievement.category,
        type: achievement.type,
        rarity: achievement.rarity,
        icon: achievement.icon,
        color: achievement.color,
        isUnlocked: studentProgress?.is_unlocked || false,
        unlockedDate: studentProgress?.unlocked_at || null,
        progress: studentProgress?.progress || 0,
        maxProgress: achievement.max_progress || 1,
        requirements: achievement.requirements || [],
        rewards: achievement.rewards || { xp: 0, gems: 0 },
        isNew: studentProgress?.is_new || false
      }
    }) || []

    // Get achievement stats (with error handling)
    let stats: { 
      total_achievements: any; 
      unlocked_achievements: any; 
      total_xp_from_achievements: any; 
      total_gems_from_achievements: any; 
      school_rank: any;
      [key: string]: any 
    } | null = null
    try {
      const { data: statsData } = await supabase
        .from('student_achievement_stats')
        .select('*')
        .eq('student_id', user.id)
        .single()
      stats = statsData
    } catch (statsError) {
      console.log('Achievement stats not available yet:', statsError)
    }

    // Get current student data for additional stats (with error handling)
    let profile: { xp: any; gems: any; level: any; streak_days: any; } | null = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('xp, gems, level, streak_days')
        .eq('user_id', user.id)
        .single()
      profile = profileData
    } catch (profileError) {
      console.log('Profile data not available:', profileError)
    }

    const responseData = { 
      achievements: processedAchievements,
      stats: {
        totalAchievements: stats?.total_achievements || 0,
        unlockedAchievements: stats?.unlocked_achievements || 0,
        totalXP: stats?.total_xp_from_achievements || 0,
        totalGems: stats?.total_gems_from_achievements || 0,
        rank: stats?.school_rank || 0,
        streak: profile?.streak_days || 0,
        currentXP: profile?.xp || 0,
        currentGems: profile?.gems || 0,
        currentLevel: profile?.level || 1
      }
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
