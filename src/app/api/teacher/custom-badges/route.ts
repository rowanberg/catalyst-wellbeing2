import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Get custom badges created by this teacher
    const { data: badges, error: badgesError } = await supabase
      .from('custom_badges')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (badgesError) {
      console.error('Error fetching custom badges:', badgesError)
      return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
    }

    return NextResponse.json({ badges: badges || [] })

  } catch (error) {
    console.error('Unexpected error in custom badges API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { name, description, icon, color, criteria, rarity } = await request.json()

    if (!name?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Name and description are required' }, { status: 400 })
    }
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Create the badge
    const { data: badge, error: createError } = await supabase
      .from('custom_badges')
      .insert({
        name: name.trim(),
        description: description.trim(),
        icon: icon || '🏆',
        color: color || '#3B82F6',
        criteria: criteria || [],
        rarity: rarity || 'common',
        created_by: user.id,
        school_id: profile.school_id,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating badge:', createError)
      return NextResponse.json({ error: 'Failed to create badge' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Badge created successfully',
      badgeId: badge.id
    })

  } catch (error) {
    console.error('Unexpected error in create badge API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
