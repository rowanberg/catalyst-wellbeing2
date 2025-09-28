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

    // Get custom quests created by this teacher
    const { data: quests, error: questsError } = await supabase
      .from('custom_quests')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (questsError) {
      console.error('Error fetching custom quests:', questsError)
      return NextResponse.json({ error: 'Failed to fetch quests' }, { status: 500 })
    }

    return NextResponse.json({ quests: quests || [] })

  } catch (error) {
    console.error('Unexpected error in custom quests API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { title, description, category, difficulty, xpReward, gemReward, requirements, timeLimit } = await request.json()

    if (!title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 })
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

    // Create the quest
    const { data: quest, error: createError } = await supabase
      .from('custom_quests')
      .insert({
        title: title.trim(),
        description: description.trim(),
        category: category || 'academic',
        difficulty: difficulty || 'medium',
        xp_reward: xpReward || 50,
        gem_reward: gemReward || 10,
        requirements: requirements || [],
        time_limit: timeLimit || 7,
        created_by: user.id,
        school_id: profile.school_id,
        is_active: true
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating quest:', createError)
      return NextResponse.json({ error: 'Failed to create quest' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'Quest created successfully',
      questId: quest.id
    })

  } catch (error) {
    console.error('Unexpected error in create quest API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
