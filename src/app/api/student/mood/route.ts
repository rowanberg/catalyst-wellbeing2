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

    // Get today's date in user's timezone (assuming local timezone for now)
    // In production, you might want to store user timezone in profile
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    console.log('🕐 Checking mood for date:', today, 'Current time:', now.toISOString())

    // Check if mood already exists for today
    const { data: existingMood, error: checkError } = await supabase
      .from('mood_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .single()
      
    console.log('🔍 Existing mood check:', { existingMood, checkError })

    // If table doesn't exist, create it first
    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, try to create it
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS mood_tracking (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            mood TEXT NOT NULL CHECK (mood IN ('happy', 'excited', 'calm', 'sad', 'angry', 'anxious')),
            mood_emoji TEXT NOT NULL,
            date DATE DEFAULT CURRENT_DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, date)
          );
          
          ALTER TABLE mood_tracking ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can manage their own mood tracking" ON mood_tracking;
          CREATE POLICY "Users can manage their own mood tracking" ON mood_tracking
            FOR ALL USING (user_id = auth.uid());
        `
      })
      
      if (createError) {
        console.error('Error creating mood_tracking table:', createError)
        // Fallback: just update profile current_mood
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ current_mood: mood })
          .eq('user_id', user.id)

        if (profileError) {
          console.error('Error updating profile mood:', profileError)
          return NextResponse.json(
            { error: 'Failed to save mood' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          mood: { mood, mood_emoji: moodEmojis[mood as keyof typeof moodEmojis] || '😊' },
          isLocked: false,
          message: 'Mood saved to profile successfully!'
        })
      }
    }

    if (existingMood) {
      return NextResponse.json(
        { error: 'Mood already set for today. You can only set your mood once per day.' },
        { status: 400 }
      )
    }

    // Try to insert new mood entry
    const { data: moodEntry, error: moodError } = await supabase
      .from('mood_tracking')
      .insert({
        user_id: user.id,
        mood,
        mood_emoji: moodEmojis[mood as keyof typeof moodEmojis] || '😊',
        date: today
      })
      .select()
      .single()

    if (moodError) {
      console.error('Error saving mood to mood_tracking:', moodError)
      // Fallback: save to profile only
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_mood: mood })
        .eq('user_id', user.id)

      if (profileError) {
        console.error('Error updating profile mood:', profileError)
        return NextResponse.json(
          { error: 'Failed to save mood' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        mood: { mood, mood_emoji: moodEmojis[mood as keyof typeof moodEmojis] || '😊' },
        isLocked: false,
        message: 'Mood saved to profile successfully!'
      })
    }

    // Update profile with current mood
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ current_mood: mood })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error updating profile mood:', profileError)
    }

    return NextResponse.json({
      success: true,
      mood: moodEntry,
      isLocked: true,
      message: 'Mood saved successfully! Your mood is now locked for today.'
    })

  } catch (error: any) {
    console.error('Mood API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
