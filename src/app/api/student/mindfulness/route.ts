import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const { sessionType, durationSeconds } = await request.json()
    
    // Create mindfulness session
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .insert({
        user_id: userId,
        session_type: sessionType,
        duration_seconds: durationSeconds || 0,
        completed: true
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Award small XP for mindfulness
    const xpEarned = 5
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp')
      .eq('user_id', userId)
      .single()

    if (profile) {
      const newXp = (profile.xp || 0) + xpEarned
      const newLevel = Math.floor(newXp / 100) + 1

      await supabase
        .from('profiles')
        .update({
          xp: newXp,
          level: newLevel
        })
        .eq('user_id', userId)
    }

    return NextResponse.json({ 
      success: true, 
      data,
      xpGained: xpEarned
    })

  } catch (error: any) {
    console.error('Mindfulness API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
