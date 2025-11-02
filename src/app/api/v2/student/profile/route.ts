import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentUserProfile } from '@/lib/services/profileService'

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

    // Use centralized profile service with built-in caching and deduplication
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      return NextResponse.json({ message: 'Unauthorized or profile not found' }, { status: 401 })
    }

    // School info is already included in profile.school from profileService
    const schoolData = profile.school

    // Parallel fetch student-specific data (achievements, activity, rank)
    const [achievementsRes, activityRes, rankRes] = await Promise.allSettled([
      supabase
        .from('student_achievements')
        .select('*')
        .eq('student_id', profile.id)
        .order('earned_at', { ascending: false })
        .limit(8),
      
      supabase
        .from('student_activity')
        .select('*')
        .eq('student_id', profile.id)
        .order('timestamp', { ascending: false })
        .limit(5),
      
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

    const response = NextResponse.json({
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        student_tag: profile.student_tag,
        avatar_url: profile.avatar_url || profile.profile_picture_url,
        profile_picture_url: profile.profile_picture_url || profile.avatar_url,
        grade_level: profile.grade_level,
        class_name: profile.class_name,
        bio: profile.bio,
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
    
    response.headers.set('Cache-Control', 'private, max-age=120, stale-while-revalidate=30')
    return response

  } catch (error: any) {
    console.error('Error in /api/v2/student/profile:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
