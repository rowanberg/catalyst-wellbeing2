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
          }
        }
      }
    )

    // Get user from session
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, current_mood, pet_name, pet_happiness')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 })
    }

    // Parallel fetch wellbeing data
    const [moodRes, mindfulnessRes, safetyRes] = await Promise.allSettled([
      // Today's mood
      supabase
        .from('mood_tracker')
        .select('mood, created_at')
        .eq('student_id', profile.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single(),
      
      // Mindfulness sessions
      supabase
        .from('mindfulness_sessions')
        .select('*')
        .eq('student_id', profile.id)
        .gte('created_at', new Date().toISOString().split('T')[0]),
      
      // Digital safety progress
      supabase
        .from('digital_safety_progress')
        .select('quiz_completed, pledge_signed')
        .eq('student_id', profile.id)
        .single()
    ])

    // Process results
    const todayMood = moodRes.status === 'fulfilled' ? moodRes.value.data : null
    const mindfulnessSessions = mindfulnessRes.status === 'fulfilled' ? mindfulnessRes.value.data || [] : []
    const safetyProgress = safetyRes.status === 'fulfilled' ? safetyRes.value.data : null

    // Calculate total mindfulness sessions
    const { count: totalSessions } = await supabase
      .from('mindfulness_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', profile.id)

    return NextResponse.json({
      mood: {
        current: todayMood?.mood || profile.current_mood || null,
        lockedDate: todayMood ? new Date().toISOString().split('T')[0] : null
      },
      pet: {
        name: profile.pet_name || 'Whiskers',
        happiness: profile.pet_happiness || 50
      },
      mindfulness: {
        sessionsToday: mindfulnessSessions.length,
        totalSessions: totalSessions || 0
      },
      safety: {
        quizCompleted: safetyProgress?.quiz_completed || false,
        pledgeSigned: safetyProgress?.pledge_signed || false
      }
    })

  } catch (error: any) {
    console.error('Error in /api/v2/student/wellbeing:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}
