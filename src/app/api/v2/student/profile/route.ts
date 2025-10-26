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

    // Get complete user profile with school info
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        email,
        profile_picture_url,
        avatar_url,
        school_id,
        grade_level,
        class_name,
        student_tag,
        xp,
        level,
        gems,
        streak_days,
        total_quests_completed
      `)
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 })
    }

    // Get school info separately
    let schoolData: any = null
    if (profile.school_id) {
      const { data: school } = await supabase
        .from('schools')
        .select('id, name, school_code, address, city, country, logo_url')
        .eq('id', profile.school_id)
        .single()
      if (school) {
        schoolData = school
      }
    }

    // Parallel fetch profile-related data
    const [achievementsRes, activityRes, rankRes] = await Promise.allSettled([
      // Recent achievements
      supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(8),
      
      // Recent activity
      supabase
        .from('student_activity')
        .select('*')
        .eq('student_id', profile.id)
        .order('timestamp', { ascending: false })
        .limit(5),
      
      // Class rank
      supabase
        .from('student_progress')
        .select('class_rank')
        .eq('student_id', profile.id)
        .single()
    ])

    // Process results
    const achievements = achievementsRes.status === 'fulfilled' ? achievementsRes.value.data || [] : []
    const activity = activityRes.status === 'fulfilled' ? activityRes.value.data || [] : []
    const rankData = rankRes.status === 'fulfilled' ? rankRes.value.data : null

    // Calculate next level XP
    const currentLevel = profile.level || 1
    const nextLevelXP = currentLevel * 100

    // Format achievements
    const formattedAchievements = achievements.map(ach => ({
      id: ach.id,
      name: ach.achievement_name,
      icon: ach.icon || '🏆',
      xp: ach.xp_reward || 10,
      earnedAt: ach.earned_at
    }))

    // Format activity
    const formattedActivity = activity.map(act => ({
      title: act.title,
      type: act.activity_type, // 'quest', 'achievement', 'test', etc.
      timestamp: act.timestamp,
      xp: act.xp_gained || null
    }))

    return NextResponse.json({
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        student_tag: profile.student_tag,
        avatar_url: profile.avatar_url || profile.profile_picture_url,
        profile_picture_url: profile.profile_picture_url || profile.avatar_url,
        grade_level: profile.grade_level,
        class_name: profile.class_name,
        bio: null,
        school: schoolData ? {
          id: schoolData.id,
          name: schoolData.name,
          school_code: schoolData.school_code,
          address: schoolData.address,
          city: schoolData.city,
          country: schoolData.country,
          logo_url: schoolData.logo_url,
          vision: 'Empowering students to reach their full potential through quality education and holistic development'
        } : null
      },
      stats: {
        level: profile.level || 1,
        xp: profile.xp || 0,
        nextLevelXP: nextLevelXP,
        gems: profile.gems || 0,
        streakDays: profile.streak_days || 0,
        totalQuests: profile.total_quests_completed || 0,
        badges: achievements.length,
        rank: rankData?.class_rank || 0
      },
      achievements: formattedAchievements,
      recentActivity: formattedActivity
    })

  } catch (error: any) {
    console.error('Error in /api/v2/student/profile:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
