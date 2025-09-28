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
      .select('id, school_id, role')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Check cache first
    const cacheKey = createCacheKey('achievement-milestones', { userId: profile.id })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [MILESTONES-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // For now, return mock milestones since the database schema focuses on achievements
    // In a real implementation, milestones would be derived from achievement progress
    const mockMilestones = [
      {
        id: '1',
        title: 'Quest Completion',
        description: 'Complete daily quests',
        targetValue: 50,
        currentValue: 23, // Would be calculated from user's quest completion data
        category: 'academic',
        icon: '✅',
        color: 'blue',
        rewards: { xp: 500, gems: 100, achievement: 'Quest Master' },
        isCompleted: false
      },
      {
        id: '2',
        title: 'XP Milestone',
        description: 'Earn total XP points',
        targetValue: 5000,
        currentValue: 3250, // Would come from user's total XP
        category: 'general',
        icon: '⚡',
        color: 'yellow',
        rewards: { xp: 0, gems: 200 },
        isCompleted: false
      },
      {
        id: '3',
        title: 'Social Butterfly',
        description: 'Interact with classmates',
        targetValue: 25,
        currentValue: 25, // Would be calculated from social interactions
        category: 'social',
        icon: '🦋',
        color: 'green',
        rewards: { xp: 300, gems: 75, achievement: 'Social Star' },
        isCompleted: true
      }
    ]

    const responseData = { milestones: mockMilestones }

    // Cache the response for 3 minutes
    apiCache.set(cacheKey, responseData, 3)
    console.log('✅ [MILESTONES-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Milestones API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
