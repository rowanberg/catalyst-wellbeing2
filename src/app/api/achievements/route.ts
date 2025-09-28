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

    // Check cache first
    const cacheKey = createCacheKey('achievements', { 
      schoolId: profile.school_id, 
      category,
      userId: profile.id 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [ACHIEVEMENTS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Get achievements for the school with student progress
    let query = supabase
      .from('achievements')
      .select(`
        *,
        student_achievements(
          current_progress,
          target_progress,
          progress_percentage,
          is_completed,
          completed_at,
          xp_earned,
          gems_earned
        )
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)

    // Filter by grade level if student
    if (profile.role === 'student' && profile.grade_level) {
      query = query.or(`required_grade_levels.is.null,required_grade_levels.cs.{${profile.grade_level}}`)
    }

    // Add category filter
    if (category && category !== 'All') {
      query = query.eq('category', category)
    }

    const { data: achievements, error } = await query.order('difficulty_level', { ascending: true })

    if (error) {
      console.error('Error fetching achievements:', error)
      return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 })
    }

    // Process achievements to match frontend interface
    const processedAchievements = achievements?.map((achievement: any) => {
      const studentProgress = achievement.student_achievements?.[0]
      
      return {
        id: achievement.id,
        title: achievement.name,
        description: achievement.description,
        category: achievement.category,
        type: achievement.rarity === 'legendary' ? 'certificate' : 
              achievement.rarity === 'epic' ? 'trophy' :
              achievement.rarity === 'rare' ? 'medal' : 'badge',
        rarity: achievement.rarity,
        icon: achievement.icon_name, // Will need to map to emoji or icon
        color: achievement.icon_color,
        isUnlocked: studentProgress?.is_completed || false,
        unlockedDate: studentProgress?.completed_at,
        progress: studentProgress?.current_progress || 0,
        maxProgress: studentProgress?.target_progress || 1,
        requirements: [], // Will be derived from criteria_config
        rewards: {
          xp: achievement.xp_reward || 0,
          gems: achievement.gem_reward || 0,
          title: achievement.special_rewards?.find((r: any) => r.type === 'title')?.name
        },
        isNew: studentProgress?.completed_at && 
               new Date(studentProgress.completed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }) || []

    // Get user stats
    const { data: userStats } = await supabase
      .from('student_achievements')
      .select('xp_earned, gems_earned, is_completed')
      .eq('student_id', profile.id)

    const totalXP = userStats?.reduce((sum, stat) => sum + (stat.xp_earned || 0), 0) || 0
    const totalGems = userStats?.reduce((sum, stat) => sum + (stat.gems_earned || 0), 0) || 0
    const unlockedCount = userStats?.filter(stat => stat.is_completed).length || 0

    const responseData = { 
      achievements: processedAchievements,
      stats: {
        totalAchievements: achievements?.length || 0,
        unlockedAchievements: unlockedCount,
        totalXP,
        totalGems,
        rank: 0, // Will be calculated from leaderboard
        streak: 0 // Will be calculated from daily activity
      }
    }

    // Cache the response for 5 minutes
    apiCache.set(cacheKey, responseData, 5)
    console.log('✅ [ACHIEVEMENTS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Achievements API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
