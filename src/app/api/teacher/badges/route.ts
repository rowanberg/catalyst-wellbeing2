import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const rarity = searchParams.get('rarity')
    const active = searchParams.get('active')

    let query = supabase
      .from('quest_badges')
      .select(`
        *,
        badge_awards(
          id,
          student_id,
          awarded_at,
          stack_count
        )
      `)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }
    if (rarity && rarity !== 'all') {
      query = query.eq('rarity', rarity)
    }
    if (active !== null) {
      query = query.eq('is_active', active === 'true')
    }

    const { data: badges, error } = await query

    if (error) {
      console.error('Error fetching badges:', error)
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
    }

    const totalAwarded = badges?.reduce((sum: number, badge: any) => {
      return sum + (badge.badge_awards?.reduce((awardSum: number, award: any) => awardSum + (award.stack_count || 1), 0) || 0)
    }, 0) || 0

    const processedBadges = badges?.map((badge: any) => ({
      ...badge,
      earnedBy: badge.badge_awards?.map((award: any) => award.student_id) || [],
      badge_awards: undefined
    }))

    return NextResponse.json({ badges: processedBadges, totalAwarded })
  } catch (error) {
    console.error('Error in GET /api/teacher/badges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    if (!body.name || !body.description) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }

    const badgeData = {
      school_id: profile.school_id,
      teacher_id: user.id,
      name: body.name,
      description: body.description,
      icon: body.icon || '🏆',
      color: body.color || '#3B82F6',
      criteria: body.criteria || [],
      rarity: body.rarity || 'common',
      category: body.category || 'achievement',
      points: Math.max(1, parseInt(body.points) || 10),
      prerequisites: body.prerequisites || [],
      is_stackable: body.isStackable || false,
      max_stack: body.maxStack || 1,
      valid_until: body.validUntil ? new Date(body.validUntil).toISOString() : null,
      auto_award: body.autoAward || false,
      trigger_conditions: body.triggerConditions || {},
      is_active: body.isActive !== false
    }

    const { data: badge, error } = await supabase
      .from('quest_badges')
      .insert(badgeData)
      .select()
      .single()

    if (error) {
      console.error('Error creating badge:', error)
      return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 })
    }

    return NextResponse.json({ badge }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/teacher/badges:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
