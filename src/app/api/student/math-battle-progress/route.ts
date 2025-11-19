import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const body = await request.json()
    const { level_id, completed, stars, xp_earned, gems_earned } = body
    // Always use the authenticated user's id for safety
    const student_id = userId

    // Upsert progress record
    const { data, error } = await supabase
      .from('math_battle_progress')
      .upsert({
        student_id,
        level_id,
        completed,
        stars,
        xp_earned,
        gems_earned,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'student_id,level_id'
      })

    if (error) {
      console.error('Database error:', error)
      
      // Check if it's a table doesn't exist error
      if (error.message?.includes('relation "math_battle_progress" does not exist')) {
        return NextResponse.json({ 
          error: 'Math Battle Arena table not found. Please run the database setup script.',
          details: 'Run the SQL script in database/create_math_battle_table.sql in Supabase SQL Editor'
        }, { status: 500 })
      }
      
      return NextResponse.json({ error: 'Failed to save progress', details: error.message }, { status: 500 })
    }

    // Update student's total XP and gems in profiles table
    if (completed) {
      // First get current values
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_xp, total_gems')
        .eq('id', student_id)
        .single()

      const currentXp = currentProfile?.total_xp || 0
      const currentGems = currentProfile?.total_gems || 0

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_xp: currentXp + xp_earned,
          total_gems: currentGems + gems_earned
        })
        .eq('id', student_id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    // Always use auth user id
    const student_id = userId

    // Get progress for all levels
    const { data, error } = await supabase
      .from('math_battle_progress')
      .select('*')
      .eq('student_id', student_id)
      .order('level_id')

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to load progress' }, { status: 500 })
    }

    return NextResponse.json({ levels: data || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
