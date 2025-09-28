import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      chapterId, 
      spellsCompleted, 
      totalSpells, 
      xpEarned, 
      gemsEarned, 
      timeSpent,
      difficulty,
      category 
    } = body

    // Validate required fields
    if (!chapterId || spellsCompleted === undefined || !totalSpells) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if progress already exists
    const { data: existingProgress } = await supabase
      .from('word_wizard_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('chapter_id', chapterId)
      .single()

    const progressData = {
      user_id: user.id,
      chapter_id: chapterId,
      spells_completed: spellsCompleted,
      total_spells: totalSpells,
      xp_earned: xpEarned || 0,
      gems_earned: gemsEarned || 0,
      time_spent: timeSpent || 0,
      difficulty: difficulty || 'medium',
      category: category || 'general',
      completed_at: spellsCompleted === totalSpells ? new Date().toISOString() : null,
      is_completed: spellsCompleted === totalSpells,
      updated_at: new Date().toISOString()
    }

    let result
    if (existingProgress) {
      // Update existing progress
      const { data, error } = await supabase
        .from('word_wizard_progress')
        .update(progressData)
        .eq('user_id', user.id)
        .eq('chapter_id', chapterId)
        .select()
        .single()
      
      result = { data, error }
    } else {
      // Create new progress record
      const newProgressData = {
        ...progressData,
        created_at: new Date().toISOString()
      }
      const { data, error } = await supabase
        .from('word_wizard_progress')
        .insert(newProgressData)
        .select()
        .single()
      
      result = { data, error }
    }

    if (result.error) {
      console.error('Database error:', result.error)
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
    }

    // Update student points if chapter completed
    if (spellsCompleted === totalSpells && gemsEarned > 0) {
      const { error: pointsError } = await supabase.rpc('add_student_points', {
        student_id: user.id,
        points_to_add: gemsEarned,
        source: 'word_wizard_academy',
        description: `Completed ${category} chapter - ${spellsCompleted} spells`
      })

      if (pointsError) {
        console.error('Points update error:', pointsError)
        // Don't fail the request if points update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      progress: result.data,
      pointsAdded: spellsCompleted === totalSpells ? gemsEarned : 0
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all progress for the user
    const { data: progress, error } = await supabase
      .from('word_wizard_progress')
      .select('*')
      .eq('user_id', user.id)
      .order('chapter_id', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // Get user's current points
    const { data: profile } = await supabase
      .from('profiles')
      .select('points')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ 
      success: true, 
      progress: progress || [],
      currentPoints: profile?.points || 0
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
