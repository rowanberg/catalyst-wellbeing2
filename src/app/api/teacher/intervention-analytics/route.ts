import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to verify teacher role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    // Get students in teacher's school
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'student')
      .eq('school_id', profile.school_id)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const studentIds = students?.map(s => s.id) || []

    // Get recent mood data (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: moodData, error: moodError } = await supabase
      .from('student_moods')
      .select('student_id, mood_emoji, created_at')
      .in('student_id', studentIds)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (moodError) {
      console.error('Error fetching mood data:', moodError)
    }

    // Get recent help requests
    const { data: helpRequests, error: helpError } = await supabase
      .from('help_requests')
      .select('student_id, urgency_level, created_at')
      .in('student_id', studentIds)
      .gte('created_at', yesterday.toISOString())

    if (helpError) {
      console.error('Error fetching help requests:', helpError)
    }

    // Get recent intervention activities
    const { data: recentInterventions, error: interventionError } = await supabase
      .from('intervention_implementations')
      .select('activity_id, created_at')
      .eq('teacher_id', user.id)
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (interventionError) {
      console.error('Error fetching recent interventions:', interventionError)
    }

    // Calculate analytics
    const moodScores = {
      '😊': 8, '😄': 9, '😌': 7, '😢': 3, '😠': 2, '😰': 4,
      'happy': 8, 'excited': 9, 'calm': 7, 'sad': 3, 'angry': 2, 'anxious': 4
    }

    const negativeMoods = ['😢', '😠', '😰', 'sad', 'angry', 'anxious']
    const positiveMoods = ['😊', '😄', '😌', 'happy', 'excited', 'calm']

    // Calculate average wellbeing
    let totalScore = 0
    let scoreCount = 0
    const moodCounts: { [key: string]: number } = {}

    moodData?.forEach(mood => {
      const score = moodScores[mood.mood_emoji as keyof typeof moodScores] || 5
      totalScore += score
      scoreCount++
      
      moodCounts[mood.mood_emoji] = (moodCounts[mood.mood_emoji] || 0) + 1
    })

    const averageWellbeing = scoreCount > 0 ? totalScore / scoreCount : 7.0

    // Determine dominant moods
    const sortedMoods = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood)

    // Calculate risk level
    const negativeMoodCount = moodData?.filter(m => negativeMoods.includes(m.mood_emoji)).length || 0
    const totalMoods = moodData?.length || 0
    const negativeMoodPercentage = totalMoods > 0 ? (negativeMoodCount / totalMoods) * 100 : 0
    const urgentHelpRequests = helpRequests?.filter(hr => hr.urgency_level === 'high').length || 0

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    if (averageWellbeing < 4 || negativeMoodPercentage > 50 || urgentHelpRequests > 2) {
      riskLevel = 'high'
    } else if (averageWellbeing < 6 || negativeMoodPercentage > 30 || urgentHelpRequests > 0) {
      riskLevel = 'medium'
    }

    // Identify stress indicators
    const stressIndicators = []
    if (negativeMoodPercentage > 40) stressIndicators.push('High negative mood frequency')
    if (urgentHelpRequests > 0) stressIndicators.push('Urgent help requests')
    if (averageWellbeing < 5) stressIndicators.push('Low wellbeing scores')
    
    // Time of day context
    const currentHour = new Date().getHours()
    let timeOfDay = 'morning'
    if (currentHour >= 12 && currentHour < 17) timeOfDay = 'afternoon'
    else if (currentHour >= 17) timeOfDay = 'evening'

    // Recent activities
    const recentActivities = recentInterventions?.map(ri => ri.activity_id) || []

    const analytics = {
      averageWellbeing: Math.round(averageWellbeing * 10) / 10,
      riskLevel,
      dominantMoods: sortedMoods,
      stressIndicators,
      timeOfDay,
      recentActivities
    }

    return NextResponse.json({ analytics })

  } catch (error) {
    console.error('Unexpected error in intervention analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
