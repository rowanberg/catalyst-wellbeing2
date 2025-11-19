import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'
import { apiCache, createCacheKey } from '@/lib/utils/apiCache'

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

    const auth = await authenticateStudent(request)

    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const user = { id: userId }

    // Check cache first for this user's dashboard data
    const cacheKey = createCacheKey('dashboard', { userId: user.id })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [DASHBOARD-API] Returning cached data for user:', user.id)
      return NextResponse.json(cachedData)
    }

    // Get user profile - only essential fields for dashboard
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        first_name,
        last_name,
        role,
        school_id,
        school_code,
        xp,
        gems,
        level,
        class_name,
        grade_level,
        streak_days,
        total_quests_completed,
        current_mood,
        pet_happiness,
        pet_name
      `)
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return NextResponse.json(
        { message: 'Profile not found' },
        { status: 404 }
      )
    }

    // Optimized class name resolution - use single query with fallback
    let actualClassName = profile.class_name
    let gradeLevel = profile.grade_level
    
    // Only resolve class name if it looks like a UUID (indicating it needs resolution)
    if (profile.class_name && profile.class_name.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      try {
        // Single optimized query to get class info
        const { data: classData } = await supabase
          .from('classes')
          .select('class_name, class_code')
          .eq('id', profile.class_name)
          .single()
        
        if (classData?.class_name) {
          actualClassName = classData.class_name
        }
      } catch (error) {
        // Keep original class_name if lookup fails
        console.log('Class lookup failed, using original class_name')
      }
    }

    // Get school info using school_id from profile
    let schoolData: { id: any; name: any; school_code: any; address: any; phone: any; email: any; } | null = null
    if (profile.school_id) {
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, school_code, address, phone, email')
        .eq('id', profile.school_id)
        .single()

      if (!schoolError && school) {
        schoolData = school
      }
    } else if (profile.school_code) {
      // Fallback to school_code if school_id is not available
      const { data: school, error: schoolError } = await supabase
        .from('schools')
        .select('id, name, school_code, address, phone, email')
        .eq('school_code', profile.school_code)
        .single()

      if (!schoolError && school) {
        schoolData = school
        // Update profile with school_id for future use
        await supabase
          .from('profiles')
          .update({ school_id: school.id })
          .eq('user_id', user.id)
      }
    }


    // Get today's date in user's timezone
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    console.log('📅 Dashboard - Checking mood for date:', today)

    // Get today's mood from mood_tracking table
    const { data: todayMood, error: moodError } = await supabase
      .from('mood_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
      
    // Only log error if it's not the expected "no rows" error
    if (moodError && moodError.code !== 'PGRST116') {
      console.log('🎭 Mood data error:', moodError)
    } else if (todayMood) {
      console.log('🎭 Today\'s mood found:', todayMood.mood)
    } else {
      console.log('🎭 No mood logged today, using default')
    }

    // Handle mood data
    let moodData: { current: any; energy: number; stress: number; lastUpdated: any; } | null = null
    if (todayMood) {
      console.log('🎭 Using today\'s mood from mood_tracking table:', todayMood.mood)
      moodData = {
        current: todayMood.mood,
        energy: 50,
        stress: 30,
        lastUpdated: todayMood.created_at
      }
    } else {
      // No mood logged today - return empty current mood
      console.log('🎭 No mood for today, returning empty current mood')
      moodData = {
        current: '', // Always empty if no mood today
        energy: 50,
        stress: 30,
        lastUpdated: ''
      }
    }

    // OPTIMIZED: Execute all quest queries in parallel instead of sequential
    const [
      { data: todayGratitude },
      { data: todayCourage },
      { data: todayKindness },
      { data: todayBreathing },
      { data: todayHabits },
      { data: gratitudeEntries },
      { data: courageEntries },
      { data: kindnessData },
      { data: helpRequests }
    ] = await Promise.all([
      // Check gratitude quest
      supabase
        .from('gratitude_entries')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .limit(1),
      
      // Check courage quest
      supabase
        .from('courage_log')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .limit(1),
      
      // Check kindness quest
      supabase
        .from('kindness_counter')
        .select('last_updated')
        .eq('user_id', user.id)
        .gte('last_updated', `${today}T00:00:00.000Z`)
        .lt('last_updated', `${today}T23:59:59.999Z`)
        .limit(1),
      
      // Check breathing quest
      supabase
        .from('breathing_sessions')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .limit(1),
      
      // Get habit tracker (water and sleep)
      supabase
        .from('habit_tracker')
        .select('water_glasses, sleep_hours')
        .eq('user_id', user.id)
        .eq('date', today)
        .single(),
      
      // Get recent gratitude entries
      supabase
        .from('gratitude_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),
      
      // Get recent courage log entries
      supabase
        .from('courage_log')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3),
      
      // Get kindness counter
      supabase
        .from('kindness_counter')
        .select('*')
        .eq('user_id', user.id)
        .single(),
      
      // Get recent help requests
      supabase
        .from('help_requests')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
    ])

    // Calculate quest completion stats based on actual data
    const questTypes = ['gratitude', 'kindness', 'courage', 'breathing', 'water', 'sleep']
    
    // Determine completion status for each quest
    const questsStatus = {
      gratitude: todayGratitude && todayGratitude.length > 0,
      kindness: todayKindness && todayKindness.length > 0,
      courage: todayCourage && todayCourage.length > 0,
      breathing: todayBreathing && todayBreathing.length > 0,
      water: todayHabits && todayHabits.water_glasses && todayHabits.water_glasses >= 6,
      sleep: todayHabits && todayHabits.sleep_hours && todayHabits.sleep_hours >= 7
    }

    // Count completed quests
    const completedCount = Object.values(questsStatus).filter(Boolean).length
    
    const questProgress = {
      completed: completedCount,
      total: questTypes.length,
      percentage: Math.round((completedCount / questTypes.length) * 100)
    }

    // Calculate streak data
    const streakData = {
      current: profile.streak_days || 0,
      best: profile.streak_days || 0, // You might want to track this separately
      lastCompleted: completedCount > 0 ? today : ""
    }

    // Calculate additional stats for enhanced dashboard
    const weeklyXP = profile.xp || 0 // You might want to calculate this from recent activities
    const monthlyXP = profile.xp || 0 // You might want to calculate this from recent activities
    const nextLevelXP = (profile.level || 1) * 100 // Simple formula: level * 100

    const responseData = {
      profile: {
        ...profile,
        class_name: actualClassName,
        grade_level: gradeLevel,
        school_id: profile.school_id || schoolData?.id,
        school: schoolData
      },
      mood: moodData,
      quests: {
        status: questsStatus,
        progress: questProgress,
        data: [],
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
    }

    // Cache the response for 2 minutes to reduce database load
    apiCache.set(cacheKey, responseData, 2)
    console.log('✅ [DASHBOARD-API] Data cached for user:', user.id)

    return NextResponse.json(responseData)

  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
