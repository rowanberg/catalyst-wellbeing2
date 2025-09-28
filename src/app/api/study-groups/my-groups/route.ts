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
    const cacheKey = createCacheKey('my-study-groups', { userId: profile.id })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [MY-STUDY-GROUPS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Get user's groups through membership
    const { data: myGroups, error } = await supabase
      .from('study_group_members')
      .select(`
        role,
        joined_at,
        is_active,
        study_groups!inner(
          *,
          creator_info:profiles!study_groups_created_by_fkey(id, first_name, last_name, avatar_url, grade_level),
          study_group_members(count),
          study_group_sessions(id, title, scheduled_start, status)
        )
      `)
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .eq('study_groups.status', 'active')
      .order('joined_at', { ascending: false })

    if (error) {
      console.error('Error fetching user groups:', error)
      return NextResponse.json({ error: 'Failed to fetch your groups' }, { status: 500 })
    }

    // Process groups to add computed fields
    const processedGroups = myGroups?.map((membership: any) => {
      const group = membership.study_groups
      const memberCount = Array.isArray(group.study_group_members) ? group.study_group_members.length : 0
      
      // Find next session
      const upcomingSessions = group.study_group_sessions
        ?.filter((session: any) => new Date(session.scheduled_start) > new Date() && session.status === 'scheduled')
        ?.sort((a: any, b: any) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
      
      const nextSession = upcomingSessions?.[0]?.scheduled_start

      return {
        ...group,
        member_count: memberCount,
        is_joined: true,
        user_role: membership.role,
        next_session: nextSession,
        creator_info: group.creator_info,
        recent_activity: [], // Will be populated by separate query if needed
        upcoming_session: upcomingSessions?.[0] || null
      }
    }) || []

    const responseData = { groups: processedGroups }

    // Cache the response for 2 minutes
    apiCache.set(cacheKey, responseData, 2)
    console.log('✅ [MY-STUDY-GROUPS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('My study groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
