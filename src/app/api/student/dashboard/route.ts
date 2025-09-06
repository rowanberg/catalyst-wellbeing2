import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check if we have real Supabase credentials
    const hasRealSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                           process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co'
    
    if (!hasRealSupabase) {
      // Return mock data for development
      return NextResponse.json({
        profile: {
          id: 'mock-id',
          first_name: 'Alex',
          last_name: 'Johnson',
          grade_level: '5th Grade',
          class_name: 'Room 12A',
          xp: 1250,
          gems: 45,
          level: 8,
          streak_days: 12,
          total_quests_completed: 67,
          current_mood: 'happy',
          pet_happiness: 85,
          pet_name: 'Whiskers',
          school: {
            id: 'mock-school-id',
            name: 'Sunshine Elementary School',
            school_code: 'SES2024'
          }
        },
        mood: {
          mood: 'happy',
          mood_emoji: '😊',
          date: new Date().toISOString().split('T')[0]
        },
        quests: {
          status: {
            gratitude: true,
            kindness: false,
            courage: true,
            breathing: false,
            water: true,
            sleep: false
          },
          progress: {
            completed: 3,
            total: 6,
            percentage: 50
          },
          data: [
            { quest_type: 'gratitude', completed: true, xp_earned: 10, gems_earned: 2 },
            { quest_type: 'kindness', completed: false, xp_earned: 0, gems_earned: 0 },
            { quest_type: 'courage', completed: true, xp_earned: 15, gems_earned: 3 },
            { quest_type: 'breathing', completed: false, xp_earned: 0, gems_earned: 0 },
            { quest_type: 'water', completed: true, xp_earned: 5, gems_earned: 1 },
            { quest_type: 'sleep', completed: false, xp_earned: 0, gems_earned: 0 }
          ]
        },
        stats: {
          level: 8,
          xp: 1250,
          gems: 45,
          streakDays: 12,
          totalQuestsCompleted: 67,
          petHappiness: 85,
          petName: 'Whiskers'
        }
      })
    }
    
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
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile with school info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        role,
        school_id,
        avatar_url,
        xp,
        gems,
        level,
        phone,
        date_of_birth,
        address,
        emergency_contact,
        class_name,
        grade_level,
        last_login_at,
        streak_days,
        total_quests_completed,
        current_mood,
        pet_happiness,
        pet_name,
        created_at,
        updated_at,
        schools (
          id,
          name,
          school_code,
          address,
          phone,
          email
        )
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Get today's mood
    const { data: todayMood } = await supabase
      .from('mood_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Get today's quests
    const { data: todayQuests } = await supabase
      .from('daily_quests')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)

    // Get recent gratitude entries (last 3)
    const { data: gratitudeEntries } = await supabase
      .from('gratitude_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get recent courage log entries (last 3)
    const { data: courageEntries } = await supabase
      .from('courage_log')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)

    // Get habit tracker for today
    const { data: todayHabits } = await supabase
      .from('habit_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Get kindness counter
    const { data: kindnessData } = await supabase
      .from('kindness_counter')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get recent help requests
    const { data: helpRequests } = await supabase
      .from('help_requests')
      .select('*')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Calculate quest completion stats
    const questTypes = ['gratitude', 'kindness', 'courage', 'breathing', 'water', 'sleep']
    const completedQuests = todayQuests?.filter((q: any) => q.completed) || []
    const questProgress = {
      completed: completedQuests.length,
      total: questTypes.length,
      percentage: Math.round((completedQuests.length / questTypes.length) * 100)
    }

    // Create quests status object
    const questsStatus = questTypes.reduce((acc, type) => {
      const quest = todayQuests?.find((q: any) => q.quest_type === type)
      acc[type] = quest?.completed || false
      return acc
    }, {} as Record<string, boolean>)

    // Calculate streak data
    const streakData = {
      current: profile.streak_days || 0,
      best: profile.streak_days || 0, // You might want to track this separately
      lastCompleted: completedQuests.length > 0 ? today : ""
    }

    // Calculate additional stats for enhanced dashboard
    const weeklyXP = profile.xp || 0 // You might want to calculate this from recent activities
    const monthlyXP = profile.xp || 0 // You might want to calculate this from recent activities
    const nextLevelXP = (profile.level || 1) * 100 // Simple formula: level * 100

    return NextResponse.json({
      profile: {
        ...profile,
        school: profile.schools || null
      },
      mood: todayMood || {
        current: '',
        energy: 50,
        stress: 30,
        lastUpdated: ''
      },
      quests: {
        status: questsStatus,
        progress: questProgress,
        data: todayQuests || [],
        streakData
      },
      activities: {
        gratitude: gratitudeEntries || [],
        courage: courageEntries || [],
        habits: todayHabits || null,
        kindness: kindnessData || null
      },
      helpRequests: helpRequests || [],
      stats: {
        level: profile.level || 1,
        xp: profile.xp || 0,
        gems: profile.gems || 0,
        streakDays: profile.streak_days || 0,
        totalQuestsCompleted: profile.total_quests_completed || 0,
        petHappiness: profile.pet_happiness || 85,
        petName: profile.pet_name || 'Whiskers',
        weeklyXP,
        monthlyXP,
        rank: 1, // You might want to calculate this based on school rankings
        nextLevelXP
      }
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
