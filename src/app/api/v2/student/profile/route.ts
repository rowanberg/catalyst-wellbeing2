import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentUserProfile } from '@/lib/services/profileService'
import { unstable_cache } from 'next/cache'

// Inspirational school vision quotes
const schoolVisionQuotes = [
  'Empowering students to reach their full potential through quality education and holistic development',
  'Nurturing curious minds, building confident leaders, shaping tomorrow\'s innovators',
  'Excellence in education, character, and service - developing future global citizens',
  'Where learning meets inspiration, and every student discovers their unique brilliance',
  'Fostering academic excellence while cultivating creativity, integrity, and compassion',
  'Building tomorrow\'s leaders through knowledge, values, and innovative learning',
  'Transforming lives through education, empowering dreams through dedication',
  'Inspiring minds to explore, discover, and achieve beyond boundaries',
  'Creating lifelong learners who make a positive difference in the world',
  'Where tradition meets innovation in pursuit of academic excellence'
]

// Cache student-specific data for 2 minutes (reduces DB load)
const getCachedStudentData = unstable_cache(
  async (studentId: string, supabase: any) => {
    // Optimized parallel queries with indexes
    const [achievementsRes, activityRes, rankRes] = await Promise.allSettled([
      supabase
        .from('student_achievements')
        .select('id,achievement_name,icon,xp_reward,earned_at')
        .eq('student_id', studentId)
        .order('earned_at', { ascending: false })
        .limit(8),
      
      supabase
        .from('student_activity')
        .select('title,activity_type,timestamp,xp_gained')
        .eq('student_id', studentId)
        .order('timestamp', { ascending: false })
        .limit(5),
      
      supabase
        .from('student_progress')
        .select('class_rank')
        .eq('student_id', studentId)
        .maybeSingle()
    ])

    return {
      achievements: achievementsRes.status === 'fulfilled' ? achievementsRes.value.data || [] : [],
      activity: activityRes.status === 'fulfilled' ? activityRes.value.data || [] : [],
      rankData: rankRes.status === 'fulfilled' ? rankRes.value.data : null
    }
  },
  ['student-data'],
  {
    revalidate: 120, // 2 minutes
    tags: ['student-profile']
  }
)

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

    // Use centralized profile service with built-in caching
    const profile = await getCurrentUserProfile()
    
    if (!profile) {
      return NextResponse.json({ message: 'Unauthorized or profile not found' }, { status: 401 })
    }

    // School info is already included in profile.school
    const schoolData = profile.school

    // Fetch cached student-specific data
    const { achievements, activity, rankData } = await getCachedStudentData(profile.id, supabase)

    // Calculate next level XP
    const currentLevel = (profile as any).level || 1
    const nextLevelXP = currentLevel * 100

    // Format achievements (data already minimal from query)
    const formattedAchievements = achievements.map(ach => ({
      id: ach.id,
      name: ach.achievement_name,
      icon: ach.icon || '🏆',
      xp: ach.xp_reward || 10,
      earnedAt: ach.earned_at
    }))

    // Format activity (data already minimal from query)
    const formattedActivity = activity.map(act => ({
      title: act.title,
      type: act.activity_type,
      timestamp: act.timestamp,
      xp: act.xp_gained || null
    }))

    // Cast profile to any since this legacy route expects extended fields
    const extendedProfile = profile as any
    const extendedSchool = schoolData as any
    
    // Select a random vision quote for variety
    const randomVision = schoolVisionQuotes[Math.floor(Math.random() * schoolVisionQuotes.length)]
    
    const response = NextResponse.json({
      profile: {
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        student_tag: extendedProfile.student_tag,
        avatar_url: extendedProfile.avatar_url || profile.profile_picture,
        profile_picture_url: profile.profile_picture || extendedProfile.avatar_url,
        grade_level: profile.grade_level,
        class_name: extendedProfile.class_name,
        bio: extendedProfile.bio,
        school: schoolData ? {
          id: schoolData.id,
          name: schoolData.name,
          school_code: schoolData.school_code,
          address: extendedSchool.address,
          city: extendedSchool.city,
          country: extendedSchool.country,
          logo_url: schoolData.logo_url,
          vision: randomVision
        } : null
      },
      stats: {
        level: extendedProfile.level || 1,
        xp: extendedProfile.xp || 0,
        nextLevelXP: nextLevelXP,
        gems: extendedProfile.gems || 0,
        streakDays: extendedProfile.streak_days || 0,
        totalQuests: extendedProfile.total_quests_completed || 0,
        badges: achievements.length,
        rank: rankData?.class_rank || 0
      },
      achievements: formattedAchievements,
      recentActivity: formattedActivity
    })
    
    // Aggressive caching: 3 minutes cache, 1 minute stale-while-revalidate
    response.headers.set('Cache-Control', 'private, max-age=180, stale-while-revalidate=60, must-revalidate')
    return response

  } catch (error: any) {
    console.error('Error in /api/v2/student/profile:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
