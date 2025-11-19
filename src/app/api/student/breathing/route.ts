import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const { cycles_completed } = await request.json()
    
    if (!cycles_completed || cycles_completed < 1) {
      return NextResponse.json({ error: 'Invalid cycles completed' }, { status: 400 })
    }

    // Insert breathing session record
    const { data: sessionData, error: sessionError } = await supabase
      .from('breathing_sessions')
      .insert({
        user_id: userId,
        cycles_completed: cycles_completed,
        session_type: '4-4-6'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error inserting breathing session:', sessionError)
      return NextResponse.json({ error: sessionError.message }, { status: 400 })
    }

    // Update profile XP and gems
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, gems')
      .eq('user_id', userId)
      .single()

    if (profile) {
      const newXp = (profile.xp || 0) + 10
      const newGems = (profile.gems || 0) + 2
      const newLevel = Math.floor(newXp / 100) + 1

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          xp: newXp,
          gems: newGems,
          level: newLevel
        })
        .eq('user_id', userId)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      session_id: sessionData.id,
      xpGained: 10,
      gemsGained: 2
    })

  } catch (error) {
    console.error('Breathing POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
