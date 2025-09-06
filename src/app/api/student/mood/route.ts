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
    const { mood } = await request.json()
    
    // Map mood to emoji
    const moodEmojis = {
      happy: "😊",
      excited: "🤩", 
      calm: "😌",
      sad: "😢",
      angry: "😠",
      anxious: "😰"
    }
    const moodEmoji = moodEmojis[mood as keyof typeof moodEmojis] || "😊"
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Upsert mood tracking
    const { data, error } = await supabase
      .from('mood_tracking')
      .upsert({
        user_id: user.id,
        mood,
        mood_emoji: moodEmoji,
        date: today
      }, {
        onConflict: 'user_id,date'
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update current mood in profile
    await supabase
      .from('profiles')
      .update({ current_mood: mood })
      .eq('user_id', user.id)

    return NextResponse.json({ success: true, data })

  } catch (error) {
    console.error('Mood API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
