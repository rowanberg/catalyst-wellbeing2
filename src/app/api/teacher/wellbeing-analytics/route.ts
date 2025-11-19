import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'teacher-wellbeing-analytics',
      },
    },
  }
)

// In-memory cache for wellbeing analytics (5 minutes TTL)
const wellbeingCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Step 1: Authenticate user
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Step 2: Get teacher profile and verify role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, school_id, first_name, last_name')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden - Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const timeRange = searchParams.get('time_range') || '7d'
    const classId = searchParams.get('class_id')
    
    console.log('Wellbeing analytics request:', { timeRange, classId })

    // Check cache first
    const cacheKey = `wellbeing-analytics-${user.id}-${timeRange}-${classId}`
    const cached = wellbeingCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      const cacheAge = Math.round((Date.now() - cached.timestamp) / 1000)
      const response = NextResponse.json(cached.data)
      response.headers.set('X-Cache', 'HIT')
      response.headers.set('X-Cache-Age', cacheAge.toString())
      response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
      return response
    }
    
    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Get teacher's assigned students (filtered by class if specified)
    let teacherStudentIds: string[] = []

    if (classId && classId !== 'all') {
      // Get students assigned to the specific class
      const { data: classStudents, error: classStudentsError } = await supabaseAdmin
        .from('student_class_assignments')
        .select('student_id')
        .eq('class_id', classId)
        .eq('is_active', true)

      if (classStudentsError) {
        console.error('Error fetching class students:', classStudentsError)
        return NextResponse.json({ error: 'Failed to fetch class students' }, { status: 500 })
      }

      teacherStudentIds = classStudents?.map(cs => cs.student_id) || []
    } else {
      // Get all students from teacher's assigned classes
      const { data: teacherAssignments, error: assignmentsError } = await supabaseAdmin
        .from('teacher_class_assignments')
        .select('class_id')
        .eq('teacher_id', user.id)
        .eq('is_active', true)

      if (assignmentsError) {
        console.error('Error fetching teacher assignments:', assignmentsError)
        return NextResponse.json({ error: 'Failed to fetch teacher assignments' }, { status: 500 })
      }

      const classIds = teacherAssignments?.map(ta => ta.class_id) || []
      
      if (classIds.length === 0) {
        // Teacher has no assigned classes
        const emptyResponse = {
          metrics: {
            classAverage: 0,
            totalResponses: 0,
            trendDirection: 'stable',
            trendPercentage: 0,
            moodDistribution: {},
            riskLevel: 'low',
            interventionSuggestions: ['No assigned classes found']
          },
          studentInsights: []
        }
        return NextResponse.json(emptyResponse)
      }

      // Get all students from teacher's classes
      const { data: allClassStudents, error: allClassStudentsError } = await supabaseAdmin
        .from('student_class_assignments')
        .select('student_id')
        .in('class_id', classIds)
        .eq('is_active', true)

      if (allClassStudentsError) {
        console.error('Error fetching all class students:', allClassStudentsError)
        return NextResponse.json({ error: 'Failed to fetch class students' }, { status: 500 })
      }

      teacherStudentIds = Array.from(new Set(allClassStudents?.map(cs => cs.student_id) || [])) // Remove duplicates
    }

    if (teacherStudentIds.length === 0) {
      // No students found
      const emptyResponse = {
        metrics: {
          classAverage: 0,
          totalResponses: 0,
          trendDirection: 'stable',
          trendPercentage: 0,
          moodDistribution: {},
          riskLevel: 'low',
          interventionSuggestions: ['No students found in selected class(es)']
        },
        studentInsights: []
      }
      return NextResponse.json(emptyResponse)
    }

    // Get student profiles for basic info
    const { data: studentProfiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, grade_level')
      .in('user_id', teacherStudentIds)
      .eq('role', 'student')

    if (profilesError) {
      console.error('Error fetching student profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch student profiles' }, { status: 500 })
    }

    // Get comprehensive wellbeing analytics from the enhanced table
    const { data: wellbeingAnalytics, error: analyticsError } = await supabaseAdmin
      .from('student_wellbeing_analytics_enhanced')
      .select(`
        student_id,
        analysis_date,
        period_type,
        overall_wellbeing_score,
        emotional_wellbeing_score,
        academic_wellbeing_score,
        engagement_wellbeing_score,
        social_wellbeing_score,
        behavioral_wellbeing_score,
        risk_level,
        risk_score,
        risk_trend,
        risk_factors,
        critical_risk_factors,
        protective_factors,
        mood_score_avg,
        mood_trend,
        positive_mood_count,
        negative_mood_count,
        neutral_mood_count,
        attendance_rate,
        gpa,
        academic_trend,
        intervention_recommended,
        intervention_priority,
        recommended_actions,
        early_warning_flags,
        overall_score_trend,
        score_change_from_previous
      `)
      .in('student_id', teacherStudentIds)
      .eq('school_id', profile.school_id)
      .gte('analysis_date', startDate.toISOString().split('T')[0])
      .eq('period_type', 'weekly') // Use weekly analytics for dashboard
      .order('analysis_date', { ascending: false })

    if (analyticsError) {
      console.error('Error fetching wellbeing analytics:', analyticsError)
      return NextResponse.json({ error: 'Failed to fetch wellbeing analytics' }, { status: 500 })
    }

    // Calculate class metrics from analytics data
    const validAnalytics = wellbeingAnalytics?.filter(a => a.overall_wellbeing_score != null) || []
    
    // Calculate class average from overall wellbeing scores
    const classAverage = validAnalytics.length > 0 
      ? validAnalytics.reduce((sum, a) => sum + (a.overall_wellbeing_score || 0), 0) / validAnalytics.length
      : 7.0

    // Calculate mood distribution from analytics
    const moodDistribution = {
      happy: 0, excited: 0, calm: 0, sad: 0, angry: 0, anxious: 0
    }

    validAnalytics.forEach(analytics => {
      const positive = analytics.positive_mood_count || 0
      const negative = analytics.negative_mood_count || 0
      const neutral = analytics.neutral_mood_count || 0
      const total = positive + negative + neutral

      if (total > 0) {
        moodDistribution.happy += Math.round((positive / total) * 100)
        moodDistribution.sad += Math.round((negative / total) * 100)
        moodDistribution.calm += Math.round((neutral / total) * 100)
      }
    })

    // Calculate trend from score changes
    const scoresWithChange = validAnalytics.filter(a => a.score_change_from_previous != null)
    const avgScoreChange = scoresWithChange.length > 0
      ? scoresWithChange.reduce((sum, a) => sum + (a.score_change_from_previous || 0), 0) / scoresWithChange.length
      : 0

    const trendDirection = avgScoreChange > 0.5 ? 'up' : avgScoreChange < -0.5 ? 'down' : 'stable'
    const trendPercentage = Math.abs(avgScoreChange * 10) // Convert to percentage-like value

    // Determine overall risk level from individual risk levels
    const riskCounts = { thriving: 0, low: 0, medium: 0, high: 0, critical: 0 }
    validAnalytics.forEach(a => {
      if (a.risk_level && riskCounts.hasOwnProperty(a.risk_level)) {
        riskCounts[a.risk_level as keyof typeof riskCounts]++
      }
    })

    let riskLevel: 'low' | 'medium' | 'high' = 'low'
    const totalStudents = validAnalytics.length
    if (totalStudents > 0) {
      const highRiskPercentage = ((riskCounts.high + riskCounts.critical) / totalStudents) * 100
      const mediumRiskPercentage = (riskCounts.medium / totalStudents) * 100
      
      if (highRiskPercentage > 20 || riskCounts.critical > 0) riskLevel = 'high'
      else if (highRiskPercentage > 10 || mediumRiskPercentage > 30) riskLevel = 'medium'
    }

    // Generate intervention suggestions based on analytics
    const interventionSuggestions: string[] = []
    const allRecommendedActions = validAnalytics
      .filter(a => a.recommended_actions && Array.isArray(a.recommended_actions))
      .flatMap(a => a.recommended_actions || [])
    
    const actionCounts = allRecommendedActions.reduce((acc: any, action: string) => {
      acc[action] = (acc[action] || 0) + 1
      return acc
    }, {})

    // Get top 3 most common recommendations
    const topActions = Object.entries(actionCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([action]) => action)

    if (topActions.length > 0) {
      interventionSuggestions.push(...topActions)
    } else {
      // Default suggestions based on risk level
      if (riskLevel === 'high') {
        interventionSuggestions.push(
          "Implement immediate intervention strategies",
          "Schedule individual student meetings",
          "Contact parents for high-risk students"
        )
      } else if (riskLevel === 'medium') {
        interventionSuggestions.push(
          "Monitor student progress closely",
          "Implement preventive support measures",
          "Consider group intervention activities"
        )
      } else {
        interventionSuggestions.push(
          "Maintain current positive environment",
          "Continue regular wellbeing monitoring",
          "Celebrate student achievements"
        )
      }
    }

    // Generate student insights from analytics data
    const studentInsights = studentProfiles?.map(student => {
      const studentAnalytics = validAnalytics.find(a => a.student_id === student.user_id)
      
      if (!studentAnalytics) {
        return {
          id: student.user_id,
          name: `${student.first_name} ${student.last_name}`,
          grade: student.grade_level || 'N/A',
          wellbeingScore: 7.0,
          recentMoods: ['😊', '😌', '😊'],
          riskLevel: 'low' as const,
          concerns: ['No recent analytics data available'],
          strengths: [],
          lastCheckIn: new Date().toISOString(),
          attendanceRate: 85,
          engagementLevel: 75,
          dominantMood: 'happy'
        }
      }

      // Generate mock recent moods based on mood scores
      const moodScore = studentAnalytics.mood_score_avg || 7
      const recentMoods: string[] = []
      for (let i = 0; i < 7; i++) {
        if (moodScore >= 8) recentMoods.push('😊')
        else if (moodScore >= 6) recentMoods.push('😌')
        else if (moodScore >= 4) recentMoods.push('😐')
        else recentMoods.push('😢')
      }

      const concerns: string[] = []
      const strengths: string[] = []

      // Extract concerns from risk factors and warning flags
      if (studentAnalytics.critical_risk_factors && Array.isArray(studentAnalytics.critical_risk_factors)) {
        concerns.push(...studentAnalytics.critical_risk_factors)
      }
      if (studentAnalytics.early_warning_flags && Array.isArray(studentAnalytics.early_warning_flags)) {
        concerns.push(...studentAnalytics.early_warning_flags.slice(0, 2)) // Limit to 2
      }

      // Extract strengths from protective factors
      if (studentAnalytics.protective_factors && typeof studentAnalytics.protective_factors === 'object') {
        const factors = Array.isArray(studentAnalytics.protective_factors) 
          ? studentAnalytics.protective_factors 
          : Object.values(studentAnalytics.protective_factors)
        strengths.push(...factors.slice(0, 3)) // Limit to 3
      }

      // Add default strengths if none found
      if (strengths.length === 0) {
        if ((studentAnalytics.overall_wellbeing_score || 0) >= 8) {
          strengths.push('High overall wellbeing score')
        }
        if ((studentAnalytics.attendance_rate || 0) >= 90) {
          strengths.push('Excellent attendance')
        }
        if ((studentAnalytics.academic_wellbeing_score || 0) >= 8) {
          strengths.push('Strong academic performance')
        }
      }

      // Map analytics risk level to our format
      let studentRiskLevel: 'low' | 'medium' | 'high' = 'low'
      const analyticsRisk = studentAnalytics.risk_level
      if (analyticsRisk === 'high' || analyticsRisk === 'critical') {
        studentRiskLevel = 'high'
      } else if (analyticsRisk === 'medium') {
        studentRiskLevel = 'medium'
      }

      return {
        id: student.user_id,
        name: `${student.first_name} ${student.last_name}`,
        grade: student.grade_level || 'N/A',
        wellbeingScore: Math.round((studentAnalytics.overall_wellbeing_score || 7.0) * 10) / 10,
        recentMoods,
        riskLevel: studentRiskLevel,
        concerns,
        strengths,
        lastCheckIn: studentAnalytics.analysis_date || new Date().toISOString(),
        attendanceRate: Math.round((studentAnalytics.attendance_rate || 85) * 100) / 100,
        engagementLevel: Math.round((studentAnalytics.engagement_wellbeing_score || 7.5) * 10),
        dominantMood: moodScore >= 8 ? 'happy' : moodScore >= 6 ? 'calm' : moodScore >= 4 ? 'neutral' : 'sad'
      }
    }).filter(student => student.riskLevel === 'high' || student.concerns.length > 0)
      .sort((a: any, b: any) => {
        const riskOrder: Record<string, number> = { high: 3, medium: 2, low: 1 }
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
      }) || []

    const metrics = {
      classAverage: Math.round(classAverage * 10) / 10,
      totalResponses: validAnalytics.length,
      trendDirection,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
      moodDistribution,
      riskLevel,
      interventionSuggestions
    }

    const responseData = {
      metrics,
      studentInsights: studentInsights.slice(0, 20) // Limit to top 20 students needing attention
    }

    // Store in cache
    wellbeingCache.set(cacheKey, { data: responseData, timestamp: Date.now() })
    
    // Clean old cache entries (keep last 50)
    if (wellbeingCache.size > 50) {
      const entries = Array.from(wellbeingCache.entries())
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      wellbeingCache.clear()
      entries.slice(0, 50).forEach(([key, value]) => wellbeingCache.set(key, value))
    }

    const response = NextResponse.json(responseData)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    
    return response

  } catch (error: any) {
    console.error('Unexpected error in wellbeing analytics API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
