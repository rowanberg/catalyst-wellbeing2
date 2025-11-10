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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1
    const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 100
    
    // Calculate date range
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Fetch mood history data using the function we created
    const { data: moodHistory, error: moodError } = await supabase
      .rpc('get_user_mood_history', {
        user_uuid: user.id,
        days_limit: days,
        page_size: pageSize,
        page_number: page
      })
    
    if (moodError) {
      console.error('Error fetching mood history:', moodError)
      
      // Fallback to direct query if RPC fails
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('mood_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('recorded_date', startDate.toISOString().split('T')[0])
        .order('recorded_date', { ascending: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
      
      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to fetch mood history' }, { status: 500 })
      }
      
      return NextResponse.json({
        success: true,
        moodHistory: fallbackData || [],
        page,
        pageSize,
        days
      })
    }

    // Get the total count for pagination info
    const { count, error: countError } = await supabase
      .from('mood_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('recorded_date', startDate.toISOString().split('T')[0])
    
    return NextResponse.json({
      success: true,
      moodHistory: moodHistory || [],
      page,
      pageSize,
      days,
      totalCount: count || 0,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    })

  } catch (error: any) {
    console.error('Mood history API error:', error)
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

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
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
    const mood_emoji = moodEmojis[mood as keyof typeof moodEmojis] || "😊"
    
    // Validate required fields
    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 })
    }
    
    if (!['happy', 'excited', 'calm', 'sad', 'angry', 'anxious'].includes(mood)) {
      return NextResponse.json({ error: 'Invalid mood value' }, { status: 400 })
    }

    // Insert directly into mood_history
    const { data: moodEntry, error: moodError } = await supabase
      .from('mood_history')
      .insert({
        user_id: user.id,
        mood,
        mood_emoji,
        mood_score: mood_score || null,
        notes: notes || null,
        recorded_date: new Date().toISOString().split('T')[0],
        recorded_time: new Date().toISOString().split('T')[1].split('.')[0]
      })
      .select()
      .single()

    if (moodError) {
      console.error('Error saving mood to mood_history:', moodError)
      return NextResponse.json(
        { error: 'Failed to save mood' },
        { status: 500 }
      )
    }

    // Also update the current mood in profiles table for compatibility
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ current_mood: mood })
      .eq('user_id', user.id)

    if (profileError) {
      console.error('Error updating profile mood:', profileError)
    }

    return NextResponse.json({
      success: true,
      moodEntry,
      message: 'Mood recorded successfully!'
    })

  } catch (error: any) {
    console.error('Mood history API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
