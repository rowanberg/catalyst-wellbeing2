import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
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

    // Parse query parameters
    const timeRange = searchParams.get('time_range') || '7d'
    
    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Get students in teacher's school
    const { data: students, error: studentsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, grade_level, class_name')
      .eq('role', 'student')
      .eq('school_id', profile.school_id)

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    const studentIds = students?.map(s => s.id) || []

    // Get mood data for the time period
    const { data: moodData, error: moodError } = await supabase
      .from('student_moods')
      .select('student_id, mood_emoji, created_at')
      .in('student_id', studentIds)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (moodError) {
      console.error('Error fetching mood data:', moodError)
    }

    // Get help requests for context
    const { data: helpRequests, error: helpError } = await supabase
      .from('help_requests')
      .select('student_id, urgency_level, created_at')
      .in('student_id', studentIds)
      .gte('created_at', startDate.toISOString())

    if (helpError) {
      console.error('Error fetching help requests:', helpError)
    }

    // Calculate wellbeing metrics
    const moodScores = {
      '😊': 9, '😄': 10, '😌': 7, '😢': 3, '😠': 2, '😰': 4,
      'happy': 9, 'excited': 10, 'calm': 7, 'sad': 3, 'angry': 2, 'anxious': 4
    }

    const negativeMoods = ['😢', '😠', '😰', 'sad', 'angry', 'anxious']
    
    // Calculate class metrics
    const totalMoods = moodData?.length || 0
    const moodDistribution = {
      happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0
    }

    let totalScore = 0
    let scoreCount = 0

    moodData?.forEach(mood => {
      const score = moodScores[mood.mood_emoji as keyof typeof moodScores] || 5
      totalScore += score
      scoreCount++

      // Count mood distribution
      const moodType = mood.mood_emoji.toLowerCase()
      if (moodType.includes('😊') || moodType === 'happy') moodDistribution.happy++
      else if (moodType.includes('😄') || moodType === 'excited') moodDistribution.excited++
      else if (moodType.includes('😌') || moodType === 'calm') moodDistribution.calm++
      else if (moodType.includes('😢') || moodType === 'sad') moodDistribution.sad++
      else if (moodType.includes('😠') || moodType === 'angry') moodDistribution.angry++
      else if (moodType.includes('😰') || moodType === 'anxious') moodDistribution.anxious++
    })

    const classAverage = scoreCount > 0 ? totalScore / scoreCount : 7.0
    
    // Calculate trend (simplified - compare first and second half of period)
    const midPoint = new Date(startDate.getTime() + ((now.getTime() - startDate.getTime()) / 2))
    const recentMoods = moodData?.filter(m => new Date(m.created_at) >= midPoint) || []
    const olderMoods = moodData?.filter(m => new Date(m.created_at) < midPoint) || []
    
    const recentAvg = recentMoods.length > 0 
      ? recentMoods.reduce((sum: number, m: any) => sum + (moodScores[m.mood_emoji as keyof typeof moodScores] || 5), 0) / recentMoods.length
      : classAverage
    const olderAvg = olderMoods.length > 0
      ? olderMoods.reduce((sum: number, m: any) => sum + (moodScores[m.mood_emoji as keyof typeof moodScores] || 5), 0) / olderMoods.length
      : classAverage

    const trendPercentage = olderAvg > 0 ? Math.abs(((recentAvg - olderAvg) / olderAvg) * 100) : 0
    const trendDirection = recentAvg > olderAvg ? 'up' : recentAvg < olderAvg ? 'down' : 'stable'

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const negativeMoodCount = moodData?.filter(m => negativeMoods.includes(m.mood_emoji)).length || 0
    const negativeMoodPercentage = totalMoods > 0 ? (negativeMoodCount / totalMoods) * 100 : 0

    if (classAverage < 5 || negativeMoodPercentage > 40) riskLevel = 'high'
    else if (classAverage < 6.5 || negativeMoodPercentage > 25) riskLevel = 'medium'

    // Generate intervention suggestions
    const interventionSuggestions: string[] = []
    if (riskLevel === 'high') {
      interventionSuggestions.push(
        "Consider implementing daily check-ins with students",
        "Schedule a class discussion about stress management",
        "Introduce mindfulness activities during transitions"
      )
    } else if (riskLevel === 'medium') {
      interventionSuggestions.push(
        "Try incorporating more movement breaks",
        "Consider peer support activities",
        "Monitor individual students showing concerning patterns"
      )
    } else {
      interventionSuggestions.push(
        "Maintain current positive classroom environment",
        "Continue regular wellbeing check-ins",
        "Celebrate class achievements and positive moments"
      )
    }

    // Generate student insights
    const studentInsights = students?.map(student => {
      const studentMoods = moodData?.filter(m => m.student_id === student.id) || []
      const studentHelp = helpRequests?.filter(hr => hr.student_id === student.id) || []
      
      const recentMoods = studentMoods.slice(0, 5).map(m => m.mood_emoji)
      const studentScore = studentMoods.length > 0
        ? studentMoods.reduce((sum: number, m: any) => sum + (moodScores[m.mood_emoji as keyof typeof moodScores] || 5), 0) / studentMoods.length
        : 7.0

      const negativeMoodCount = studentMoods.filter(m => negativeMoods.includes(m.mood_emoji)).length
      const urgentHelpCount = studentHelp.filter(hr => hr.urgency_level === 'high').length

      const concerns: string[] = []
      const strengths: string[] = []
      
      if (negativeMoodCount >= 3) concerns.push('Frequent negative mood indicators')
      if (urgentHelpCount > 0) concerns.push('Recent urgent help requests')
      if (studentScore < 5) concerns.push('Low wellbeing score')
      
      if (studentScore >= 8) strengths.push('Consistently positive mood')
      if (studentMoods.length > 10) strengths.push('Regular engagement with wellbeing tracking')
      if (negativeMoodCount === 0) strengths.push('No negative mood indicators')

      let studentRiskLevel: 'low' | 'medium' | 'high' = 'low'
      if (studentScore < 5 || concerns.length >= 2) studentRiskLevel = 'high'
      else if (studentScore < 6.5 || concerns.length >= 1) studentRiskLevel = 'medium'

      return {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        grade: student.grade_level || 'N/A',
        wellbeingScore: Math.round(studentScore * 10) / 10,
        recentMoods,
        riskLevel: studentRiskLevel,
        concerns,
        strengths,
        lastCheckIn: studentMoods[0]?.created_at || new Date().toISOString()
      }
    }).filter(student => student.riskLevel === 'high' || student.concerns.length > 0)
      .sort((a: any, b: any) => {
        const riskOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
      }) || []

    const metrics = {
      classAverage: Math.round(classAverage * 10) / 10,
      totalResponses: totalMoods,
      trendDirection,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      moodDistribution,
      riskLevel,
      interventionSuggestions
    }

    return NextResponse.json({
      metrics,
      studentInsights: studentInsights.slice(0, 20) // Limit to top 20 students needing attention
    })

  } catch (error: any) {
    console.error('Unexpected error in wellbeing analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
