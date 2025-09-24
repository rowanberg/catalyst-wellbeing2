import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    const { sessionType, durationSeconds } = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create mindfulness session
    const { data, error } = await supabase
      .from('mindfulness_sessions')
      .insert({
        user_id: user.id,
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
      .eq('user_id', user.id)
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
        .eq('user_id', user.id)
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
