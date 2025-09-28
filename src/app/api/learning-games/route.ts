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
    const cacheKey = createCacheKey('learning-games', { 
      schoolId: profile.school_id, 
      category,
      gradeLevel: profile.grade_level 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [LEARNING-GAMES-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Build query for active games
    let query = supabase
      .from('learning_games')
      .select(`
        *,
        creator_info:profiles!learning_games_created_by_fkey(first_name, last_name),
        game_sessions(id, current_score, status, completed_at)
      `)
      .eq('school_id', profile.school_id)
      .eq('is_active', true)

    // Filter by grade level if student
    if (profile.role === 'student' && profile.grade_level) {
      query = query.contains('grade_levels', [profile.grade_level])
    }

    // Add category filter (map frontend categories to database subjects)
    if (category && category !== 'All') {
      const subjectMap: Record<string, string> = {
        'math': 'Mathematics',
        'science': 'Science', 
        'language': 'English',
        'logic': 'Logic',
        'memory': 'Memory'
      }
      const subject = subjectMap[category] || category
      query = query.eq('subject', subject)
    }

    const { data: games, error } = await query.order('is_featured', { ascending: false })

    if (error) {
      console.error('Error fetching learning games:', error)
      return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 })
    }

    // If no games exist, return our 7 engaging games as mock data
    if (!games || games.length === 0) {
      const engagingGames = [
        {
          id: 'math-battle',
          title: 'Math Battle Arena',
          description: 'Epic math battles where students solve equations to defeat monsters and level up their mathematical powers!',
          category: 'math',
          difficulty: 'medium',
          duration: 15,
          players: 'multiplayer',
          rating: 4.9,
          playCount: 15420,
          isNew: true,
          thumbnail: '🐉',
          rewards: { xp: 150, gems: 30 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        },
        {
          id: 'word-wizard',
          title: 'Word Wizard Academy',
          description: 'Cast spelling spells and build vocabulary magic in this enchanting word-building adventure!',
          category: 'language',
          difficulty: 'easy',
          duration: 20,
          players: 'single',
          rating: 4.8,
          playCount: 12350,
          isNew: true,
          thumbnail: '🧙‍♂️',
          rewards: { xp: 120, gems: 25 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        },
        {
          id: 'science-lab',
          title: 'Science Lab Simulator',
          description: 'Conduct virtual experiments, discover scientific principles, and become a master scientist!',
          category: 'science',
          difficulty: 'hard',
          duration: 30,
          players: 'single',
          rating: 4.7,
          playCount: 8920,
          isNew: true,
          thumbnail: '🔬',
          rewards: { xp: 200, gems: 40 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        },
        {
          id: 'history-time-machine',
          title: 'History Time Machine',
          description: 'Travel through time, meet historical figures, and shape the course of history!',
          category: 'history',
          difficulty: 'medium',
          duration: 25,
          players: 'single',
          rating: 4.6,
          playCount: 7650,
          isNew: true,
          thumbnail: '⏰',
          rewards: { xp: 160, gems: 35 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        },
        {
          id: 'code-quest',
          title: 'Code Quest Adventures',
          description: 'Learn programming through epic quests! Solve coding challenges to unlock new worlds.',
          category: 'logic',
          difficulty: 'hard',
          duration: 40,
          players: 'single',
          rating: 4.9,
          playCount: 11200,
          isNew: true,
          thumbnail: '💻',
          rewards: { xp: 250, gems: 50 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        },
        {
          id: 'geography-explorer',
          title: 'Geography Explorer',
          description: 'Explore the world, discover countries, and master geography through virtual expeditions!',
          category: 'geography',
          difficulty: 'easy',
          duration: 18,
          players: 'multiplayer',
          rating: 4.5,
          playCount: 9840,
          isNew: true,
          thumbnail: '🌍',
          rewards: { xp: 130, gems: 28 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        },
        {
          id: 'brain-training',
          title: 'Brain Training Gym',
          description: 'Exercise your mind with cognitive challenges that boost memory, attention, and problem-solving!',
          category: 'memory',
          difficulty: 'medium',
          duration: 15,
          players: 'single',
          rating: 4.8,
          playCount: 13570,
          isNew: true,
          thumbnail: '🧠',
          rewards: { xp: 140, gems: 30 },
          bestScore: 0,
          isCompleted: false,
          lastPlayed: null
        }
      ]

      const responseData = { games: engagingGames }
      
      // Cache the response for 10 minutes
      apiCache.set(cacheKey, responseData, 10)
      console.log('✅ [LEARNING-GAMES-API] Data cached')

      return NextResponse.json(responseData)
    }

    // Process games to match frontend interface
    const processedGames = games?.map((game: any) => {
      const userSessions = game.game_sessions?.filter((session: any) => 
        session.status === 'completed'
      ) || []
      
      const bestScore = userSessions.length > 0 
        ? Math.max(...userSessions.map((s: any) => s.current_score || 0))
        : 0

      // Map database fields to frontend interface
      return {
        id: game.id,
        title: game.title,
        description: game.description,
        category: game.subject.toLowerCase(),
        difficulty: game.difficulty_level <= 2 ? 'easy' : 
                   game.difficulty_level <= 4 ? 'medium' : 'hard',
        duration: game.estimated_duration_minutes || 10,
        players: 'single',
        rating: game.average_score ? (game.average_score / 20) : 4.5,
        playCount: game.total_plays || 0,
        isNew: game.created_at && 
               new Date(game.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        thumbnail: game.thumbnail_url || '🎮',
        rewards: {
          xp: game.xp_reward || 10,
          gems: game.gem_reward || 2
        },
        bestScore,
        isCompleted: userSessions.length > 0,
        lastPlayed: userSessions.length > 0 
          ? userSessions[userSessions.length - 1].completed_at
          : null
      }
    }) || []

    const responseData = { games: processedGames }

    // Cache the response for 10 minutes
    apiCache.set(cacheKey, responseData, 10)
    console.log('✅ [LEARNING-GAMES-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Learning games API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
