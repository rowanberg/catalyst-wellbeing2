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
        'x-application-name': 'teacher-student-detail',
      },
    },
  }
)

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, school_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Teacher access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID required' }, { status: 400 })
    }

    // Verify teacher has access to this student
    const { data: teacherAssignments, error: assignmentsError } = await supabaseAdmin
      .from('teacher_class_assignments')
      .select('class_id')
      .eq('teacher_id', user.id)
      .eq('is_active', true)

    if (assignmentsError) {
      return NextResponse.json({ error: 'Failed to verify teacher access' }, { status: 500 })
    }

    const classIds = teacherAssignments?.map(ta => ta.class_id) || []
    
    if (classIds.length === 0) {
      return NextResponse.json({ error: 'No assigned classes found' }, { status: 403 })
    }

    // Check if student is in teacher's classes
    const { data: studentClassCheck, error: classCheckError } = await supabaseAdmin
      .from('student_class_assignments')
      .select('student_id')
      .eq('student_id', studentId)
      .in('class_id', classIds)
      .eq('is_active', true)
      .limit(1)

    if (classCheckError || !studentClassCheck || studentClassCheck.length === 0) {
      return NextResponse.json({ error: 'Student not in your assigned classes' }, { status: 403 })
    }

    // Get student profile
    const { data: studentProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('user_id, first_name, last_name, grade_level, class_name')
      .eq('user_id', studentId)
      .eq('role', 'student')
      .single()

    if (profileErr || !studentProfile) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Get comprehensive wellbeing analytics
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('student_wellbeing_analytics_enhanced')
      .select(`
        *
      `)
      .eq('student_id', studentId)
      .eq('school_id', profile.school_id)
      .order('analysis_date', { ascending: false })
      .limit(10) // Get last 10 analytics records

    if (analyticsError) {
      console.error('Error fetching student analytics:', analyticsError)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    // Get recent mood data
    const { data: moodData, error: moodError } = await supabaseAdmin
      .from('mood_tracking')
      .select('mood, mood_emoji, date, created_at')
      .eq('user_id', studentId)
      .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]) // Last 30 days
      .order('date', { ascending: false })

    if (moodError) {
      console.error('Error fetching mood data:', moodError)
    }

    // Get help requests
    const { data: helpRequests, error: helpError } = await supabaseAdmin
      .from('help_requests')
      .select('message, urgency, status, created_at')
      .eq('student_id', studentId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      .order('created_at', { ascending: false })

    if (helpError) {
      console.error('Error fetching help requests:', helpError)
    }

    // Get class assignments for context
    const { data: classAssignments, error: classAssignError } = await supabaseAdmin
      .from('student_class_assignments')
      .select(`
        class_id,
        classes (
          class_name,
          subject,
          grade_level_id
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true)

    if (classAssignError) {
      console.error('Error fetching class assignments:', classAssignError)
    }

    // Process analytics data
    const latestAnalytics = analytics?.[0]
    const historicalAnalytics = analytics?.slice(1) || []

    // Calculate trends
    const calculateTrend = (current: number | null, previous: number | null) => {
      if (!current || !previous) return 'stable'
      const change = current - previous
      if (change > 0.5) return 'improving'
      if (change < -0.5) return 'declining'
      return 'stable'
    }

    // Process mood data for visualization
    const moodHistory = moodData?.slice(0, 14).map(m => ({
      date: m.date,
      mood: m.mood,
      emoji: m.mood_emoji,
      timestamp: m.created_at
    })) || []

    // Calculate mood statistics
    const moodStats = {
      totalEntries: moodData?.length || 0,
      positiveCount: moodData?.filter(m => ['happy', 'excited', 'calm'].includes(m.mood)).length || 0,
      negativeCount: moodData?.filter(m => ['sad', 'angry', 'anxious'].includes(m.mood)).length || 0,
      neutralCount: moodData?.filter(m => ['neutral', 'tired'].includes(m.mood)).length || 0
    }

    // Process help requests
    const helpStats = {
      totalRequests: helpRequests?.length || 0,
      urgentRequests: helpRequests?.filter(hr => hr.urgency === 'high').length || 0,
      resolvedRequests: helpRequests?.filter(hr => hr.status === 'resolved').length || 0,
      pendingRequests: helpRequests?.filter(hr => hr.status === 'pending').length || 0
    }

    // Generate intelligent insights based on data patterns
    const generateInsights = (analytics: any, moodData: any[], helpRequests: any[]) => {
      const insights: Array<{
        type: string
        level: string
        title: string
        message: string
        suggestion: string
      }> = []
      const now = new Date()
      
      // Activity patterns
      const lastMoodEntry = moodData?.[0]
      const daysSinceLastMood = lastMoodEntry 
        ? Math.floor((now.getTime() - new Date(lastMoodEntry.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null

      if (daysSinceLastMood !== null) {
        if (daysSinceLastMood > 7) {
          insights.push({
            type: 'activity',
            level: 'info',
            title: 'Low Recent Activity',
            message: `No mood entries for ${daysSinceLastMood} days. Student may be busy with other activities, assignments, or personal commitments.`,
            suggestion: 'Consider a gentle check-in to ensure they\'re managing their workload well.'
          })
        } else if (daysSinceLastMood > 3) {
          insights.push({
            type: 'activity',
            level: 'info',
            title: 'Reduced Engagement',
            message: `Last mood entry was ${daysSinceLastMood} days ago. This could indicate increased focus on studies or other priorities.`,
            suggestion: 'Normal pattern - student may be in a focused work period.'
          })
        }
      }

      // Academic performance insights
      if (analytics?.gpa) {
        if (analytics.gpa >= 3.5) {
          insights.push({
            type: 'academic',
            level: 'positive',
            title: 'Strong Academic Performance',
            message: `Excellent GPA of ${analytics.gpa.toFixed(2)} indicates consistent academic achievement.`,
            suggestion: 'Continue supporting their academic excellence and consider leadership opportunities.'
          })
        } else if (analytics.gpa < 2.5) {
          insights.push({
            type: 'academic',
            level: 'concern',
            title: 'Academic Support Needed',
            message: `GPA of ${analytics.gpa.toFixed(2)} suggests academic challenges that may be affecting wellbeing.`,
            suggestion: 'Consider academic support resources and check for underlying issues.'
          })
        }
      }

      // Attendance patterns
      if (analytics?.attendanceRate) {
        if (analytics.attendanceRate < 80) {
          insights.push({
            type: 'attendance',
            level: 'concern',
            title: 'Attendance Concerns',
            message: `${analytics.attendanceRate.toFixed(1)}% attendance may indicate health issues, family responsibilities, or disengagement.`,
            suggestion: 'Reach out to understand barriers to attendance and provide appropriate support.'
          })
        } else if (analytics.attendanceRate >= 95) {
          insights.push({
            type: 'attendance',
            level: 'positive',
            title: 'Excellent Attendance',
            message: `Outstanding ${analytics.attendanceRate.toFixed(1)}% attendance shows strong commitment and engagement.`,
            suggestion: 'Acknowledge their dedication and use as a positive example.'
          })
        }
      }

      // Mood patterns
      if (moodData && moodData.length > 0) {
        const recentMoods = moodData.slice(0, 7)
        const negativeMoods = recentMoods.filter(m => ['sad', 'angry', 'anxious', 'stressed'].includes(m.mood))
        
        if (negativeMoods.length >= 4) {
          insights.push({
            type: 'emotional',
            level: 'concern',
            title: 'Emotional Support Needed',
            message: `${negativeMoods.length} negative mood entries in recent days suggests emotional challenges.`,
            suggestion: 'Consider counseling resources or a private conversation to offer support.'
          })
        } else if (negativeMoods.length === 0 && recentMoods.length >= 5) {
          insights.push({
            type: 'emotional',
            level: 'positive',
            title: 'Positive Emotional State',
            message: 'Consistent positive moods indicate good emotional wellbeing and life balance.',
            suggestion: 'Great emotional stability - continue current support strategies.'
          })
        }
      }

      // Help-seeking behavior
      if (helpRequests && helpRequests.length > 0) {
        const recentUrgent = helpRequests.filter(hr => hr.urgency === 'high' && 
          new Date(hr.created_at) > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        
        if (recentUrgent.length > 0) {
          insights.push({
            type: 'support',
            level: 'urgent',
            title: 'Recent Urgent Help Requests',
            message: `${recentUrgent.length} urgent help request(s) in the past week indicates immediate support needs.`,
            suggestion: 'Priority follow-up required - ensure urgent needs are being addressed.'
          })
        } else if (helpRequests.length > 0) {
          insights.push({
            type: 'support',
            level: 'positive',
            title: 'Healthy Help-Seeking',
            message: 'Student demonstrates good self-advocacy by reaching out when needed.',
            suggestion: 'Positive behavior - continue encouraging open communication.'
          })
        }
      } else {
        insights.push({
          type: 'support',
          level: 'info',
          title: 'Independent Learning Style',
          message: 'No recent help requests may indicate independence, self-reliance, or reluctance to seek help.',
          suggestion: 'Check in periodically to ensure they know support is available when needed.'
        })
      }

      // Engagement patterns
      if (analytics?.questCompletionRate !== undefined) {
        if (analytics.questCompletionRate < 50) {
          insights.push({
            type: 'engagement',
            level: 'concern',
            title: 'Low Task Completion',
            message: `${analytics.questCompletionRate.toFixed(1)}% completion rate may indicate overwhelm, lack of interest, or competing priorities.`,
            suggestion: 'Explore barriers to completion and consider adjusting workload or approach.'
          })
        } else if (analytics.questCompletionRate >= 90) {
          insights.push({
            type: 'engagement',
            level: 'positive',
            title: 'High Task Engagement',
            message: `Excellent ${analytics.questCompletionRate.toFixed(1)}% completion rate shows strong motivation and time management.`,
            suggestion: 'Outstanding engagement - consider additional challenges or leadership roles.'
          })
        }
      }

      return insights
    }

    // Build comprehensive student detail
    const studentDetail = {
      // Basic Info
      id: studentProfile.user_id,
      name: `${studentProfile.first_name} ${studentProfile.last_name}`,
      firstName: studentProfile.first_name,
      lastName: studentProfile.last_name,
      grade: studentProfile.grade_level || 'N/A',
      
      // Classes
      classes: classAssignments?.map((ca: any) => ({
        id: ca.class_id,
        name: ca.classes?.class_name || 'Unknown',
        subject: ca.classes?.subject || 'Unknown'
      })) || [],

      // Current Analytics (Latest)
      currentAnalytics: latestAnalytics ? {
        analysisDate: latestAnalytics.analysis_date,
        overallWellbeingScore: latestAnalytics.overall_wellbeing_score,
        emotionalWellbeingScore: latestAnalytics.emotional_wellbeing_score,
        academicWellbeingScore: latestAnalytics.academic_wellbeing_score,
        engagementWellbeingScore: latestAnalytics.engagement_wellbeing_score,
        socialWellbeingScore: latestAnalytics.social_wellbeing_score,
        behavioralWellbeingScore: latestAnalytics.behavioral_wellbeing_score,
        riskLevel: latestAnalytics.risk_level,
        riskScore: latestAnalytics.risk_score,
        riskTrend: latestAnalytics.risk_trend,
        attendanceRate: latestAnalytics.attendance_rate,
        gpa: latestAnalytics.gpa,
        academicTrend: latestAnalytics.academic_trend,
        moodScoreAvg: latestAnalytics.mood_score_avg,
        moodTrend: latestAnalytics.mood_trend,
        stressLevelAvg: latestAnalytics.stress_level_avg,
        anxietyIndicatorsCount: latestAnalytics.anxiety_indicators_count,
        happinessIndicatorsCount: latestAnalytics.happiness_indicators_count,
        interventionRecommended: latestAnalytics.intervention_recommended,
        interventionPriority: latestAnalytics.intervention_priority,
        recommendedActions: latestAnalytics.recommended_actions || [],
        riskFactors: latestAnalytics.risk_factors || [],
        criticalRiskFactors: latestAnalytics.critical_risk_factors || [],
        protectiveFactors: latestAnalytics.protective_factors || [],
        earlyWarningFlags: latestAnalytics.early_warning_flags || [],
        resilienceScore: latestAnalytics.resilience_score,
        questCompletionRate: latestAnalytics.quest_completion_rate,
        xpEarned: latestAnalytics.xp_earned,
        level: latestAnalytics.level,
        achievementCount: latestAnalytics.achievement_count,
        gratitudeEntriesCount: latestAnalytics.gratitude_entries_count,
        kindnessActsCount: latestAnalytics.kindness_acts_count,
        peerInteractionScore: latestAnalytics.peer_interaction_score,
        collaborationScore: latestAnalytics.collaboration_score,
        incidentCount: latestAnalytics.incident_count,
        helpRequestsCount: latestAnalytics.help_requests_count,
        urgentHelpRequestsCount: latestAnalytics.urgent_help_requests_count,
        selfAdvocacyScore: latestAnalytics.self_advocacy_score
      } : null,

      // Historical Trends
      trends: {
        wellbeingTrend: calculateTrend(
          latestAnalytics?.overall_wellbeing_score,
          historicalAnalytics[0]?.overall_wellbeing_score
        ),
        academicTrend: calculateTrend(
          latestAnalytics?.academic_wellbeing_score,
          historicalAnalytics[0]?.academic_wellbeing_score
        ),
        emotionalTrend: calculateTrend(
          latestAnalytics?.emotional_wellbeing_score,
          historicalAnalytics[0]?.emotional_wellbeing_score
        ),
        engagementTrend: calculateTrend(
          latestAnalytics?.engagement_wellbeing_score,
          historicalAnalytics[0]?.engagement_wellbeing_score
        ),
        riskTrend: latestAnalytics?.risk_trend || 'stable'
      },

      // Mood Data
      moodHistory,
      moodStats,

      // Help & Support
      helpRequests: helpRequests?.slice(0, 5).map(hr => ({
        message: hr.message,
        urgency: hr.urgency,
        status: hr.status,
        createdAt: hr.created_at
      })) || [],
      helpStats,

      // Historical Analytics for Charts
      historicalData: historicalAnalytics.map(h => ({
        date: h.analysis_date,
        overallScore: h.overall_wellbeing_score,
        emotionalScore: h.emotional_wellbeing_score,
        academicScore: h.academic_wellbeing_score,
        engagementScore: h.engagement_wellbeing_score,
        riskScore: h.risk_score,
        attendanceRate: h.attendance_rate
      })),

      // Intelligent Insights
      insights: generateInsights(latestAnalytics, moodData || [], helpRequests || [])
    }

    return NextResponse.json({
      success: true,
      student: studentDetail
    })

  } catch (error) {
    console.error('Error in student detail API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
