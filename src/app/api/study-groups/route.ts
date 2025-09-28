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

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('school_id') || profile.school_id
    const subject = searchParams.get('subject')
    const difficulty = searchParams.get('difficulty')

    // Check cache first
    const cacheKey = createCacheKey('study-groups', { 
      schoolId, 
      subject, 
      difficulty,
      userId: profile.id 
    })
    const cachedData = apiCache.get(cacheKey)
    if (cachedData) {
      console.log('✅ [STUDY-GROUPS-API] Returning cached data')
      return NextResponse.json(cachedData)
    }

    // Build query with proper joins
    let query = supabase
      .from('study_groups')
      .select(`
        *,
        creator_info:profiles!study_groups_created_by_fkey(id, first_name, last_name, avatar_url, grade_level),
        study_group_members(count, user_id, role)
      `)
      .eq('school_id', schoolId)
      .eq('status', 'active')

    // Add filters
    if (subject && subject !== 'All') {
      query = query.eq('subject', subject)
    }
    if (difficulty && difficulty !== 'All') {
      query = query.eq('difficulty', difficulty.toLowerCase())
    }

    const { data: groups, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching study groups:', error)
      return NextResponse.json({ error: 'Failed to fetch study groups' }, { status: 500 })
    }

    // Process groups to add computed fields
    const processedGroups = groups?.map((group: any) => {
      const memberCount = Array.isArray(group.study_group_members) ? group.study_group_members.length : 0
      const userMembership = Array.isArray(group.study_group_members) 
        ? group.study_group_members.find((m: any) => m.user_id === profile.id)
        : null

      return {
        ...group,
        member_count: memberCount,
        is_joined: !!userMembership,
        user_role: userMembership?.role || null,
        creator_info: group.creator_info
      }
    }) || []

    const responseData = { groups: processedGroups }

    // Cache the response for 3 minutes
    apiCache.set(cacheKey, responseData, 3)
    console.log('✅ [STUDY-GROUPS-API] Data cached')

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Study groups API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Generate unique group code
    const generateGroupCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let result = ''
      for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return result
    }

    const groupCode = generateGroupCode()

    // Create the study group
    const { data: newGroup, error } = await supabase
      .from('study_groups')
      .insert({
        school_id: profile.school_id,
        name: body.name,
        subject: body.subject,
        description: body.description,
        max_members: body.max_members || 20,
        is_private: body.is_private || false,
        difficulty: body.difficulty || 'beginner',
        tags: body.tags || [],
        grade_levels: body.grade_levels || [],
        created_by: profile.id,
        group_code: groupCode
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating study group:', error)
      return NextResponse.json({ error: 'Failed to create study group' }, { status: 500 })
    }

    // Add creator as a member with creator role
    const { error: memberError } = await supabase
      .from('study_group_members')
      .insert({
        group_id: newGroup.id,
        user_id: profile.id,
        role: 'creator'
      })

    if (memberError) {
      console.error('Error adding creator as member:', memberError)
      // Don't fail the request, just log the error
    }

    // Clear cache
    apiCache.clear()

    return NextResponse.json({ 
      message: 'Study group created successfully', 
      group: newGroup 
    }, { status: 201 })
  } catch (error) {
    console.error('Create study group error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
