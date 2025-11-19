import { NextRequest, NextResponse } from 'next/server'
import { authenticateStudent, isAuthError } from '@/lib/auth/api-auth'

// Helper function to calculate mood score
function calculateMoodScore(mood: string): number {
  const scores: Record<string, number> = {
    happy: 8,
    excited: 10,
    calm: 7,
    sad: 3,
    angry: 2,
    anxious: 4
  }
  return scores[mood as keyof typeof scores] || 5
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateStudent(request)
    
    if (isAuthError(auth)) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { supabase, userId } = auth
    const { mood, mood_score, notes } = await request.json()
    
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
    
    // Get today's date in user's timezone (assuming local timezone for now)
    // In production, you might want to store user timezone in profile
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    
    console.log('🕐 Checking mood for date:', today, 'Current time:', now.toISOString())

    // Check if mood already exists for today
    const { data: existingMood, error: checkError } = await supabase
      .from('mood_tracking')
      .select('*')
      .eq('user_id', userId)
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
          .eq('user_id', userId)

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
        user_id: userId,
        mood,
        mood_emoji: moodEmojis[mood as keyof typeof moodEmojis] || '😊',
        date: today
      })
      .select()
      .single()
      
    // Also insert into mood_history for the complete history
    const { error: historyError } = await supabase
      .from('mood_history')
      .insert({
        user_id: userId,
        mood,
        mood_emoji: moodEmoji,
        mood_score: mood_score || calculateMoodScore(mood),
        notes: notes || null,
        recorded_date: today,
        recorded_time: new Date().toISOString().split('T')[1].split('.')[0]
      })
      
    if (historyError) {
      console.error('Error saving to mood history:', historyError)
      // Continue anyway as we've saved to the primary table
    }

    if (moodError) {
      console.error('Error saving mood to mood_tracking:', moodError)
      // Fallback: save to profile only
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ current_mood: mood })
        .eq('user_id', userId)

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
      .eq('user_id', userId)

    if (profileError) {
      console.error('Error updating profile mood:', profileError)
    }

    return NextResponse.json({
      success: true,
      mood: moodEntry,
      isLocked: true,
      lockedDate: today,
      message: 'Mood saved successfully! Your mood is now locked for today.'
    })

  } catch (error: any) {
    console.error('Mood API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
