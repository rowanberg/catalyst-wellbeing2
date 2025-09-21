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

    const { sessionCompleted } = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Check if user has already completed affirmations today
    const { data: existingEntry } = await supabase
      .from('affirmation_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    let sessionsCompleted = existingEntry?.sessions_completed || 0
    
    if (sessionCompleted) {
      sessionsCompleted += 1
      
      // Update or create affirmation session record
      const { error: upsertError } = await supabase
        .from('affirmation_sessions')
        .upsert({
          user_id: user.id,
          date: today,
          sessions_completed: sessionsCompleted,
          last_session_at: new Date().toISOString()
        })

      if (upsertError) {
        return NextResponse.json({ error: upsertError.message }, { status: 400 })
      }

      // Award XP and gems for each session
      const { data: profile } = await supabase
        .from('profiles')
        .select('xp, gems')
        .eq('user_id', user.id)
        .single()

      if (profile) {
        const xpReward = 15
        const gemsReward = 3
        const newXp = (profile.xp || 0) + xpReward
        const newGems = (profile.gems || 0) + gemsReward
        const newLevel = Math.floor(newXp / 100) + 1

        await supabase
          .from('profiles')
          .update({
            xp: newXp,
            gems: newGems,
            level: newLevel
          })
          .eq('user_id', user.id)

        return NextResponse.json({ 
          success: true, 
          sessionsCompleted,
          xpGained: xpReward,
          gemsGained: gemsReward
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      sessionsCompleted,
      xpGained: 0,
      gemsGained: 0
    })

  } catch (error) {
    console.error('Affirmations API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Get today's affirmation sessions
    const { data: todaySession } = await supabase
      .from('affirmation_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    return NextResponse.json({
      sessionsCompleted: todaySession?.sessions_completed || 0,
      lastSessionAt: todaySession?.last_session_at || null
    })

  } catch (error) {
    console.error('Affirmations GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
