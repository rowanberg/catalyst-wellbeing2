import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { cycles_completed } = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!cycles_completed || cycles_completed < 1) {
      return NextResponse.json({ error: 'Invalid cycles completed' }, { status: 400 })
    }

    // Insert breathing session record
    const { data: sessionData, error: sessionError } = await supabase
      .from('breathing_sessions')
      .insert({
        user_id: user.id,
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
      .eq('user_id', user.id)
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
        .eq('user_id', user.id)

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
