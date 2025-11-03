import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client for user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get user profile to check role and school
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!['teacher', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const rarity = searchParams.get('rarity')
    const active = searchParams.get('active')

    // Check if quest_badges table exists, if not return empty badges
    const { data: badges, error } = await supabaseAdmin
      .from('quest_badges')
      .select('*')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false })

    if (error) {
      // Return empty badges array if table doesn't exist
      return NextResponse.json({ 
        badges: [], 
        totalAwarded: 0,
        message: 'Quest system not yet configured for this school'
      })
    }

    // Apply filters if provided
    let filteredBadges = badges || []
    
    if (category && category !== 'all') {
      filteredBadges = filteredBadges.filter(badge => badge.category === category)
    }
    if (rarity && rarity !== 'all') {
      filteredBadges = filteredBadges.filter(badge => badge.rarity === rarity)
    }
    if (active !== null) {
      filteredBadges = filteredBadges.filter(badge => badge.is_active === (active === 'true'))
    }

    return NextResponse.json({ 
      badges: filteredBadges, 
      totalAwarded: 0 // Will be calculated when badge_awards table is implemented
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {

    // Get user from session
    const authHeader = request.headers.get('authorization')
    const sessionToken = request.cookies.get('sb-access-token')?.value

    if (!authHeader && !sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create Supabase client for user session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get user session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Get user profile to check role and school
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    if (!['teacher', 'admin'].includes(profile.role)) {
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
      points: Math.max(1, parseInt(body.points, 10) || 10),
      prerequisites: body.prerequisites || [],
      is_stackable: body.isStackable || false,
      max_stack: body.maxStack || 1,
      valid_until: body.validUntil ? new Date(body.validUntil).toISOString() : null,
      auto_award: body.autoAward || false,
      trigger_conditions: body.triggerConditions || {},
      is_active: body.isActive !== false
    }

    const { data: badge, error } = await supabaseAdmin
      .from('quest_badges')
      .insert(badgeData)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 })
    }

    return NextResponse.json({ badge }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
