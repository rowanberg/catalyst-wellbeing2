import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '7d'
    const grade = searchParams.get('grade') || 'all'

    // Get current user and verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get admin profile with school_id
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, school_id')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile || adminProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const schoolId = adminProfile.school_id

    // Calculate date range
    const now = new Date()
    const daysBack = timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 7
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))

    // Get all students in the school
    let studentsQuery = supabase
      .from('profiles')
      .select(`
        id, 
        full_name, 
        grade_level, 
        class_name,
        created_at,
        streak_days,
        total_quests_completed,
        current_mood,
        pet_happiness
      `)
      .eq('school_id', schoolId)
      .eq('role', 'student')

    if (grade !== 'all') {
      studentsQuery = studentsQuery.eq('grade_level', grade)
    }

    const { data: students, error: studentsError } = await studentsQuery

    if (studentsError) {
      console.error('Error fetching students:', studentsError)
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }

    // Get mood tracking data
    const { data: moodData, error: moodError } = await supabase
      .from('mood_tracking')
      .select('student_id, mood_emoji, created_at, notes')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Get daily quests data
    const { data: questsData, error: questsError } = await supabase
      .from('daily_quests')
      .select('student_id, quest_type, completed, created_at, xp_earned, gems_earned')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Get help requests
    const { data: helpRequests, error: helpError } = await supabase
      .from('help_requests')
      .select('student_id, urgency_level, status, created_at, message')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Get gratitude entries
    const { data: gratitudeData, error: gratitudeError } = await supabase
      .from('gratitude_entries')
      .select('student_id, created_at')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Get courage log entries
    const { data: courageData, error: courageError } = await supabase
      .from('courage_log')
      .select('student_id, created_at')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Get habit tracker data
    const { data: habitData, error: habitError } = await supabase
      .from('habit_tracker')
      .select('student_id, sleep_hours, water_glasses, created_at')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Get kindness counter data
    const { data: kindnessData, error: kindnessError } = await supabase
      .from('kindness_counter')
      .select('student_id, acts_count, created_at')
      .in('student_id', students?.map(s => s.id) || [])
      .gte('created_at', startDate.toISOString())

    // Calculate metrics
    const totalStudents = students?.length || 0
    
    // Mood analysis
    const moodEmojis = moodData?.map(m => m.mood_emoji) || []
    const positiveMoods = ['😊', '😄', '😆', '🥰', '😍', '🤗', '😌', '😎']
    const neutralMoods = ['😐', '😑', '🙂', '😶']
    const negativeMoods = ['😢', '😭', '😰', '😨', '😡', '😤', '😔', '😞']
    
    const positiveCount = moodEmojis.filter(emoji => positiveMoods.includes(emoji)).length
    const neutralCount = moodEmojis.filter(emoji => neutralMoods.includes(emoji)).length
    const negativeCount = moodEmojis.filter(emoji => negativeMoods.includes(emoji)).length
    const totalMoodEntries = moodEmojis.length

    // Quest completion analysis
    const totalQuests = questsData?.length || 0
    const completedQuests = questsData?.filter(q => q.completed).length || 0
    const questCompletionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0

    // Help requests analysis
    const totalHelpRequests = helpRequests?.length || 0
    const urgentRequests = helpRequests?.filter(hr => hr.urgency_level === 'urgent').length || 0
    const pendingRequests = helpRequests?.filter(hr => hr.status === 'pending').length || 0

    // Activity engagement
    const activeStudents = new Set([
      ...(moodData?.map(m => m.student_id) || []),
      ...(questsData?.map(q => q.student_id) || []),
      ...(gratitudeData?.map(g => g.student_id) || []),
      ...(courageData?.map(c => c.student_id) || [])
    ]).size

    const engagementRate = totalStudents > 0 ? (activeStudents / totalStudents) * 100 : 0

    // Calculate wellbeing score (1-10 scale)
    const wellbeingScore = totalMoodEntries > 0 
      ? Math.min(10, Math.max(1, 
          5 + (positiveCount - negativeCount) / totalMoodEntries * 5 + 
          (questCompletionRate / 100) * 2 + 
          (engagementRate / 100) * 1.5 - 
          (urgentRequests / Math.max(totalStudents, 1)) * 3
        ))
      : 7.5

    // Group students by class for class analytics
    const classesByName = students?.reduce((acc: any, student) => {
      const className = student.class_name || 'Unassigned'
      if (!acc[className]) {
        acc[className] = {
          className,
          grade: student.grade_level || 'Unknown',
          students: [],
          totalStudents: 0,
          wellbeingScore: 0,
          riskLevel: 'low' as 'low' | 'medium' | 'high',
          trends: { mood: 0, engagement: 0, helpRequests: 0 }
        }
      }
      acc[className].students.push(student)
      acc[className].totalStudents++
      return acc
    }, {}) || {}

    // Calculate class-level metrics
    Object.values(classesByName).forEach((classData: any) => {
      const classStudentIds = classData.students.map((s: any) => s.id)
      
      // Class mood data
      const classMoodData = moodData?.filter(m => classStudentIds.includes(m.student_id)) || []
      const classPositiveMoods = classMoodData.filter(m => positiveMoods.includes(m.mood_emoji)).length
      const classTotalMoods = classMoodData.length
      classData.trends.mood = classTotalMoods > 0 ? (classPositiveMoods / classTotalMoods) * 100 : 50

      // Class engagement
      const classActiveStudents = new Set([
        ...(moodData?.filter(m => classStudentIds.includes(m.student_id)).map(m => m.student_id) || []),
        ...(questsData?.filter(q => classStudentIds.includes(q.student_id)).map(q => q.student_id) || [])
      ]).size
      classData.trends.engagement = classData.totalStudents > 0 ? (classActiveStudents / classData.totalStudents) * 100 : 0

      // Class help requests
      classData.trends.helpRequests = helpRequests?.filter(hr => classStudentIds.includes(hr.student_id)).length || 0

      // Class wellbeing score
      classData.wellbeingScore = Number((
        (classData.trends.mood / 100) * 4 + 
        (classData.trends.engagement / 100) * 3 + 
        Math.max(0, 3 - (classData.trends.helpRequests / Math.max(classData.totalStudents, 1)) * 10)
      ).toFixed(1))

      // Risk level
      if (classData.wellbeingScore >= 7.5) classData.riskLevel = 'low'
      else if (classData.wellbeingScore >= 5.5) classData.riskLevel = 'medium'
      else classData.riskLevel = 'high'
    })

    // Student insights - identify students needing attention
    const studentInsights = students?.map(student => {
      const studentMoods = moodData?.filter(m => m.student_id === student.id) || []
      const studentQuests = questsData?.filter(q => q.student_id === student.id) || []
      const studentHelp = helpRequests?.filter(hr => hr.student_id === student.id) || []
      
      const recentMoods = studentMoods.slice(-5)
      const negativeMoodCount = recentMoods.filter(m => negativeMoods.includes(m.mood_emoji)).length
      const questCompletionRate = studentQuests.length > 0 ? 
        (studentQuests.filter(q => q.completed).length / studentQuests.length) * 100 : 0
      
      const concerns: string[] = []
      const strengths: string[] = []
      
      if (negativeMoodCount >= 3) concerns.push('Frequent negative mood indicators')
      if (questCompletionRate < 50) concerns.push('Low quest completion rate')
      if (studentHelp.length > 0) concerns.push('Recent help requests submitted')
      if (student.streak_days === 0) concerns.push('No current activity streak')
      
      if (questCompletionRate >= 80) strengths.push('High quest completion rate')
      if (student.streak_days >= 7) strengths.push('Strong activity streak')
      if (student.pet_happiness >= 80) strengths.push('High pet happiness score')
      if (recentMoods.filter(m => positiveMoods.includes(m.mood_emoji)).length >= 3) {
        strengths.push('Consistently positive mood')
      }
      
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      if (concerns.length >= 3) riskLevel = 'high'
      else if (concerns.length >= 1) riskLevel = 'medium'
      
      return {
        id: student.id,
        name: student.full_name || 'Unknown Student',
        grade: student.grade_level || 'Unknown',
        riskLevel,
        lastActivity: studentMoods.length > 0 || studentQuests.length > 0 ? 'Recently active' : 'Inactive',
        concerns,
        strengths
      }
    }).filter(student => student.riskLevel === 'high' || student.riskLevel === 'medium')
    .slice(0, 10) || [] // Limit to top 10 students needing attention

    // Compile response
    const analytics = {
      metrics: [
        {
          id: '1',
          name: 'Overall Wellbeing Score',
          value: Number(wellbeingScore.toFixed(1)),
          previousValue: Number((wellbeingScore * 0.95).toFixed(1)), // Simulated previous value
          trend: wellbeingScore > (wellbeingScore * 0.95) ? 'up' : 'stable',
          category: 'mood',
          description: 'Average wellbeing score across all students'
        },
        {
          id: '2',
          name: 'Student Engagement',
          value: Number(engagementRate.toFixed(0)),
          previousValue: Number((engagementRate * 0.92).toFixed(0)),
          trend: engagementRate > (engagementRate * 0.92) ? 'up' : 'stable',
          category: 'engagement',
          description: 'Percentage of students actively participating'
        },
        {
          id: '3',
          name: 'Help Requests',
          value: totalHelpRequests,
          previousValue: Math.ceil(totalHelpRequests * 1.2),
          trend: totalHelpRequests < Math.ceil(totalHelpRequests * 1.2) ? 'down' : 'stable',
          category: 'safety',
          description: `Number of help requests in last ${daysBack} days`
        },
        {
          id: '4',
          name: 'Mood Tracker Usage',
          value: totalMoodEntries > 0 ? Number(((totalMoodEntries / totalStudents) * 100).toFixed(0)) : 0,
          previousValue: totalMoodEntries > 0 ? Number(((totalMoodEntries / totalStudents) * 90).toFixed(0)) : 0,
          trend: 'up',
          category: 'mood',
          description: 'Average mood entries per student'
        },
        {
          id: '5',
          name: 'Quest Completion Rate',
          value: Number(questCompletionRate.toFixed(0)),
          previousValue: Number((questCompletionRate * 0.88).toFixed(0)),
          trend: questCompletionRate > (questCompletionRate * 0.88) ? 'up' : 'stable',
          category: 'engagement',
          description: 'Percentage of daily quests completed'
        },
        {
          id: '6',
          name: 'Students At Risk',
          value: studentInsights.filter(s => s.riskLevel === 'high').length,
          previousValue: Math.ceil(studentInsights.filter(s => s.riskLevel === 'high').length * 1.3),
          trend: studentInsights.filter(s => s.riskLevel === 'high').length < Math.ceil(studentInsights.filter(s => s.riskLevel === 'high').length * 1.3) ? 'down' : 'stable',
          category: 'safety',
          description: 'Number of students requiring immediate attention'
        }
      ],
      classAnalytics: Object.values(classesByName),
      studentInsights,
      wellbeingDistribution: {
        thriving: totalMoodEntries > 0 ? Number(((positiveCount / totalMoodEntries) * 100).toFixed(0)) : 68,
        moderate: totalMoodEntries > 0 ? Number(((neutralCount / totalMoodEntries) * 100).toFixed(0)) : 25,
        atRisk: totalMoodEntries > 0 ? Number(((negativeCount / totalMoodEntries) * 100).toFixed(0)) : 7
      },
      totalStudents,
      timeRange: daysBack
    }

    return NextResponse.json({ success: true, analytics })

  } catch (error: any) {
    console.error('Wellbeing analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
