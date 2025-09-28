import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
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

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Fetch today's habits
    const { data: todayData } = await supabase
      .from('habit_tracker')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()

    // Fetch last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const { data: weekData } = await supabase
      .from('habit_tracker')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })

    return NextResponse.json({
      todayHabits: todayData ? {
        date: todayData.date,
        sleep_hours: todayData.sleep_hours || 0,
        water_glasses: todayData.water_glasses || 0
      } : {
        date: today,
        sleep_hours: 0,
        water_glasses: 0
      },
      weeklyData: weekData || []
    })

  } catch (error) {
    console.error('Habits GET API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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

    const { sleep_hours, water_glasses } = await request.json()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Update or insert habit data
    const { data: habitData, error: habitError } = await supabase
      .from('habit_tracker')
      .upsert({
        user_id: user.id,
        date: today,
        sleep_hours: sleep_hours || 0,
        water_glasses: water_glasses || 0,
      })
      .select()
      .single()

    if (habitError) {
      console.error('Error updating habits:', habitError)
      return NextResponse.json({ error: habitError.message }, { status: 400 })
    }

    // Update profile XP and gems
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, gems')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      const newXp = (profile.xp || 0) + 5
      const newGems = (profile.gems || 0) + 1
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
      habit_id: habitData.id,
      xpGained: 5,
      gemsGained: 1
    })

  } catch (error) {
    console.error('Habits POST API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
